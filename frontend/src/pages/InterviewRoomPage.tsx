import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewService } from '../services/interviewService';
import {
  InterviewSession,
  Question,
  AnswerEvaluation,
  Answer,
} from '../types';
import { VoiceController } from '../components/VoiceController';
import { VideoPreview } from '../components/VideoPreview';
import {
  Clock,
  Send,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Mic,
  Video,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [mode, setMode] = useState<'text' | 'voice' | 'video'>('text');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roundCompletedModal, setRoundCompletedModal] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    loadSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  useEffect(() => {
    // Reset timer on question change
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion?.id]);

  async function loadSession() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await interviewService.getInterview(id);
      setSession(data);
      setMode((data.mode as any) || 'text');

      if (data.status === 'completed') {
        navigate(`/reports/${data.id}`);
        return;
      }

      setCurrentQuestion(data.current_question || null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load interview session.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !answerText.trim() || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const result: Answer = await interviewService.submitAnswer(currentQuestion.id, {
        text_answer: answerText.trim(),
        duration_seconds: elapsedSeconds,
        mode,
      });

      setEvaluation(result.evaluation);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!id) return;
    setEvaluation(null);
    setAnswerText('');
    setLoading(true);

    try {
      // Reload session to inspect round statuses
      const updatedSession = await interviewService.getInterview(id);
      setSession(updatedSession);

      if (updatedSession.status === 'completed') {
        navigate(`/reports/${updatedSession.id}`);
        return;
      }

      const nextQ = await interviewService.getNextQuestion(id);
      if (nextQ) {
        setCurrentQuestion(nextQ);
      } else {
        // If no more questions returned, complete interview
        const finalSession = await interviewService.completeInterview(id);
        navigate(`/reports/${finalSession.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error proceeding to next question.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Entering interview room...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Interview Not Found</h2>
        <p className="text-slate-400 text-sm">{errorMessage}</p>
      </div>
    );
  }

  const currentRound = session.current_round;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Round Progress Bar */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              ROUND {currentRound?.round_order || 1} OF {session.rounds.length}
            </span>
            <span className="font-bold text-white text-base">
              {currentRound?.name || currentRound?.round_type || 'Interview Round'}
            </span>
          </div>
          <p className="text-xs text-slate-400">{currentRound?.objective}</p>
        </div>

        {/* Mode Selector & Timer */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setMode('text')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
                mode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Text</span>
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
                mode === 'voice' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voice</span>
            </button>
            <button
              onClick={() => setMode('video')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
                mode === 'video' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Video</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-mono text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-red-950/50 text-red-300 border border-red-800/70 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Room Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video / Media Preview if Video Mode is Active */}
        {mode === 'video' && (
          <div className="lg:col-span-1 space-y-4">
            <VideoPreview isRecording={submitting} />
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-white block">Video Mode Active</span>
              <p>Keep eye contact with your webcam and speak naturally. Your spoken points can also be transcribed into the answer field.</p>
            </div>
          </div>
        )}

        {/* Center / Right: Question Card & Answer Editor */}
        <div className={`${mode === 'video' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          {currentQuestion ? (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">
                    Q{currentQuestion.question_number}
                  </span>
                  <span className="text-xs text-slate-400">
                    Question {currentQuestion.question_number} of {currentQuestion.total_questions_in_round}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono uppercase bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                    Topic: {currentQuestion.topic}
                  </span>
                  <span className="text-[11px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    {currentQuestion.difficulty}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                  {currentQuestion.question_text}
                </h3>
              </div>

              {/* Voice Controller if in Voice Mode */}
              {mode === 'voice' && (
                <VoiceController
                  questionText={currentQuestion.question_text}
                  onTranscriptUpdate={(transcript) => setAnswerText(transcript)}
                  isListening={isVoiceListening}
                  setIsListening={setIsVoiceListening}
                />
              )}

              {/* Answer Input or Evaluation Result */}
              {!evaluation ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Your Response {mode === 'voice' ? '(Transcribed Speech or Type Below)' : ''}
                    </label>
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      rows={6}
                      placeholder="Explain your approach, design decisions, architectural trade-offs, and technical rationale clearly..."
                      className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      Take your time. Questions adapt dynamically to your answers.
                    </span>

                    <button
                      onClick={handleSubmitAnswer}
                      disabled={submitting || !answerText.trim()}
                      className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
                    >
                      {submitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Gemini is evaluating...</span>
                        </div>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Instant Feedback Evaluation Card */
                <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-6 space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-extrabold text-xl font-mono">
                        {Math.round(evaluation.score)}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-base">Answer Evaluation</h4>
                        <span className="text-xs text-slate-400">
                          Scored across technical depth, correctness, and clarity
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      <span>Proceed to Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Multi-Dimensional Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[11px] text-slate-400 block">Correctness</span>
                      <span className="text-lg font-bold text-white">{evaluation.correctness}%</span>
                    </div>
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[11px] text-slate-400 block">Technical Depth</span>
                      <span className="text-lg font-bold text-white">{evaluation.technical_depth}%</span>
                    </div>
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[11px] text-slate-400 block">Relevance</span>
                      <span className="text-lg font-bold text-white">{evaluation.relevance}%</span>
                    </div>
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[11px] text-slate-400 block">Clarity</span>
                      <span className="text-lg font-bold text-white">{evaluation.clarity}%</span>
                    </div>
                  </div>

                  {/* Observations */}
                  {evaluation.communication_observation && (
                    <div className="text-xs text-slate-300 bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60">
                      <span className="font-semibold text-white block mb-0.5">Observation:</span>
                      {evaluation.communication_observation}
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 bg-emerald-950/20 border border-emerald-800/30 p-3.5 rounded-xl">
                      <span className="font-bold text-emerald-400 block">Demonstrated Strengths</span>
                      <ul className="space-y-1 list-disc list-inside text-slate-300">
                        {evaluation.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 bg-amber-950/20 border border-amber-800/30 p-3.5 rounded-xl">
                      <span className="font-bold text-amber-400 block">Areas to Reinforce</span>
                      <ul className="space-y-1 list-disc list-inside text-slate-300">
                        {evaluation.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Improvement Tip */}
                  {evaluation.improvement_tip && (
                    <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Interview Coaching Tip:</span>
                        <span>{evaluation.improvement_tip}</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Proceed Button */}
                  <button
                    onClick={handleNextQuestion}
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm"
                  >
                    <span>Proceed to Next Question / Adaptive Follow-Up</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-12 text-center space-y-4">
              <Award className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">All Questions Completed!</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Congratulations! You have completed all rounds for this interview session. Click below to view your Readiness Report.
              </p>
              <button
                onClick={() => navigate(`/reports/${session.id}`)}
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30"
              >
                <span>View Full Readiness Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
