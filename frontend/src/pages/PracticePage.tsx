import React, { useState, useEffect } from 'react';
import { practiceService } from '../services/practiceService';
import { PracticeSession, PracticeQuestion, PracticeAnswerItem } from '../types';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  RotateCcw,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const PracticePage: React.FC = () => {
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await practiceService.getHistory();
      setHistory(data);
      if (data.length > 0 && !activeSession) {
        // Find latest incomplete or default to latest
        const inProg = data.find((d) => d.status === 'in_progress') || data[0];
        setActiveSession(inProg);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load practice history.');
    } finally {
      setLoading(false);
    }
  }

  const handleStartDrill = async (topicToUse?: string) => {
    const topic = topicToUse || customTopic.trim();
    if (!topic) return;

    setCreating(true);
    setErrorMessage(null);

    try {
      const newSession = await practiceService.startPractice({
        topic,
        target_role: 'Full Stack Engineer',
        difficulty: 'medium',
      });
      setActiveSession(newSession);
      setHistory([newSession, ...history]);
      setCustomTopic('');
      setCurrentAnswerText('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate practice drill.');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!activeSession || !currentAnswerText.trim() || answering) return;
    setAnswering(true);
    setErrorMessage(null);

    try {
      const updated = await practiceService.answerQuestion(
        activeSession.id,
        questionId,
        currentAnswerText.trim()
      );
      setActiveSession(updated);
      setHistory(history.map((h) => (h.id === updated.id ? updated : h)));
      setCurrentAnswerText('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit practice answer.');
    } finally {
      setAnswering(false);
    }
  };

  const toggleHint = (qId: string) => {
    setRevealedHints((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const suggestedTopics = [
    'Database Indexing & Query Tuning',
    'Concurrency & Race Conditions',
    'Distributed Caching Strategies',
    'REST API Idempotency & HTTP Status Codes',
    'STAR Behavioral Framework for Leadership',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Rapid Skill Reinforcement</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Weakness Practice Center</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Targeted micro-drills to strengthen low-confidence concepts identified in your readiness reports.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-red-950/50 text-red-300 border border-red-800/70 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Launch Bar */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Start a Focused 3-Question Practice Drill</span>
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleStartDrill())}
            placeholder="Enter any topic or concept (e.g. Docker container networking, ACID transactions)..."
            className="flex-1 px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <button
            onClick={() => handleStartDrill()}
            disabled={creating || !customTopic.trim()}
            className="inline-flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-purple-600/30 transition-all whitespace-nowrap"
          >
            {creating ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Drill...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Launch Practice Drill</span>
              </>
            )}
          </button>
        </div>

        {/* Suggested topics pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400">Quick suggestions:</span>
          {suggestedTopics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => handleStartDrill(topic)}
              className="text-xs bg-slate-900/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 px-2.5 py-1 rounded-full transition-all"
            >
              + {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Active Drill + History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Practice Drill Interface */}
        <div className="lg:col-span-2 space-y-6">
          {activeSession ? (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-700/80 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      {activeSession.status === 'completed' ? 'Drill Completed' : 'In Progress'}
                    </span>
                    <h2 className="text-xl font-bold text-white">{activeSession.topic}</h2>
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    Targeted diagnostic review with instant constructive tutoring
                  </span>
                </div>

                {activeSession.score != null && (
                  <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-400 font-mono font-bold text-sm">
                    <Award className="w-4 h-4" />
                    <span>Score: {Math.round(activeSession.score)}%</span>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {(activeSession.questions || []).map((q, qIndex) => {
                  const answeredItem = activeSession.answers?.find((a) => a.question_id === q.id);

                  return (
                    <div
                      key={q.id}
                      className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 space-y-4"
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center">
                            #{qIndex + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            Concept: {q.concept_tested}
                          </span>
                        </div>

                        {answeredItem && (
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {Math.round(answeredItem.score)}%
                          </span>
                        )}
                      </div>

                      {/* Question Text */}
                      <p className="text-white text-sm font-semibold leading-relaxed">
                        {q.question_text}
                      </p>

                      {/* Collapsible Hint */}
                      {q.hint && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleHint(q.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center space-x-1"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>{revealedHints[q.id] ? 'Hide Hint' : 'Need a hint?'}</span>
                            {revealedHints[q.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {revealedHints[q.id] && (
                            <div className="mt-2 text-xs text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                              {q.hint}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answer Area or Completed Feedback */}
                      {answeredItem ? (
                        <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                          <div>
                            <span className="font-semibold text-slate-400 block mb-1">Your Answer:</span>
                            <div className="bg-slate-800/60 p-3 rounded-xl text-slate-200">
                              {answeredItem.user_answer}
                            </div>
                          </div>

                          <div className="bg-indigo-950/30 border border-indigo-800/40 p-3.5 rounded-xl space-y-1">
                            <span className="font-bold text-indigo-300 block flex items-center space-x-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI Tutor Feedback:</span>
                            </span>
                            <p className="text-slate-300">{answeredItem.feedback}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2 border-t border-slate-800">
                          <textarea
                            rows={3}
                            placeholder="Type your concise answer or solution here..."
                            value={currentAnswerText}
                            onChange={(e) => setCurrentAnswerText(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />

                          <div className="flex justify-end">
                            <button
                              onClick={() => handleSubmitAnswer(q.id)}
                              disabled={answering || !currentAnswerText.trim()}
                              className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-purple-600/20"
                            >
                              <Send className="w-3 h-3" />
                              <span>{answering ? 'Evaluating...' : 'Check Answer'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center text-slate-400 text-sm">
              Select or launch a practice drill to begin.
            </div>
          )}
        </div>

        {/* Right: History Sidebar */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-purple-400" />
            <span>Practice History ({history.length})</span>
          </h2>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading drills...</p>
          ) : history.length === 0 ? (
            <p className="text-slate-400 text-xs bg-slate-800/40 p-4 rounded-xl">
              No previous drills recorded. Launch a new one above.
            </p>
          ) : (
            <div className="space-y-2.5">
              {history.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    setActiveSession(h);
                    setCurrentAnswerText('');
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                    activeSession?.id === h.id
                      ? 'bg-slate-800 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs truncate pr-2">{h.topic}</span>
                    {h.score != null && (
                      <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {Math.round(h.score)}%
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{h.answers?.length || 0} / {h.questions?.length || 0} answered</span>
                    <span>{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
