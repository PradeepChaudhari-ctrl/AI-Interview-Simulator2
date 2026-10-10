import React from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  FileCheck2,
  GitBranch,
  Layers,
  Sparkles,
  Award,
  Video,
  Mic,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Career Readiness Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            Master Every Round Before Your{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Real Interview
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Upload your resume, enter your target role, and let Google Gemini construct a personalized multi-round interview journey. Practice in Text, Voice, or Video with adaptive follow-ups and real-time diagnostic evaluation.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Start Free Practice</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-8 py-3.5 rounded-xl border border-slate-700 transition-all"
            >
              <span>Candidate Sign In</span>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Resume-Grounded Questions</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multi-Round Blueprints</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Adaptive Difficulty</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Weakness-to-Practice Drills</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Interview Modes */}
      <section className="py-16 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Three Flexible Practice Modes</h2>
            <p className="mt-3 text-slate-400 text-sm">
              Prepare in the environment that suits your upcoming interview format.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Interactive Text Mode</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ideal for thoughtful coding, system architecture, and algorithmic design. Formulate detailed answers at your pace with instant AI critique.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Voice & Speech Mode</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Practice verbal articulation with text-to-speech questions and live microphone speech transcription. Perfect for behavioral and phone screens.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-pink-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 border border-pink-500/20">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Video Interview Mode</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Simulate modern remote video panel interviews with live camera preview, timer pressure, and communication clarity evaluations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Workflow */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How AI Interview Simulator Works</h2>
            <p className="mt-3 text-slate-400 text-sm">
              From parsed resume to targeted weakness drills in 5 streamlined steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                title: 'Resume Intake',
                desc: 'Upload PDF/DOCX. Gemini extracts projects, skills, tools, and experience.',
                icon: FileCheck2,
              },
              {
                step: '02',
                title: 'Role Blueprint',
                desc: 'Pick your role & optional JD. The engine designs an authentic multi-round syllabus.',
                icon: Layers,
              },
              {
                step: '03',
                title: 'Adaptive Questions',
                desc: 'Questions cite your real projects and adjust difficulty dynamically based on answers.',
                icon: GitBranch,
              },
              {
                step: '04',
                title: 'Readiness Report',
                desc: 'Receive diagnostic metrics on correctness, depth, communication, and topic mastery.',
                icon: Award,
              },
              {
                step: '05',
                title: 'Weakness Practice',
                desc: 'Launch quick drill sessions specifically targeting concepts you missed.',
                icon: Sparkles,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                      STEP {item.step}
                    </span>
                    <div className="mt-4 mb-3">
                      <Icon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="font-bold text-white text-base mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-200">AI Interview Simulator</span>
          </div>

          <p className="text-xs text-slate-500 text-center md:text-left">
            Built for candidate preparation and growth. Not an employment decision engine.
          </p>

          <div className="flex items-center space-x-4">
            <Link to="/register" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              Create Account
            </Link>
            <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
