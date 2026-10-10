import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { practiceService } from '../services/practiceService';
import { Report } from '../types';
import {
  Award,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [launchingPractice, setLaunchingPractice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      try {
        const data = await reportService.getReport(id);
        setReport(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to generate readiness report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  const handleStartPractice = async (topic: string) => {
    if (!report) return;
    setLaunchingPractice(topic);
    try {
      const session = await practiceService.startPractice({
        topic,
        source_report_id: report.id,
        target_role: report.target_role,
      });
      navigate(`/practice`);
    } catch (err: any) {
      alert(`Could not start practice drill: ${err.message}`);
    } finally {
      setLaunchingPractice(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Synthesizing comprehensive readiness report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Report Not Found</h2>
        <p className="text-slate-400 text-sm">{errorMessage}</p>
        <Link to="/dashboard" className="text-xs text-indigo-400 font-semibold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { overall_metrics } = report;

  // Radar chart data for competencies
  const competencyData = [
    { subject: 'Technical Depth', score: overall_metrics.technical_depth_score, fullMark: 100 },
    { subject: 'Problem Solving', score: overall_metrics.problem_solving_score, fullMark: 100 },
    { subject: 'Communication', score: overall_metrics.communication_score, fullMark: 100 },
    { subject: 'Clarity', score: overall_metrics.clarity_score, fullMark: 100 },
    { subject: 'Overall Readiness', score: overall_metrics.readiness_score, fullMark: 100 },
  ];

  // Bar chart data for rounds
  const roundChartData = overall_metrics.round_metrics.map((rm) => ({
    name: `R${rm.round_order}: ${rm.round_name.substring(0, 15)}...`,
    score: rm.score,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-800 to-purple-950 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Interview Readiness Practice Report</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{report.target_role}</h1>
          <p className="text-xs text-slate-400">
            Educational Diagnostic Assessment • {overall_metrics.total_questions_answered} questions analyzed • Not a hiring prediction
          </p>
        </div>

        {/* Big Readiness Score Ring */}
        <div className="flex items-center space-x-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500 flex flex-col items-center justify-center font-mono">
            <span className="text-2xl font-extrabold text-white">{Math.round(overall_metrics.readiness_score)}</span>
            <span className="text-[10px] text-indigo-300">/ 100</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Readiness Score
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {overall_metrics.readiness_score >= 80
                ? 'Strong Interview Preparedness'
                : overall_metrics.readiness_score >= 65
                ? 'Promising • Specific Gaps Identified'
                : 'Foundational • Drills Recommended'}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart: Core Competencies */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Competency Radar Breakdown</span>
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competencyData} outerRadius="75%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar
                  name="Candidate"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Round by Round Performance */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Round-Wise Performance</span>
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roundChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses Observations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-emerald-900/40 rounded-3xl p-6 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <span>Demonstrated Key Strengths</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800/60 border border-amber-900/40 rounded-3xl p-6 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Identified Growth & Reinforcement Areas</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.weaknesses.map((w, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Weakness-to-Practice Loop Action Plan */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Targeted Weakness-to-Practice Loop</span>
          </div>
          <h2 className="text-xl font-bold text-white">Your Personalized Practice Roadmap</h2>
          <p className="text-slate-400 text-xs mt-1">
            Don't let identified weaknesses cost you your real interview. Click any topic below to immediately run rapid AI practice drills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.practice_plan.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{item.topic}</span>
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                      item.priority === 'High'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.priority} Priority
                  </span>
                </div>
                <p className="text-xs text-slate-300">{item.reason}</p>

                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Suggested Action:</span>
                  <ul className="text-xs text-slate-400 space-y-0.5 list-disc list-inside">
                    {item.suggested_actions.map((act, ai) => (
                      <li key={ai}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => handleStartPractice(item.topic)}
                disabled={launchingPractice === item.topic}
                className="w-full inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all mt-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {launchingPractice === item.topic ? 'Generating Drill...' : `Practice "${item.topic}" Now`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <Link
          to="/dashboard"
          className="text-xs text-slate-400 hover:text-white font-medium"
        >
          &larr; Back to Dashboard
        </Link>
        <Link
          to="/setup"
          className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-5 py-2.5 rounded-xl border border-slate-700"
        >
          <PlayCircle className="w-4 h-4 text-indigo-400" />
          <span>Launch Another Interview</span>
        </Link>
      </div>
    </div>
  );
};
