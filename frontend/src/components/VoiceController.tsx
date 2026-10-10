import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceControllerProps {
  questionText: string;
  onTranscriptUpdate: (text: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

// Window typing for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  questionText,
  onTranscriptUpdate,
  isListening,
  setIsListening,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check speech synthesis
    if (!('speechSynthesis' in window)) {
      setVoiceAvailable(false);
    }

    // Check speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        onTranscriptUpdate(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error === 'no-speech') {
          // ignore silent pause
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakQuestion = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!speechSupported) {
      setErrorMessage('Speech recognition is not supported in this browser. You can type your answer directly.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <button
          onClick={speakQuestion}
          disabled={!voiceAvailable}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
            isSpeaking
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              : 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600'
          }`}
          title="Listen to question"
        >
          {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
        </button>

        <button
          onClick={toggleListening}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isListening
              ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse shadow-lg shadow-red-500/10'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{isListening ? 'Stop Speaking' : 'Answer with Voice'}</span>
        </button>
      </div>

      <div className="text-xs text-slate-400 text-center sm:text-right">
        {isListening ? (
          <span className="flex items-center text-red-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping mr-2"></span>
            Listening... Speak clearly into your mic
          </span>
        ) : (
          <span>Voice recognition active • You can review & edit transcribed text anytime</span>
        )}
      </div>

      {errorMessage && (
        <div className="w-full mt-2 flex items-center space-x-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
