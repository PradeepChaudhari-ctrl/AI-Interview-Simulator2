import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

type ContextResult = {
  company_summary: string;
  technologies: string[];
  role_expectations: string[];
  interview_topics: string[];
};

const TOP_COMPANIES = [
  'Google',
  'Microsoft',
  'Amazon',
  'Meta',
  'Apple',
  'Adobe',
  'IBM',
  'TCS',
  'Infosys',
  'Flipkart',
  'Other',
];

const TOP_ROLES = [
  'Software Engineer',
  'AI/ML Engineer',
  'Data Scientist',
  'Data Analyst',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps / Cloud Engineer',
  'Cybersecurity Engineer',
  'Product Manager',
  'Other',
];

export const LiveContextPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  /*
   * Read company and role from URL.
   *
   * Example:
   * /live-context?company=Google&role=Data%20Analyst
   */
  const companyFromUrl =
    searchParams.get('company') || '';

  const roleFromUrl =
    searchParams.get('role') || '';

  /*
   * Company and role state
   */
  const [company, setCompany] =
    useState(companyFromUrl);

  const [role, setRole] =
    useState(roleFromUrl);

  /*
   * Custom values for "Other"
   */
  const [customCompany, setCustomCompany] =
    useState('');

  const [customRole, setCustomRole] =
    useState('');

  /*
   * Research result
   */
  const [result, setResult] =
    useState<ContextResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  /*
   * If URL contains a company that is not
   * inside our predefined list, select Other.
   */
  useEffect(() => {
    if (
      companyFromUrl &&
      !TOP_COMPANIES.includes(companyFromUrl)
    ) {
      setCompany('Other');
      setCustomCompany(companyFromUrl);
    } else if (companyFromUrl) {
      setCompany(companyFromUrl);
    }
  }, [companyFromUrl]);

  /*
   * If URL contains a role that is not
   * inside our predefined list, select Other.
   */
  useEffect(() => {
    if (
      roleFromUrl &&
      !TOP_ROLES.includes(roleFromUrl)
    ) {
      setRole('Other');
      setCustomRole(roleFromUrl);
    } else if (roleFromUrl) {
      setRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  /*
   * Actual selected company
   */
  const selectedCompany =
    company === 'Other'
      ? customCompany.trim()
      : company;

  /*
   * Actual selected role
   */
  const selectedRole =
    role === 'Other'
      ? customRole.trim()
      : role;

  /*
   * Can research?
   */
  const canResearch =
    selectedCompany.length > 0 &&
    selectedRole.length > 0;

  /*
   * =====================================================
   * ACTUAL RESEARCH FUNCTION
   * =====================================================
   *
   * This function accepts company and role directly.
   * That allows us to research URL values immediately
   * when coming back from MCQ practice.
   */
  const performResearch = useCallback(
    async (
      companyToResearch: string,
      roleToResearch: string
    ) => {
      if (
        !companyToResearch ||
        !roleToResearch
      ) {
        setError(
          'Please select or enter both company and role.'
        );
        return;
      }

      setLoading(true);
      setError('');
      setResult(null);

      try {
        const response = await fetch(
          '/api/context/research',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              company: companyToResearch,
              role: roleToResearch,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              'Failed to fetch company context.'
          );
        }

        setResult(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while fetching live context.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
   * =====================================================
   * MANUAL RESEARCH
   * =====================================================
   */
  const handleResearch = useCallback(() => {
    if (!canResearch) {
      setError(
        'Please select or enter both company and role.'
      );
      return;
    }

    performResearch(
      selectedCompany,
      selectedRole
    );
  }, [
    canResearch,
    performResearch,
    selectedCompany,
    selectedRole,
  ]);

  /*
   * =====================================================
   * AUTO RESEARCH FROM URL
   * =====================================================
   *
   * When user does:
   *
   * MCQ Practice
   *      ↓
   * Final Result
   *      ↓
   * Choose Another Topic
   *      ↓
   * /live-context?company=Google&role=Data%20Analyst
   *
   * company + role will already be available.
   *
   * Research automatically runs.
   */
  useEffect(() => {
    if (
      companyFromUrl &&
      roleFromUrl
    ) {
      performResearch(
        companyFromUrl,
        roleFromUrl
      );
    }
  }, [
    companyFromUrl,
    roleFromUrl,
    performResearch,
  ]);

  /*
   * =====================================================
   * COMPANY CHANGE
   * =====================================================
   */
  const handleCompanyChange = (
    value: string
  ) => {
    setCompany(value);

    setResult(null);
    setError('');

    if (value !== 'Other') {
      setCustomCompany('');
    }
  };

  /*
   * =====================================================
   * ROLE CHANGE
   * =====================================================
   */
  const handleRoleChange = (
    value: string
  ) => {
    setRole(value);

    setResult(null);
    setError('');

    if (value !== 'Other') {
      setCustomRole('');
    }
  };

  /*
   * =====================================================
   * OPEN MCQ PRACTICE
   * =====================================================
   */
  const openPractice = (
    topic: string
  ) => {
    if (!canResearch) {
      setError(
        'Please select company and role first.'
      );
      return;
    }

    navigate(
      `/mcq-practice?company=${encodeURIComponent(
        selectedCompany
      )}&role=${encodeURIComponent(
        selectedRole
      )}&topic=${encodeURIComponent(
        topic
      )}`
    );
  };

  /*
   * =====================================================
   * OPEN MOCK INTERVIEW
   * =====================================================
   */
  const openMockInterview = () => {
    if (!canResearch) {
      setError(
        'Please select company and role first.'
      );
      return;
    }

    navigate(
      `/mock-interview?company=${encodeURIComponent(
        selectedCompany
      )}&role=${encodeURIComponent(
        selectedRole
      )}`
    );
  };

  /*
   * =====================================================
   * RESET
   * =====================================================
   */
  const resetContext = () => {
    navigate('/live-context');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* ========================================= */}
        {/* HEADER */}
        {/* ========================================= */}

        <div className="mb-10">

          <div className="flex items-center gap-3 mb-3">

            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
              🌐
            </div>

            <div>

              <h1 className="text-3xl md:text-4xl font-bold">
                Live Context
              </h1>

              <p className="text-slate-400 mt-1">
                Research companies and prepare for
                role-specific interviews
              </p>

            </div>

          </div>

          <p className="text-slate-500 max-w-3xl">
            Select a company and role to get
            interview-focused information,
            technologies, role expectations,
            and interview topics.
          </p>

        </div>

        {/* ========================================= */}
        {/* COMPANY / ROLE SELECTION */}
        {/* ========================================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* COMPANY */}

            <div>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company
              </label>

              <select
                value={company}
                onChange={(e) =>
                  handleCompanyChange(
                    e.target.value
                  )
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >

                <option value="">
                  Select company
                </option>

                {TOP_COMPANIES.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

              {company === 'Other' && (
                <input
                  type="text"
                  value={customCompany}
                  onChange={(e) => {
                    setCustomCompany(
                      e.target.value
                    );
                    setResult(null);
                    setError('');
                  }}
                  placeholder="Enter company name"
                  className="w-full mt-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              )}

            </div>

            {/* ROLE */}

            <div>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>

              <select
                value={role}
                onChange={(e) =>
                  handleRoleChange(
                    e.target.value
                  )
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >

                <option value="">
                  Select role
                </option>

                {TOP_ROLES.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

              {role === 'Other' && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => {
                    setCustomRole(
                      e.target.value
                    );
                    setResult(null);
                    setError('');
                  }}
                  placeholder="Enter role"
                  className="w-full mt-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              )}

            </div>

          </div>

          {/* ========================================= */}
          {/* SELECTED COMPANY / ROLE */}
          {/* ========================================= */}

          {canResearch && (
            <div className="mt-5 flex flex-wrap gap-3">

              <div className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm">
                🏢 {selectedCompany}
              </div>

              <div className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm">
                💼 {selectedRole}
              </div>

            </div>
          )}

          {/* ========================================= */}
          {/* RESEARCH BUTTON */}
          {/* ========================================= */}

          <button
            onClick={handleResearch}
            disabled={
              !canResearch ||
              loading
            }
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl py-3.5 font-semibold transition"
          >

            {loading ? (
              <span className="flex items-center justify-center gap-2">

                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                Researching...

              </span>
            ) : (
              '🔎 Research Company & Role'
            )}

          </button>

          {/* ========================================= */}
          {/* ERROR */}
          {/* ========================================= */}

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4">

              <div className="font-semibold mb-1">
                Something went wrong
              </div>

              <div className="text-sm">
                {error}
              </div>

            </div>
          )}

        </div>

        {/* ========================================= */}
        {/* LOADING */}
        {/* ========================================= */}

        {loading && (
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">

            <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />

            <h2 className="text-xl font-semibold mb-2">
              Gathering live context...
            </h2>

            <p className="text-slate-400">
              Researching{' '}
              {selectedCompany ||
                companyFromUrl}{' '}
              for{' '}
              {selectedRole ||
                roleFromUrl}.
            </p>

          </div>
        )}

        {/* ========================================= */}
        {/* RESULTS */}
        {/* ========================================= */}

        {result && !loading && (
          <div className="mt-8 space-y-6">

            {/* RESULT HEADER */}

            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-2xl p-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <div className="text-sm text-indigo-300 mb-1">
                    Live Context Result
                  </div>

                  <h2 className="text-2xl font-bold">
                    {selectedCompany ||
                      companyFromUrl}
                  </h2>

                  <p className="text-slate-400 mt-1">
                    Interview preparation for{' '}
                    {selectedRole ||
                      roleFromUrl}
                  </p>

                </div>

                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
                  ✓ Research Complete
                </div>

              </div>

            </div>

            {/* ========================================= */}
            {/* COMPANY SUMMARY */}
            {/* ========================================= */}

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  🏢
                </div>

                <div>

                  <h3 className="text-xl font-semibold">
                    Company Summary
                  </h3>

                  <p className="text-sm text-slate-500">
                    What you should know
                  </p>

                </div>

              </div>

              <p className="text-slate-300 leading-7">
                {result.company_summary ||
                  'No company summary was returned.'}
              </p>

            </section>

            {/* ========================================= */}
            {/* TECHNOLOGIES */}
            {/* ========================================= */}

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

              <div className="flex items-center justify-between mb-5">

                <div>

                  <h3 className="text-xl font-semibold">
                    Technologies & Skills
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Click any skill to start MCQ
                    practice
                  </p>

                </div>

                <div className="text-2xl">
                  💻
                </div>

              </div>

              {result.technologies.length >
              0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {result.technologies.map(
                    (skill, index) => (
                      <button
                        key={`${skill}-${index}`}
                        onClick={() =>
                          openPractice(
                            skill
                          )
                        }
                        className="text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 rounded-xl p-4 transition group"
                      >

                        <div className="flex items-center justify-between gap-3">

                          <div className="flex items-center gap-3">

                            <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-sm">
                              {index + 1}
                            </span>

                            <span className="text-slate-200 font-medium">
                              {skill}
                            </span>

                          </div>

                          <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            Practice →
                          </span>

                        </div>

                      </button>
                    )
                  )}

                </div>
              ) : (
                <p className="text-slate-500">
                  No technologies were returned.
                </p>
              )}

            </section>

            {/* ========================================= */}
            {/* ROLE EXPECTATIONS */}
            {/* ========================================= */}

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

              <div className="flex items-center gap-3 mb-5">

                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  🎯
                </div>

                <div>

                  <h3 className="text-xl font-semibold">
                    Role Expectations
                  </h3>

                  <p className="text-sm text-slate-500">
                    What companies may expect from
                    this role
                  </p>

                </div>

              </div>

              {result.role_expectations.length >
              0 ? (
                <div className="space-y-3">

                  {result.role_expectations.map(
                    (item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex gap-3 bg-slate-800/70 border border-slate-700 rounded-xl p-4"
                      >

                        <span className="text-purple-400 mt-0.5">
                          ✓
                        </span>

                        <p className="text-slate-300 leading-6">
                          {item}
                        </p>

                      </div>
                    )
                  )}

                </div>
              ) : (
                <p className="text-slate-500">
                  No role expectations were
                  returned.
                </p>
              )}

            </section>

            {/* ========================================= */}
            {/* INTERVIEW TOPICS */}
            {/* ========================================= */}

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

              <div className="flex items-center justify-between mb-5">

                <div>

                  <h3 className="text-xl font-semibold">
                    Interview Topics
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Click a topic to practice
                    AI-generated MCQs
                  </p>

                </div>

                <div className="text-2xl">
                  🧠
                </div>

              </div>

              {result.interview_topics.length >
              0 ? (
                <div className="space-y-3">

                  {result.interview_topics.map(
                    (topic, index) => (
                      <button
                        key={`${topic}-${index}`}
                        onClick={() =>
                          openPractice(
                            topic
                          )
                        }
                        className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 rounded-xl p-4 transition group"
                      >

                        <div className="flex items-center justify-between gap-3">

                          <div className="flex items-center gap-3">

                            <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm">
                              {index + 1}
                            </span>

                            <span className="text-slate-200 font-medium">
                              {topic}
                            </span>

                          </div>

                          <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            Practice →
                          </span>

                        </div>

                      </button>
                    )
                  )}

                </div>
              ) : (
                <p className="text-slate-500">
                  No interview topics were
                  returned.
                </p>
              )}

            </section>

            {/* ========================================= */}
            {/* TIMED MOCK INTERVIEW */}
            {/* ========================================= */}

            <section className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div>

                  <div className="flex items-center gap-2 mb-2">

                    <span className="text-2xl">
                      🎤
                    </span>

                    <h3 className="text-xl font-bold">
                      Timed Mock Interview
                    </h3>

                  </div>

                  <p className="text-slate-400 max-w-2xl">

                    Take a timed MCQ-based mock
                    interview tailored to{' '}

                    <span className="text-white font-medium">
                      {selectedCompany ||
                        companyFromUrl}
                    </span>{' '}

                    and the{' '}

                    <span className="text-white font-medium">
                      {selectedRole ||
                        roleFromUrl}
                    </span>{' '}

                    role.

                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">

                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300">
                      ⏱ 5 / 10 / 15 min
                    </span>

                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300">
                      📝 MCQ
                    </span>

                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300">
                      🎯 AI Generated
                    </span>

                  </div>

                </div>

                <button
                  onClick={
                    openMockInterview
                  }
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 rounded-xl px-6 py-3.5 text-white font-semibold transition whitespace-nowrap"
                >
                  🎤 Start Timed Mock Interview
                </button>

              </div>

            </section>

            {/* ========================================= */}
            {/* CHANGE COMPANY / ROLE */}
            {/* ========================================= */}

            <button
              onClick={resetContext}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl py-3.5 text-slate-400 hover:text-white transition"
            >
              ← Choose Different Company / Role
            </button>

          </div>
        )}

        {/* ========================================= */}
        {/* EMPTY STATE */}
        {/* ========================================= */}

        {!result &&
          !loading &&
          !error && (
            <div className="mt-8 bg-slate-900/60 border border-dashed border-slate-700 rounded-2xl p-10 text-center">

              <div className="text-5xl mb-4">
                🌐
              </div>

              <h2 className="text-xl font-semibold mb-2">
                Start your company research
              </h2>

              <p className="text-slate-500 max-w-xl mx-auto">
                Select a company and role above
                to discover technologies, role
                expectations, and likely interview
                topics.
              </p>

            </div>
          )}

      </div>
    </div>
  );
};

export default LiveContextPage;