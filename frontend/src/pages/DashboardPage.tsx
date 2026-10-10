import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewService } from '../services/interviewService';
import { resumeService } from '../services/resumeService';
import { practiceService } from '../services/practiceService';
import { InterviewSession, Resume, PracticeSession } from '../types';
import {
  PlayCircle,
  FileText,
  Sparkles,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  BarChart3,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [practices, setPractices] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessData, resData, pracData] = await Promise.all([
          interviewService.listInterviews(),
          resumeService.listResumes(),
          practiceService.getHistory(),
        ]);
        setSessions(sessData);
        setResumes(resData);
        setPractices(pracData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const inProgressSessions = sessions.filter((s) => s.status === 'in_progress');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-800 to-purple-900/40 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.name || 'Candidate'} 👋
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Ready to prepare for your next big opportunity? Upload your resume or launch a simulated multi-round interview with real-time feedback.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/setup"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 transition-all text-sm"
            >
              <PlayCircle className="w-4 h-4" />
              <span>New Interview</span>
            </Link>
            <Link
              to="/resumes"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition-all text-sm"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Manage Resumes ({resumes.length})</span>
            </Link>
            <Link
              to="/practice"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition-all text-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Weakness Drills ({practices.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Interviews
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{sessions.length}</span>
            <span className="text-xs text-slate-400">sessions</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{completedSessions.length}</span>
            <span className="text-xs text-emerald-400">reports ready</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{inProgressSessions.length}</span>
            <span className="text-xs text-amber-400">active sessions</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Practice Drills
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{practices.length}</span>
            <span className="text-xs text-purple-400">drills conducted</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active / Recent Interviews & Practice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interviews List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <PlayCircle className="w-5 h-5 text-indigo-400" />
              <span>Your Interview Sessions</span>
            </h2>
            <Link to="/setup" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              + Launch New
            </Link>
          </div>

          {loading ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-sm">
              Loading your interview sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold">No interviews started yet</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Upload your resume or pick a role to generate your first custom interview blueprint.
                </p>
              </div>
              <Link
                to="/setup"
                className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                <span>Start First Interview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="bg-slate-800/60 border border-slate-700/80 hover:border-slate-600/80 p-5 rounded-2xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-base">{sess.target_role}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          sess.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {sess.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                      <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                        {sess.mode}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center space-x-3">
                      <span>Rounds: {sess.rounds?.length || 0}</span>
                      <span>•</span>
                      <span>Started: {new Date(sess.started_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {sess.status === 'completed' ? (
                      <Link
                        to={`/reports/${sess.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Readiness Report</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/interview/${sess.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Continue Round</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Weakness Drills & Resumes */}
        <div className="space-y-6">
          {/* Practice Drills Card */}
          <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Recent Weakness Drills</span>
              </h3>
              <Link to="/practice" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                View all
              </Link>
            </div>

            {practices.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">
                No weakness drills yet. Finish an interview to generate custom drills targeting missed concepts.
              </p>
            ) : (
              <div className="space-y-2.5">
                {practices.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to="/practice"
                    className="block p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 truncate pr-2">{p.topic}</span>
                      {p.score !== null && (
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {p.score}%
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {p.answers?.length || 0} / {p.questions?.length || 0} questions answered
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Resume Card */}
          <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Resumes on File</span>
              </h3>
              <Link to="/resumes" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Upload
              </Link>
            </div>

            {resumes.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-400">No resume uploaded yet.</p>
                <Link
                  to="/resumes"
                  className="inline-flex items-center space-x-1 text-xs text-indigo-400 font-semibold hover:underline"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Upload your resume</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {resumes.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="truncate pr-2">
                      <span className="font-medium text-slate-200 block truncate">{r.original_filename}</span>
                      <span className="text-[11px] text-slate-500">
                        {r.parsed_profile?.skills?.length || 0} skills detected
                      </span>
                    </div>
                    <Link
                      to="/setup"
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap"
                    >
                      Interview &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
