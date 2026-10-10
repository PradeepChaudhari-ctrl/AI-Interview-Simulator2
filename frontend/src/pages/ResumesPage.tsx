import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeService } from '../services/resumeService';
import { Resume, ParsedProfile, ProjectItem } from '../types';
import {
  UploadCloud,
  FileText,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Plus,
  X,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
} from 'lucide-react';

export const ResumesPage: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [editingProfile, setEditingProfile] = useState<ParsedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newSkillInput, setNewSkillInput] = useState('');

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    setLoading(true);
    try {
      const data = await resumeService.listResumes();
      setResumes(data);
      if (data.length > 0 && !selectedResume) {
        setSelectedResume(data[0]);
        setEditingProfile(data[0].parsed_profile);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load resumes.' });
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMessage(null);

    try {
      const uploaded = await resumeService.uploadResume(file);
      setResumes([uploaded, ...resumes]);
      setSelectedResume(uploaded);
      setEditingProfile(uploaded.parsed_profile);
      setStatusMessage({ type: 'success', text: `Successfully extracted structured profile for "${file.name}".` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Upload failed.' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedResume || !editingProfile) return;
    try {
      const updated = await resumeService.updateResume(selectedResume.id, editingProfile);
      setSelectedResume(updated);
      setResumes(resumes.map((r) => (r.id === updated.id ? updated : r)));
      setStatusMessage({ type: 'success', text: 'Candidate profile saved successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeService.deleteResume(id);
      const remaining = resumes.filter((r) => r.id !== id);
      setResumes(remaining);
      if (selectedResume?.id === id) {
        const next = remaining[0] || null;
        setSelectedResume(next);
        setEditingProfile(next?.parsed_profile || null);
      }
      setStatusMessage({ type: 'success', text: 'Resume deleted.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete resume.' });
    }
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim() || !editingProfile) return;
    const skills = [...(editingProfile.skills || []), newSkillInput.trim()];
    setEditingProfile({ ...editingProfile, skills });
    setNewSkillInput('');
  };

  const handleRemoveSkill = (idx: number) => {
    if (!editingProfile) return;
    const skills = (editingProfile.skills || []).filter((_, i) => i !== idx);
    setEditingProfile({ ...editingProfile, skills });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Resume Intelligence</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Upload your resume (PDF, DOCX, TXT). Gemini extracts your verified projects, skills, and tools to ground interview questions in reality.
          </p>
        </div>

        {selectedResume && (
          <button
            onClick={() => navigate(`/setup?resumeId=${selectedResume.id}`)}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all whitespace-nowrap"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Generate Interview Blueprint</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          className={`flex items-center space-x-3 p-4 rounded-xl text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/70'
              : 'bg-red-950/50 text-red-300 border border-red-800/70'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="bg-slate-800/60 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-3xl p-8 text-center transition-colors relative">
        <input
          type="file"
          id="resume-file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <span className="text-white font-semibold text-base">
              {uploading ? 'Analyzing Resume with Gemini...' : 'Click or drag resume file here to upload'}
            </span>
            <p className="text-slate-400 text-xs mt-1">
              Supports PDF, DOCX, and TXT files up to 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Resumes Sidebar + Extracted Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Resumes List */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Uploaded Resumes ({resumes.length})</span>
          </h2>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading resumes...</p>
          ) : resumes.length === 0 ? (
            <p className="text-slate-400 text-sm bg-slate-800/40 p-4 rounded-xl">
              No resumes uploaded yet. Upload one above to begin.
            </p>
          ) : (
            <div className="space-y-2">
              {resumes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedResume(r);
                    setEditingProfile(r.parsed_profile);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedResume?.id === r.id
                      ? 'bg-slate-800 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="truncate pr-3">
                    <span className="font-semibold text-white text-sm block truncate">
                      {r.original_filename}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()} • {r.parsed_profile?.name || 'Candidate'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteResume(r.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Extracted Structured Profile */}
        <div className="lg:col-span-2">
          {editingProfile && selectedResume ? (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-700/80 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>{editingProfile.name || 'Candidate Profile'}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingProfile.email || selectedResume.original_filename} • Verified by Gemini
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="inline-flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => navigate(`/setup?resumeId=${selectedResume.id}`)}
                    className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Use for Interview</span>
                  </button>
                </div>
              </div>

              {/* Professional Summary */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Professional Summary
                </label>
                <textarea
                  value={editingProfile.summary || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, summary: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Extracted Skills & Competencies ({editingProfile.skills?.length || 0})
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(editingProfile.skills || []).map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add a new skill (e.g. Next.js, Kubernetes)..."
                    className="flex-1 px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Projects */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <FolderGit2 className="w-4 h-4 text-purple-400" />
                  <span>Resume Projects (Used for Technical Deep-Dives)</span>
                </label>
                <div className="space-y-3">
                  {(editingProfile.projects || []).map((proj, idx) => (
                    <div key={idx} className="bg-slate-900/70 border border-slate-700/60 p-4 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{proj.name}</span>
                        <div className="flex flex-wrap gap-1">
                          {(proj.technologies || []).map((t, ti) => (
                            <span
                              key={ti}
                              className="text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs">{proj.description}</p>
                      {proj.outcome && (
                        <p className="text-xs text-emerald-400">
                          <strong>Outcome:</strong> {proj.outcome}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience & Education */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-900/70 border border-slate-700/60 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <span>Experience</span>
                  </div>
                  {(editingProfile.experience || []).length > 0 ? (
                    (editingProfile.experience || []).map((exp, idx) => (
                      <div key={idx} className="text-xs text-slate-300 border-l-2 border-indigo-500/50 pl-2 py-1">
                        <div className="font-semibold text-white">{exp.role}</div>
                        <div className="text-slate-400 text-[11px]">{exp.company} • {exp.duration}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">None detected</p>
                  )}
                </div>

                <div className="bg-slate-900/70 border border-slate-700/60 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                    <span>Education</span>
                  </div>
                  {(editingProfile.education || []).length > 0 ? (
                    (editingProfile.education || []).map((edu, idx) => (
                      <div key={idx} className="text-xs text-slate-300 border-l-2 border-emerald-500/50 pl-2 py-1">
                        <div className="font-semibold text-white">{edu.degree}</div>
                        <div className="text-slate-400 text-[11px]">{edu.institution} • {edu.year}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">None detected</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center text-slate-400 text-sm">
              Select or upload a resume to view its structured profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
