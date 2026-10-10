import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blueprintService } from '../services/blueprintService';
import { interviewService } from '../services/interviewService';
import { InterviewBlueprint, BlueprintRound } from '../types';
import {
  Layers,
  Clock,
  HelpCircle,
  PlayCircle,
  MessageSquare,
  Mic,
  Video,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const BlueprintPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [blueprint, setBlueprint] = useState<InterviewBlueprint | null>(null);
  const [selectedMode, setSelectedMode] = useState<'text' | 'voice' | 'video'>('text');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadBlueprint() {
      if (!id) return;
      try {
        const data = await blueprintService.getBlueprint(id);
        setBlueprint(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load blueprint.');
      } finally {
        setLoading(false);
      }
    }
    loadBlueprint();
  }, [id]);

  const handleStartInterview = async () => {
    if (!blueprint) return;
    setStarting(true);
    setErrorMessage(null);

    try {
      const session = await interviewService.startInterview(blueprint.id, selectedMode);
      navigate(`/interview/${session.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start interview.');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Loading interview blueprint...</p>
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Blueprint Not Found</h2>
        <p className="text-slate-400 text-sm">{errorMessage || 'The requested interview blueprint could not be found.'}</p>
        <button
          onClick={() => navigate('/setup')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
        >
          Create New Blueprint
        </button>
      </div>
    );
  }

  const rounds: BlueprintRound[] = blueprint.blueprint.rounds || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Verified Interview Architecture</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{blueprint.target_role}</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Review your tailored multi-round interview syllabus before entering the simulator room.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-red-950/50 text-red-300 border border-red-800/70 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mode Selector Card */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-white">Select Your Preferred Interview Mode</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setSelectedMode('text')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
              selectedMode === 'text'
                ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/20'
                : 'bg-slate-900/50 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2 text-indigo-400">
              <MessageSquare className="w-5 h-5" />
              <span className="font-bold text-white text-sm">Text Mode</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Type in code, algorithms, and thoughtful structured answers with immediate AI feedback.
            </p>
          </div>

          <div
            onClick={() => setSelectedMode('voice')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
              selectedMode === 'voice'
                ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-500/20'
                : 'bg-slate-900/50 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2 text-purple-400">
              <Mic className="w-5 h-5" />
              <span className="font-bold text-white text-sm">Voice Mode</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Listen to AI questions spoken aloud and dictate your answers via live microphone transcription.
            </p>
          </div>

          <div
            onClick={() => setSelectedMode('video')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
              selectedMode === 'video'
                ? 'bg-pink-950/50 border-pink-500 shadow-md shadow-pink-500/20'
                : 'bg-slate-900/50 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2 text-pink-400">
              <Video className="w-5 h-5" />
              <span className="font-bold text-white text-sm">Video Panel Mode</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulate a real video conference interview with live camera feed, timers, and verbal delivery checks.
            </p>
          </div>
        </div>
      </div>

      {/* Rounds Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Configured Rounds ({rounds.length})</span>
        </h2>

        <div className="space-y-4">
          {rounds.map((round, idx) => (
            <div
              key={idx}
              className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base">{round.name}</h3>
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      Type: {round.round_type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{round.question_count} Questions</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>~{round.time_limit_minutes} Mins</span>
                  </span>
                  <span>•</span>
                  <span className="capitalize px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[11px]">
                    {round.difficulty}
                  </span>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">{round.objective}</p>

              {/* Topics */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(round.topics || []).map((t, ti) => (
                  <span
                    key={ti}
                    className="text-[11px] bg-slate-900/80 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-4">
        <button
          onClick={handleStartInterview}
          disabled={starting}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-base"
        >
          {starting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Initializing Interview Room...</span>
            </div>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              <span>Start Interview Room ({selectedMode.toUpperCase()} MODE)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
