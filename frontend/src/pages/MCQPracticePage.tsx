import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

type Difficulty =
  | 'Easy'
  | 'Medium'
  | 'Hard';

type MCQQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

const QUESTION_TIME = 45;

export const MCQPracticePage: React.FC = () => {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  /*
   * =====================================================
   * URL PARAMETERS
   * =====================================================
   */

  const company =
    searchParams.get('company') ||
    'Company';

  const role =
    searchParams.get('role') ||
    'Role';

  const topic =
    searchParams.get('topic') ||
    'Interview Topic';

  /*
   * =====================================================
   * STATES
   * =====================================================
   */

  const [difficulty, setDifficulty] =
    useState<Difficulty>('Easy');

  const [questions, setQuestions] =
    useState<MCQQuestion[]>([]);

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState('');

  const [submitted, setSubmitted] =
    useState(false);

  const [score, setScore] =
    useState(0);

  const [timeLeft, setTimeLeft] =
    useState(QUESTION_TIME);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [finished, setFinished] =
    useState(false);

  /*
   * Prevent multiple API requests
   *
   * This is important because rapid clicks,
   * React development rendering, etc. should
   * never create duplicate MCQ requests.
   */
  const requestInProgress =
    useRef(false);

  /*
   * =====================================================
   * CURRENT QUESTION
   * =====================================================
   */

  const currentQuestion =
    questions[currentQuestionIndex];

  /*
   * =====================================================
   * SCORE
   * =====================================================
   */

  const percentage = useMemo(() => {
    if (questions.length === 0) {
      return 0;
    }

    return Math.round(
      (score / questions.length) * 100
    );
  }, [
    score,
    questions.length,
  ]);

  /*
   * =====================================================
   * ERROR FORMATTER
   * =====================================================
   *
   * FastAPI/Pydantic errors are objects.
   * This prevents:
   *
   * [object Object]
   *
   * from appearing in the UI.
   */

  const getErrorMessage = (
    data: any
  ): string => {
    if (
      typeof data?.detail === 'string'
    ) {
      return data.detail;
    }

    if (
      Array.isArray(data?.detail)
    ) {
      return data.detail
        .map((item: any) => {
          const location =
            Array.isArray(item?.loc)
              ? item.loc.join(' → ')
              : '';

          const message =
            item?.msg ||
            'Validation error';

          if (location) {
            return `${location}: ${message}`;
          }

          return message;
        })
        .join('\n');
    }

    if (data?.detail) {
      try {
        return JSON.stringify(
          data.detail
        );
      } catch {
        return 'Request failed.';
      }
    }

    return 'Failed to generate MCQs.';
  };

  /*
   * =====================================================
   * GENERATE MCQs
   * =====================================================
   */

  const generateQuestions =
    useCallback(async () => {
      /*
       * Prevent duplicate request
       */
      if (requestInProgress.current) {
        return;
      }

      requestInProgress.current = true;

      setLoading(true);
      setError('');

      setQuestions([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setSubmitted(false);
      setScore(0);
      setTimeLeft(QUESTION_TIME);
      setFinished(false);

      try {
        const response =
          await fetch(
            '/api/mcq/generate',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                company,
                role,
                topic,
                difficulty:
                  difficulty.toLowerCase(),
                count: 5,
              }),
            }
          );

        const data =
          await response.json();

        /*
         * Handle FastAPI validation
         * and backend errors.
         */
        if (!response.ok) {
          throw new Error(
            getErrorMessage(data)
          );
        }

        /*
         * Validate response
         */
        if (
          !data.questions ||
          !Array.isArray(
            data.questions
          ) ||
          data.questions.length === 0
        ) {
          throw new Error(
            'No valid questions were generated.'
          );
        }

        /*
         * Extra frontend validation:
         * every question should have
         * exactly 4 options.
         */
        const validQuestions =
          data.questions.filter(
            (question: MCQQuestion) =>
              question &&
              typeof question.question ===
                'string' &&
              Array.isArray(
                question.options
              ) &&
              question.options.length ===
                4 &&
              typeof question.correct_answer ===
                'string'
          );

        if (
          validQuestions.length === 0
        ) {
          throw new Error(
            'AI returned invalid MCQ questions.'
          );
        }

        setQuestions(
          validQuestions
        );

        setCurrentQuestionIndex(0);
        setSelectedAnswer('');
        setSubmitted(false);
        setScore(0);
        setTimeLeft(
          QUESTION_TIME
        );
        setFinished(false);

      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while generating MCQs.'
        );
      } finally {
        setLoading(false);

        requestInProgress.current =
          false;
      }
    }, [
      company,
      role,
      topic,
      difficulty,
    ]);

  /*
   * =====================================================
   * SUBMIT ANSWER
   * =====================================================
   */

  const handleSubmit = () => {
    if (
      !currentQuestion ||
      !selectedAnswer ||
      submitted
    ) {
      return;
    }

    setSubmitted(true);

    if (
      selectedAnswer ===
      currentQuestion.correct_answer
    ) {
      setScore(
        (previous) =>
          previous + 1
      );
    }
  };

  /*
   * =====================================================
   * NEXT QUESTION
   * =====================================================
   */

  const handleNext = () => {
    if (!submitted) {
      return;
    }

    /*
     * Last question
     */
    if (
      currentQuestionIndex ===
      questions.length - 1
    ) {
      setFinished(true);
      return;
    }

    /*
     * Next question
     */
    setCurrentQuestionIndex(
      (previous) =>
        previous + 1
    );

    setSelectedAnswer('');
    setSubmitted(false);
    setTimeLeft(
      QUESTION_TIME
    );
  };

  /*
   * =====================================================
   * TIMER
   * =====================================================
   */

  useEffect(() => {
    /*
     * Don't run timer when:
     * - loading
     * - finished
     * - no question
     * - answer already submitted
     */
    if (
      loading ||
      finished ||
      !currentQuestion ||
      submitted
    ) {
      return;
    }

    /*
     * Time over
     */
    if (timeLeft <= 0) {
      setSubmitted(true);
      return;
    }

    const timer =
      window.setTimeout(() => {
        setTimeLeft(
          (previous) =>
            previous - 1
        );
      }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    timeLeft,
    loading,
    finished,
    currentQuestion,
    submitted,
  ]);

  /*
   * =====================================================
   * RETRY SAME TOPIC
   * =====================================================
   */

  const handleRetry = () => {
    generateQuestions();
  };

  /*
   * =====================================================
   * CHOOSE ANOTHER TOPIC
   * =====================================================
   *
   * IMPORTANT:
   *
   * Company + role are preserved.
   *
   * Example:
   *
   * /live-context
   *
   * becomes:
   *
   * /live-context?company=Microsoft
   * &role=Software%20Engineer
   */

  const handleChooseAnotherTopic =
    () => {
      navigate(
        `/live-context?company=${encodeURIComponent(
          company
        )}&role=${encodeURIComponent(
          role
        )}`
      );
    };

  /*
   * =====================================================
   * BACK TO LIVE CONTEXT
   * =====================================================
   */

  const handleBackToContext =
    () => {
      navigate(
        `/live-context?company=${encodeURIComponent(
          company
        )}&role=${encodeURIComponent(
          role
        )}`
      );
    };

  /*
   * =====================================================
   * DIFFICULTY CHANGE
   * =====================================================
   */

  const handleDifficultyChange =
    (
      value: Difficulty
    ) => {
      setDifficulty(value);

      setQuestions([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setSubmitted(false);
      setScore(0);
      setTimeLeft(
        QUESTION_TIME
      );
      setFinished(false);
      setError('');
    };

  /*
   * =====================================================
   * SETUP SCREEN
   * =====================================================
   */

  const showSetup =
    questions.length === 0 &&
    !loading &&
    !finished;

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* ========================================= */}
        {/* HEADER */}
        {/* ========================================= */}

        <div className="mb-8">

          <div className="text-sm text-indigo-400 font-medium mb-2">
            {company} • {role}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold">
            {topic} Practice
          </h1>

          <p className="text-slate-400 mt-2">
            Practice interview MCQs
            with AI.
          </p>

        </div>

        {/* ========================================= */}
        {/* SETUP */}
        {/* ========================================= */}

        {showSetup && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">

            <h2 className="text-lg font-semibold mb-5">
              Choose Difficulty
            </h2>

            <div className="grid grid-cols-3 gap-3">

              {(
                [
                  'Easy',
                  'Medium',
                  'Hard',
                ] as Difficulty[]
              ).map((level) => (
                <button
                  key={level}
                  onClick={() =>
                    handleDifficultyChange(
                      level
                    )
                  }
                  className={`rounded-xl py-3 font-semibold transition ${
                    difficulty ===
                    level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {level}
                </button>
              ))}

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 whitespace-pre-line">

                <div className="font-semibold mb-1">
                  Unable to generate
                  MCQs
                </div>

                <div className="text-sm">
                  {error}
                </div>

              </div>
            )}

            {/* GENERATE */}

            <button
              onClick={
                generateQuestions
              }
              disabled={loading}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl py-3.5 font-semibold transition"
            >
              {loading
                ? 'Generating Questions...'
                : 'Generate 5 MCQs'}
            </button>

            {/* BACK */}

            <button
              onClick={
                handleBackToContext
              }
              className="w-full mt-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl py-3 font-medium text-slate-300 transition"
            >
              ← Back to Live
              Context
            </button>

          </div>
        )}

        {/* ========================================= */}
        {/* LOADING */}
        {/* ========================================= */}

        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">

            <div className="w-12 h-12 mx-auto mb-5 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />

            <h2 className="text-xl font-semibold">
              Generating AI Questions...
            </h2>

            <p className="text-slate-400 mt-2">
              Creating{' '}
              {difficulty.toLowerCase()}{' '}
              level questions
              for{' '}
              <span className="text-white">
                {topic}
              </span>
            </p>

          </div>
        )}

        {/* ========================================= */}
        {/* QUIZ */}
        {/* ========================================= */}

        {currentQuestion &&
          !finished &&
          !loading && (
            <div className="space-y-5">

              {/* PROGRESS */}

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-400">
                  Question{' '}
                  {currentQuestionIndex +
                    1}{' '}
                  of{' '}
                  {questions.length}
                </span>

                <span
                  className={`font-semibold ${
                    timeLeft <= 10
                      ? 'text-red-400'
                      : 'text-indigo-400'
                  }`}
                >
                  ⏱ {timeLeft}s
                </span>

              </div>

              {/* PROGRESS BAR */}

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

                <div
                  className="h-full bg-indigo-600 transition-all"
                  style={{
                    width: `${
                      ((currentQuestionIndex +
                        1) /
                        questions.length) *
                      100
                    }%`,
                  }}
                />

              </div>

              {/* QUESTION CARD */}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                {/* META */}

                <div className="flex items-center justify-between mb-5">

                  <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
                    {difficulty}
                  </span>

                  <span className="text-sm text-slate-500">
                    {topic}
                  </span>

                </div>

                {/* QUESTION */}

                <h2 className="text-xl md:text-2xl font-semibold leading-relaxed">
                  {
                    currentQuestion.question
                  }
                </h2>

                {/* OPTIONS */}

                <div className="mt-7 space-y-3">

                  {currentQuestion.options.map(
                    (
                      option,
                      index
                    ) => {

                      const isSelected =
                        selectedAnswer ===
                        option;

                      const isCorrect =
                        option ===
                        currentQuestion.correct_answer;

                      let optionClass =
                        'bg-slate-800 border-slate-700 hover:border-indigo-500';

                      if (
                        submitted &&
                        isCorrect
                      ) {
                        optionClass =
                          'bg-emerald-500/10 border-emerald-500 text-emerald-300';
                      } else if (
                        submitted &&
                        isSelected &&
                        !isCorrect
                      ) {
                        optionClass =
                          'bg-red-500/10 border-red-500 text-red-300';
                      } else if (
                        isSelected
                      ) {
                        optionClass =
                          'bg-indigo-500/10 border-indigo-500 text-indigo-300';
                      }

                      return (
                        <button
                          key={`${option}-${index}`}
                          onClick={() => {
                            if (
                              !submitted
                            ) {
                              setSelectedAnswer(
                                option
                              );
                            }
                          }}
                          disabled={
                            submitted
                          }
                          className={`w-full text-left border rounded-xl p-4 transition ${optionClass} ${
                            submitted
                              ? 'cursor-default'
                              : 'cursor-pointer'
                          }`}
                        >

                          <div className="flex items-center gap-4">

                            <span className="w-9 h-9 rounded-lg bg-slate-700/70 flex items-center justify-center font-semibold shrink-0">
                              {String.fromCharCode(
                                65 + index
                              )}
                            </span>

                            <span className="font-medium">
                              {option}
                            </span>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

                {/* ================================= */}
                {/* ANSWER EXPLANATION */}
                {/* ================================= */}

                {submitted && (
                  <div
                    className={`mt-6 rounded-xl p-5 border ${
                      selectedAnswer ===
                      currentQuestion.correct_answer
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >

                    <div
                      className={`font-bold mb-2 ${
                        selectedAnswer ===
                        currentQuestion.correct_answer
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {selectedAnswer ===
                      currentQuestion.correct_answer
                        ? '✓ Correct Answer'
                        : '✗ Wrong Answer'}
                    </div>

                    {selectedAnswer !==
                      currentQuestion.correct_answer && (
                      <p className="text-slate-300 text-sm mb-2">

                        Correct answer:{' '}

                        <span className="font-semibold text-white">
                          {
                            currentQuestion.correct_answer
                          }
                        </span>

                      </p>
                    )}

                    <p className="text-slate-300 leading-6">
                      {
                        currentQuestion.explanation
                      }
                    </p>

                  </div>
                )}

                {/* ================================= */}
                {/* SUBMIT / NEXT */}
                {/* ================================= */}

                <div className="mt-6">

                  {!submitted ? (

                    <button
                      onClick={
                        handleSubmit
                      }
                      disabled={
                        !selectedAnswer
                      }
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl py-3.5 font-semibold transition"
                    >
                      Submit Answer
                    </button>

                  ) : (

                    <button
                      onClick={
                        handleNext
                      }
                      className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3.5 font-semibold transition"
                    >
                      {currentQuestionIndex ===
                      questions.length - 1
                        ? 'View Final Result'
                        : 'Next Question →'}
                    </button>

                  )}

                </div>

              </div>

            </div>
          )}

        {/* ========================================= */}
        {/* FINAL RESULT */}
        {/* ========================================= */}

        {finished && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">

            <div className="text-center">

              <div className="text-5xl mb-4">
                🎉
              </div>

              <h2 className="text-3xl font-bold">
                Practice Complete!
              </h2>

              <p className="text-slate-400 mt-2">
                {company} • {role}
              </p>

              <p className="text-indigo-400 mt-1 font-medium">
                {topic} • {difficulty}
              </p>

              {/* SCORE */}

              <div className="w-44 h-44 mx-auto mt-8 mb-6 rounded-full border-8 border-indigo-500/30 flex flex-col items-center justify-center">

                <span className="text-4xl font-bold">
                  {score}/
                  {questions.length}
                </span>

                <span className="text-sm text-slate-400 mt-1">
                  Correct
                </span>

              </div>

              <div className="text-xl text-slate-300">

                Your Score:{' '}

                <span className="text-indigo-400 font-bold">
                  {percentage}%
                </span>

              </div>

            </div>

            {/* RESULT MESSAGE */}

            <div className="mt-8 bg-slate-800/70 border border-slate-700 rounded-xl p-5 text-center">

              {percentage >= 80 ? (
                <>
                  <div className="text-emerald-400 font-semibold text-lg">
                    🔥 Excellent
                    performance!
                  </div>

                  <p className="text-slate-400 text-sm mt-1">
                    You have a strong
                    understanding of
                    this topic.
                  </p>
                </>
              ) : percentage >=
                60 ? (
                <>
                  <div className="text-yellow-400 font-semibold text-lg">
                    👍 Good job!
                  </div>

                  <p className="text-slate-400 text-sm mt-1">
                    Keep practicing
                    to improve your
                    accuracy.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-red-400 font-semibold text-lg">
                    💪 Keep practicing!
                  </div>

                  <p className="text-slate-400 text-sm mt-1">
                    Try this topic
                    again or practice
                    related skills.
                  </p>
                </>
              )}

            </div>

            {/* ================================= */}
            {/* FINAL ACTIONS */}
            {/* ================================= */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">

              {/* RETRY */}

              <button
                onClick={
                  handleRetry
                }
                className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3.5 px-4 font-semibold transition"
              >
                🔄 Practice Again
              </button>

              {/* ANOTHER TOPIC */}

              <button
                onClick={
                  handleChooseAnotherTopic
                }
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl py-3.5 px-4 font-semibold transition"
              >
                🌐 Choose Another
                Topic
              </button>

              {/* DASHBOARD */}

              <button
                onClick={() =>
                  navigate(
                    '/dashboard'
                  )
                }
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl py-3.5 px-4 font-semibold transition"
              >
                🏠 Dashboard
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default MCQPracticePage;