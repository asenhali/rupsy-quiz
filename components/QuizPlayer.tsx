"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSwipeContext } from "@/context/SwipeContext";

type Phase = "loading" | "countdown" | "category-reveal" | "question" | "answer-feedback" | "summary";

type QuestionData = {
  id: string;
  text: string;
  type: string;
  imageUrl?: string;
  answers: string[];
  timeLimitSec: number;
  categoryName: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function QuizPlayer({ isOpen, onClose }: Props) {
  const { setSwipeDisabled } = useSwipeContext();
  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ranking, setRanking] = useState<string | null>(null);
  const [countdownNum, setCountdownNum] = useState(3);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSubmittedForQuestionRef = useRef(false);

  useEffect(() => {
    setSwipeDisabled(isOpen);
    return () => setSwipeDisabled(false);
  }, [isOpen, setSwipeDisabled]);

  useEffect(() => {
    if (!isOpen) {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setPhase("loading");
    setError(null);
    setSessionId(null);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(0);
    setTotalQuestions(0);
    setTotalScore(0);
    setSelectedAnswer(null);
    setTimeRemaining(0);
    setLastPointsEarned(0);
    setCurrentCategory("");
    setRanking(null);

    (async () => {
      try {
        const res = await fetch("/api/quiz/start", {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json();
        if (!json.success) {
          setError(json.message ?? "Chyba pri načítaní");
          return;
        }
        const q = json.question as QuestionData;
        setSessionId(json.sessionId);
        setCurrentQuestion(q);
        setCurrentQuestionIndex(json.currentQuestionIndex ?? 0);
        setTotalQuestions(json.totalQuestions ?? 0);
        setTotalScore(0);
        setCurrentCategory(q?.categoryName ?? "");
        setPhase("countdown");
      } catch (e) {
        setError("Chyba pri načítaní");
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (phase !== "countdown" || !isOpen) return;
    setCountdownNum(3);
    let count = 3;
    const tick = () => {
      count--;
      setCountdownNum(count > 0 ? count : 0);
      if (count <= 0) {
        clearCountdown();
        setPhase("category-reveal");
        return;
      }
      countdownRef.current = setTimeout(tick, 1000);
    };
    countdownRef.current = setTimeout(tick, 1000);
    return clearCountdown;
  }, [phase, isOpen, clearCountdown]);

  useEffect(() => {
    if (phase !== "category-reveal" || !isOpen) return;
    countdownRef.current = setTimeout(() => {
      setPhase("question");
    }, 2000);
    return clearCountdown;
  }, [phase, isOpen, clearCountdown]);

  useEffect(() => {
    if (phase !== "question" || !currentQuestion) return;
    setTimeRemaining(currentQuestion.timeLimitSec ?? 30);
    setSelectedAnswer(null);
    hasSubmittedForQuestionRef.current = false;
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          submitAnswer(-1, (currentQuestion.timeLimitSec ?? 30) * 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, currentQuestion?.id]);

  async function submitAnswer(selectedIndex: number, timeMs: number) {
    if (!sessionId || !currentQuestion || hasSubmittedForQuestionRef.current) return;
    hasSubmittedForQuestionRef.current = true;
    clearTimer();
    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          selectedIndex,
          timeMs,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? "Chyba");
        setPhase("answer-feedback");
        return;
      }
      const pts = json.pointsEarned ?? 0;
      setLastPointsEarned(pts);
      setTotalScore((s) => s + pts);
      setPhase("answer-feedback");
      const nextCat = (json.question as QuestionData)?.categoryName ?? "";
      const nextQ = json.question as QuestionData | undefined;
      const isNewCategory = nextCat && nextCat !== currentCategory;
      feedbackTimeoutRef.current = setTimeout(() => {
        if (json.completed) {
          setPhase("summary");
          (async () => {
            try {
              const completeRes = await fetch("/api/quiz/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ sessionId }),
              });
              const completeJson = await completeRes.json();
              if (completeJson.success && completeJson.rank != null) {
                setRanking(`#${completeJson.rank} v Slovensku`);
              }
            } catch {
              // ignore
            }
          })();
        } else if (isNewCategory && nextQ) {
          setCurrentCategory(nextCat);
          setCurrentQuestion(nextQ);
          setCurrentQuestionIndex(json.currentQuestionIndex ?? 0);
          setPhase("category-reveal");
        } else if (nextQ) {
          setCurrentQuestion(nextQ);
          setCurrentQuestionIndex(json.currentQuestionIndex ?? 0);
          setSelectedAnswer(null);
          setPhase("question");
        }
      }, 1500);
    } catch {
      setError("Chyba pri odoslaní");
      setPhase("answer-feedback");
    }
  }

  function handleAnswerClick(index: number) {
    if (selectedAnswer !== null) return;
    const timeLimitSec = currentQuestion?.timeLimitSec ?? 30;
    const elapsedSec = timeLimitSec - timeRemaining;
    setSelectedAnswer(index);
    submitAnswer(index, elapsedSec * 1000);
  }

  if (!isOpen) return null;

  const containerClass =
    "fixed top-0 left-0 w-screen h-screen z-[100] bg-[#1b2833] text-[#f3e6c0] flex flex-col items-center justify-center touch-none";

  if (phase === "loading") {
    return (
      <div className={containerClass}>
        <p className="text-3xl font-extrabold">RUPSY KVÍZ</p>
        {!error && <p className="text-sm opacity-50 animate-pulse mt-4">Načítavam...</p>}
        {error && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-base text-red-300">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-semibold"
            >
              Späť
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className={containerClass}>
        <span className="text-8xl font-extrabold tabular-nums">{countdownNum}</span>
      </div>
    );
  }

  if (phase === "category-reveal") {
    const questionNum = currentQuestionIndex + 1;
    return (
      <div className={containerClass}>
        <p className="text-2xl font-bold uppercase tracking-widest text-center">
          {currentCategory}
        </p>
        <p className="text-sm opacity-60 mt-2">
          Otázka {questionNum} z {totalQuestions}
        </p>
      </div>
    );
  }

  if (phase === "question" && currentQuestion) {
    return (
      <div className={containerClass}>
        <div className="w-full max-w-[480px] flex flex-col flex-1 px-4 pt-4 pb-8">
          <div className="w-full h-1 bg-[#f3e6c0]/20 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[#f3e6c0] rounded-full transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
          <p className="text-xs uppercase tracking-widest opacity-50 mb-2">{currentCategory}</p>
          <p className="text-xl font-bold text-center px-6 mb-4">{currentQuestion.text}</p>
          {currentQuestion.type === "image" && currentQuestion.imageUrl && (
            <img
              src={currentQuestion.imageUrl}
              alt=""
              className="max-w-[300px] rounded-2xl mx-auto mb-6 object-contain"
            />
          )}
          <p className="text-lg font-semibold mb-4 tabular-nums">{timeRemaining}s</p>
          <div className="flex flex-col space-y-3 w-full max-w-[480px] mx-auto flex-1">
            {currentQuestion.answers?.map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswerClick(i)}
                disabled={selectedAnswer !== null}
                className={`w-full py-4 rounded-2xl text-base font-semibold text-center border ${
                  selectedAnswer === i
                    ? "bg-[#f3e6c0]/30 border-[#f3e6c0]/40"
                    : "bg-[#f3e6c0]/10 border-[#f3e6c0]/20"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "answer-feedback") {
    if (error) {
      return (
        <div className={containerClass}>
          <p className="text-base text-red-300 mb-6">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-semibold"
          >
            Späť
          </button>
        </div>
      );
    }
    const selectedText = currentQuestion && selectedAnswer != null
      ? currentQuestion.answers?.[selectedAnswer]
      : null;
    return (
      <div className={containerClass}>
        {selectedText && (
          <p className="px-6 py-4 rounded-2xl bg-[#f3e6c0]/30 border border-[#f3e6c0]/40 text-base font-semibold mb-6 max-w-[480px] text-center">
            {selectedText}
          </p>
        )}
        <p className="text-2xl font-bold text-[#f3e6c0] animate-pulse">
          +{lastPointsEarned} bodov
        </p>
      </div>
    );
  }

  if (phase === "summary") {
    return (
      <div className={containerClass}>
        <p className="text-4xl font-extrabold mb-4">KONIEC!</p>
        <p className="text-4xl font-extrabold mb-2">{totalScore}</p>
        <p className="text-sm opacity-60 mb-8">celkový počet bodov</p>
        {ranking && <p className="text-lg font-semibold mb-8">{ranking}</p>}
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-4 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-bold"
        >
          Späť
        </button>
      </div>
    );
  }

  return null;
}
