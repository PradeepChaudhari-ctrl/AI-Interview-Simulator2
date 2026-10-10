import React, { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface VideoPreviewProps {
  onRecordingComplete?: (blob: Blob) => void;
  isRecording?: boolean;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ isRecording = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err: any) {
        console.warn('Camera permission error:', err);
        setHasPermission(false);
        setErrorMessage(
          err.name === 'NotAllowedError'
            ? 'Camera/Mic permission was denied. Please enable camera permissions in your browser address bar.'
            : 'Unable to access camera or microphone hardware.'
        );
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
      <div className="relative aspect-video bg-black flex items-center justify-center">
        {hasPermission ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`}
          />
        ) : null}

        {(!videoEnabled || !hasPermission) && (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
              <VideoOff className="w-7 h-7" />
            </div>
            <p className="text-slate-400 text-sm max-w-xs">
              {errorMessage || 'Camera is turned off or not accessible'}
            </p>
          </div>
        )}

        {/* Live / Recording Badge */}
        {hasPermission && (
          <div className="absolute top-3 left-3 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-slate-700/60">
            <span
              className={`w-2 h-2 rounded-full ${
                isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
              }`}
            ></span>
            <span className="text-slate-300">
              {isRecording ? 'RECORDING' : 'CAMERA ACTIVE'}
            </span>
          </div>
        )}

        {/* Floating Controls */}
        {hasPermission && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-lg">
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full transition-colors ${
                videoEnabled
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full transition-colors ${
                audioEnabled
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
              title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Privacy Guarantee Note */}
      <div className="p-3 bg-slate-800/40 border-t border-slate-800 flex items-center space-x-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>
          <strong>Privacy Notice:</strong> Video stays private on your local device. We evaluate technical clarity and communication without pseudoscientific emotion inferences.
        </span>
      </div>
    </div>
  );
};
