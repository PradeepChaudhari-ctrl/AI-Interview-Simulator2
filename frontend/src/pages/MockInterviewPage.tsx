import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Trophy,
  XCircle,
} from 'lucide-react';

import { request } from '../services/apiClient';

interface MCQ {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface MCQResponse {
  questions: MCQ[];
}

export const MockInterviewPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);

  const company =
    params.get('company') || 'General';

  const role =
    params.get('role') || 'Software Engineer';

  const [type, setType] =
    useState('Mixed');

  const [difficulty, setDifficulty] =
    useState('medium');

  const [duration, setDuration] =
    useState(5);

  const [questions, setQuestions] =
    useState<MCQ[]>([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);

  const [submitted, setSubmitted] =
    useState(false);

  const [score, setScore] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [timeLeft, setTimeLeft] =
    useState(duration * 60);

  const [started, setStarted] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const currentQuestion =
    questions[currentIndex];

  const questionCount =
    duration === 5
      ? 5
      : duration === 10
        ? 8
        : 12;

  const startInterview = async () => {
    try {
      setLoading(true);
      setError('');

      const topic =
        type === 'Technical'
          ? 'Technical Interview'
          : type === 'Behavioral'
            ? 'Behavioral Interview'
            : 'Technical and Behavioral Interview';

      const response =
        await request<MCQResponse>(
          '/api/mcq/generate',
          {
            method: 'POST',
            body: JSON.stringify({
              company,
              role,
              topic,
              difficulty,
              count: questionCount,
            }),
          }
        );

      setQuestions(response.questions);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setSubmitted(false);
      setScore(0);
      setTimeLeft(duration * 60);
      setStarted(true);
      setFinished(false);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to start interview.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!started || finished) {
      return;
    }

    const timer = window.setInterval(() => {

      setTimeLeft((previous) => {

        if (previous <= 1) {
          window.clearInterval(timer);
          setFinished(true);
          return 0;
        }

        return previous - 1;
      });

    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [started, finished]);

  const submitAnswer = () => {
    if (!selectedAnswer || submitted) {
      return;
    }

    setSubmitted(true);

    if (
      selectedAnswer ===
      currentQuestion.correct_answer
    ) {
      setScore((previous) => previous + 1);
    }
  };

  const nextQuestion = () => {

    if (
      currentIndex >=
      questions.length - 1
    ) {
      setFinished(true);
      return;
    }

    setCurrentIndex(
      (previous) => previous + 1
    );

    setSelectedAnswer(null);
    setSubmitted(false);
  };

  const formatTime = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(seconds / 60);

    const remaining =
      seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remaining
    ).padStart(2, '0')}`;
  };

  if (finished) {

    const percentage =
      Math.round(
        (score /
          Math.max(
            questions.length,
            1
          )) *
          100
      );

    return (
      <div className="min-h-screen bg-slate-950 px-6 py-10">
        <div className="max-w-4xl mx-auto">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">

            <div className="text-center">

              <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Trophy
                  className="text-indigo-400"
                  size={34}
                />
              </div>

              <h1 className="text-3xl font-bold text-white mt-5">
                Interview Completed 🎉
              </h1>

              <p className="text-slate-400 mt-2">
                {company} • {role}
              </p>

              <div className="text-6xl font-bold text-indigo-400 mt-8">
                {percentage}%
              </div>

              <p className="text-slate-400">
                Overall Score
              </p>

            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-8">

              <div className="bg-slate-800 rounded-2xl p-5 text-center">
                <div className="text-2xl font-bold text-white">
                  {score}
                </div>
                <div className="text-sm text-slate-400">
                  Correct
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 text-center">
                <div className="text-2xl font-bold text-white">
                  {questions.length - score}
                </div>
                <div className="text-sm text-slate-400">
                  Incorrect
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 text-center">
                <div className="text-2xl font-bold text-white">
                  {questions.length}
                </div>
                <div className="text-sm text-slate-400">
                  Questions
                </div>
              </div>

            </div>

            <div className="mt-8">

              <h2 className="text-xl font-semibold text-white">
                Performance
              </h2>

              <div className="mt-4 space-y-3">

                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Accuracy
                  </span>

                  <span className="text-white">
                    {percentage}%
                  </span>
                </div>

                <div className="h-2 bg-slate-800 rounded-full">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

              </div>

            </div>

            <div className="flex gap-3 mt-8">

              <button
                onClick={startInterview}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold text-white"
              >
                Try Again
              </button>

              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl py-3 font-semibold text-white"
              >
                Back
              </button>

            </div>

          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-10">
        <div className="max-w-3xl mx-auto">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="mb-8">
            <p className="text-indigo-400 font-medium">
              AI Mock Interview
            </p>

            <h1 className="text-4xl font-bold text-white mt-2">
              {company} • {role}
            </h1>

            <p className="text-slate-400 mt-2">
              Test yourself with timed MCQ questions.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7">

            <label className="block text-sm text-slate-400 mb-3">
              Interview Type
            </label>

            <div className="grid grid-cols-3 gap-3">

              {[
                'Technical',
                'Behavioral',
                'Mixed',
              ].map((item) => (

                <button
                  key={item}
                  onClick={() =>
                    setType(item)
                  }
                  className={`rounded-xl py-3 border font-semibold ${
                    type === item
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {item}
                </button>

              ))}

            </div>

            <label className="block text-sm text-slate-400 mt-7 mb-3">
              Difficulty
            </label>

            <div className="grid grid-cols-3 gap-3">

              {[
                ['easy', 'Easy'],
                ['medium', 'Medium'],
                ['hard', 'Hard'],
              ].map(([value, label]) => (

                <button
                  key={value}
                  onClick={() =>
                    setDifficulty(value)
                  }
                  className={`rounded-xl py-3 border font-semibold ${
                    difficulty === value
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {label}
                </button>

              ))}

            </div>

            <label className="block text-sm text-slate-400 mt-7 mb-3">
              Interview Duration
            </label>

            <div className="grid grid-cols-3 gap-3">

              {[5, 10, 15].map((minutes) => (

                <button
                  key={minutes}
                  onClick={() =>
                    setDuration(minutes)
                  }
                  className={`rounded-xl py-3 border font-semibold ${
                    duration === minutes
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {minutes} min
                </button>

              ))}

            </div>

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4">
                {error}
              </div>
            )}

            <button
              onClick={startInterview}
              disabled={loading}
              className="w-full mt-7 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl py-4 font-semibold text-white flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Preparing Interview...
                </>
              ) : (
                '🎤 Start Mock Interview'
              )}
            </button>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">

          <div>
            <p className="text-indigo-400 font-medium">
              {company} • {role}
            </p>

            <p className="text-slate-400 text-sm mt-1">
              {type} Interview
            </p>
          </div>

          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <Clock3 size={20} />
            {formatTime(timeLeft)}
          </div>

        </div>

        <div className="flex justify-between text-sm text-slate-400 mb-3">
          <span>
            Question {currentIndex + 1} /{' '}
            {questions.length}
          </span>

          <span>
            Score: {score}
          </span>
        </div>

        <div className="h-1.5 bg-slate-800 rounded-full mb-6">
          <div
            className="h-full bg-indigo-500 rounded-full"
            style={{
              width: `${
                ((currentIndex + 1) /
                  questions.length) *
                100
              }%`,
            }}
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7">

          <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="grid gap-3 mt-7">

            {currentQuestion.options.map(
              (option, index) => {

                const letter =
                  String.fromCharCode(
                    65 + index
                  );

                const isSelected =
                  selectedAnswer === option;

                const isCorrect =
                  option ===
                  currentQuestion.correct_answer;

                let classes =
                  'bg-slate-800 border-slate-700';

                if (
                  submitted &&
                  isCorrect
                ) {
                  classes =
                    'bg-emerald-500/10 border-emerald-500 text-emerald-300';
                } else if (
                  submitted &&
                  isSelected &&
                  !isCorrect
                ) {
                  classes =
                    'bg-red-500/10 border-red-500 text-red-300';
                } else if (
                  isSelected
                ) {
                  classes =
                    'bg-indigo-500/10 border-indigo-500 text-indigo-300';
                }

                return (
                  <button
                    key={option}
                    disabled={submitted}
                    onClick={() =>
                      setSelectedAnswer(
                        option
                      )
                    }
                    className={`w-full text-left border rounded-2xl p-4 transition ${classes}`}
                  >
                    <span className="font-bold mr-3">
                      {letter}.
                    </span>

                    {option}
                  </button>
                );
              }
            )}

          </div>

          {submitted && (
            <div className="mt-6">

              <div className="bg-slate-800 rounded-2xl p-5">

                <div className="flex items-center gap-2">

                  {selectedAnswer ===
                  currentQuestion.correct_answer ? (
                    <>
                      <CheckCircle2
                        className="text-emerald-400"
                        size={20}
                      />

                      <span className="text-emerald-300 font-semibold">
                        Correct!
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle
                        className="text-red-400"
                        size={20}
                      />

                      <span className="text-red-300 font-semibold">
                        Incorrect
                      </span>
                    </>
                  )}

                </div>

                <p className="text-slate-300 mt-3">
                  Correct Answer:{' '}
                  <strong>
                    {
                      currentQuestion.correct_answer
                    }
                  </strong>
                </p>

                <p className="text-slate-400 mt-3">
                  {
                    currentQuestion.explanation
                  }
                </p>

              </div>

              <button
                onClick={nextQuestion}
                className="w-full mt-5 bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3.5 font-semibold text-white"
              >
                {currentIndex ===
                questions.length - 1
                  ? 'Finish Interview'
                  : 'Next Question →'}
              </button>

            </div>
          )}

          {!submitted && (
            <button
              onClick={submitAnswer}
              disabled={!selectedAnswer}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl py-3.5 font-semibold text-white"
            >
              Submit Answer
            </button>
          )}

        </div>

      </div>
    </div>
  );
};

export default MockInterviewPage;