import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resumeService } from '../services/resumeService';
import { blueprintService } from '../services/blueprintService';
import { Resume } from '../types';
import {
  Sparkles,
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  AlertCircle,
  Code2,
  BarChart,
  GraduationCap,
  Wand2,
} from 'lucide-react';

export const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedResumeId = searchParams.get('resumeId') || '';

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(preselectedResumeId);
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [templateType, setTemplateType] = useState('software_developer');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level (2-5 yrs)');
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadResumes() {
      try {
        const data = await resumeService.listResumes();
        setResumes(data);
        if (!selectedResumeId && data.length > 0) {
          setSelectedResumeId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load resumes:', err);
      }
    }
    loadResumes();
  }, []);

  const templates = [
    {
      id: 'software_developer',
      name: 'Software Developer',
      icon: Code2,
      desc: '4 Rounds: Aptitude, DSA/Core CS, System Design/Projects, HR Behavioral.',
    },
    {
      id: 'data_analyst',
      name: 'Data Analyst & Analytics',
      icon: BarChart,
      desc: '4 Rounds: Statistics Aptitude, SQL & Data Modeling, Python/BI Projects, Stakeholders.',
    },
    {
      id: 'campus_placement',
      name: 'Campus Placement / Graduate',
      icon: GraduationCap,
      desc: '4 Rounds: Quantitative Aptitude, Core CS Subjects, Technical Coding, HR.',
    },
    {
      id: 'custom',
      name: 'Custom Role / JD Tailored',
      icon: Wand2,
      desc: 'Gemini custom-crafts rounds dynamically from your specific role and pasted JD.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      setErrorMessage('Please specify your target role.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const blueprint = await blueprintService.generateBlueprint({
        target_role: targetRole,
        resume_id: selectedResumeId || undefined,
        template_type: templateType,
        experience_level: experienceLevel,
        jd_text: jdText.trim() || undefined,
      });

      navigate(`/blueprint/${blueprint.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate interview blueprint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Design Your Interview Journey</h1>
        <p className="mt-2 text-slate-400 text-sm">
          Select your target role, ground the interview in your resume, and choose the syllabus architecture.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-red-950/50 text-red-300 border border-red-800/70 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-8">
        {/* 1. Target Role & Experience */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>1. Target Role & Experience</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Role Title *
              </label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer, Data Scientist"
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="Entry-Level (0-2 yrs)">Entry-Level / Fresher (0-2 yrs)</option>
                <option value="Mid-Level (2-5 yrs)">Mid-Level (2-5 yrs)</option>
                <option value="Senior (5+ yrs)">Senior / Lead (5+ yrs)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Choose Resume for Grounding */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>2. Select Grounding Resume</span>
            </h2>
            <Link to="/resumes" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              + Upload New Resume
            </Link>
          </div>

          {resumes.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-slate-400 flex items-center justify-between">
              <span>No resume uploaded. Interview questions will use general industry role standards.</span>
              <Link to="/resumes" className="text-indigo-400 font-semibold underline">
                Upload Resume
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedResumeId('')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedResumeId === ''
                    ? 'bg-slate-800 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/50 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <span className="font-semibold text-white text-sm block">Generic Role Assessment</span>
                <span className="text-[11px] text-slate-400">Do not ground questions in a specific resume</span>
              </div>

              {resumes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedResumeId(r.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedResumeId === r.id
                      ? 'bg-slate-800 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900/50 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-semibold text-white text-sm block truncate">{r.original_filename}</span>
                  <span className="text-[11px] text-slate-400">
                    Candidate: {r.parsed_profile?.name || 'Candidate'} • {r.parsed_profile?.skills?.length || 0} skills
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Predefined Blueprint Template */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>3. Interview Template Structure</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setTemplateType(tpl.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    templateType === tpl.id
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/50 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-sm">{tpl.name}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{tpl.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Optional Job Description */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Target Job Description (Optional)
          </label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={4}
            placeholder="Paste job posting text or key responsibilities here to customize questions precisely..."
            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-base"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating Blueprint with Gemini...</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Interview Blueprint</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
