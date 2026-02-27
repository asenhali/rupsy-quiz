"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [countdownNum, setCountdownNum] = useState(3);
  const [displayedScore, setDisplayedScore] = useState(0);

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
    setTotalPlayers(null);
    setDisplayedScore(0);

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
        setTimeout(() => setPhase("countdown"), 1500);
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
      countdownRef.current = setTimeout(tick, 1200);
    };
    countdownRef.current = setTimeout(tick, 1200);
    return clearCountdown;
  }, [phase, isOpen, clearCountdown]);

  useEffect(() => {
    if (phase !== "category-reveal" || !isOpen) return;
    countdownRef.current = setTimeout(() => {
      setPhase("question");
    }, 2500);
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
              if (completeJson.success && completeJson.totalPlayers != null) {
                setTotalPlayers(completeJson.totalPlayers);
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
      }, 2000);
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

  const scoreIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase !== "summary") return;
    setDisplayedScore(0);
    const startDelay = 1000;
    const duration = 2500;
    const step = 50;
    const steps = duration / step;
    const increment = Math.max(1, Math.ceil(totalScore / steps));
    const t = setTimeout(() => {
      let current = 0;
      scoreIntervalRef.current = setInterval(() => {
        current += increment;
        if (current >= totalScore) {
          setDisplayedScore(totalScore);
          if (scoreIntervalRef.current) {
            clearInterval(scoreIntervalRef.current);
            scoreIntervalRef.current = null;
          }
          return;
        }
        setDisplayedScore(current);
      }, step);
    }, startDelay);
    return () => {
      clearTimeout(t);
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
        scoreIntervalRef.current = null;
      }
    };
  }, [phase, totalScore]);

  if (!isOpen) return null;

  const containerClass =
    "fixed top-0 left-0 w-screen h-screen z-[100] bg-[#1b2833] text-[#f3e6c0] flex flex-col items-center justify-center touch-none font-['Montserrat']";

  const contentClass = "w-full max-w-[480px] mx-auto px-6 flex flex-col items-center";

  if (phase === "loading") {
    return (
      <div className={containerClass}>
        <div className={contentClass}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <p className="text-5xl font-extrabold tracking-tight">RUPSY</p>
            <p className="text-5xl font-extrabold tracking-tight opacity-40">KVÍZ</p>
            {!error && (
              <motion.p
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-sm mt-6"
              >
                Načítavam...
              </motion.p>
            )}
          </motion.div>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex flex-col items-center gap-4"
            >
              <p className="text-base text-red-300">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-semibold"
              >
                Späť
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className={containerClass}>
        <div className={`${contentClass} justify-center`}>
          <AnimatePresence mode="wait">
            {countdownNum > 0 && (
              <motion.div
                key={countdownNum}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <span className="text-8xl font-extrabold tabular-nums">{countdownNum}</span>
                <p className="text-sm uppercase tracking-widest opacity-30 mt-4">Priprav sa</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (phase === "category-reveal") {
    const questionNum = currentQuestionIndex + 1;
    return (
      <div className={containerClass}>
        <div className={`${contentClass} justify-center`}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center"
          >
            <p className="text-3xl font-extrabold uppercase tracking-widest">{currentCategory}</p>
            <p className="text-sm opacity-40 mt-2">Otázka {questionNum} z {totalQuestions}</p>
            <motion.div
              className="h-0.5 bg-[#f3e6c0]/20 mx-auto mt-6"
              initial={{ width: 0 }}
              animate={{ width: 48 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === "question" && currentQuestion) {
    const progressPct = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
    const isUrgent = timeRemaining <= 3;
    const timeLimitSec = currentQuestion.timeLimitSec ?? 30;
    const borderOpacity = isUrgent ? undefined : 0.1 + (0.2 * timeRemaining) / timeLimitSec;

    return (
      <div className={containerClass}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              exit: { duration: 0.3 },
              enter: { duration: 0.5 },
            }}
            className={`${contentClass} flex-1 justify-start pt-6 pb-8`}
          >
            <div className="w-full">
              <div className="w-full h-1 bg-[#f3e6c0]/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#f3e6c0] rounded-full"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest opacity-30 text-right mt-2">
                {currentQuestionIndex + 1} / {totalQuestions}
              </p>
            </div>

            <p className="text-[10px] uppercase tracking-widest opacity-40 text-center mt-4">{currentCategory}</p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <p className="text-xl font-bold text-center px-6 mt-3 leading-relaxed">{currentQuestion.text}</p>
            </motion.div>

            {currentQuestion.type === "image" && currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt=""
                className="mx-auto mt-4 max-w-[260px] w-full rounded-2xl overflow-hidden object-contain"
              />
            )}

            <motion.div
              key={timeRemaining}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={
                isUrgent
                  ? { scale: [1, 1.1, 1], opacity: 1 }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                isUrgent
                  ? { scale: { duration: 0.5, repeat: Infinity } }
                  : {}
              }
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mt-6 mb-6 ${
                isUrgent ? "border-red-400/50 text-red-400" : "border-[#f3e6c0]/20"
              }`}
              style={
                !isUrgent && borderOpacity != null
                  ? { borderColor: `rgba(243, 230, 192, ${borderOpacity})` }
                  : undefined
              }
            >
              <span className="text-2xl font-bold tabular-nums">{timeRemaining}</span>
            </motion.div>

            <div className="flex flex-col space-y-3 w-full">
              {currentQuestion.answers?.map((a, i) => (
                <motion.button
                  key={i}
                  type="button"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                  onClick={() => handleAnswerClick(i)}
                  disabled={selectedAnswer !== null}
                  className={`w-full py-4 rounded-2xl text-base font-semibold text-center border transition-colors ${
                    selectedAnswer !== null ? "pointer-events-none" : ""
                  } ${
                    selectedAnswer === i
                      ? "bg-[#f3e6c0]/20 border-[#f3e6c0]/30"
                      : "bg-[#f3e6c0]/[0.07] border-[#f3e6c0]/[0.12] active:bg-[#f3e6c0]/20"
                  }`}
                >
                  {a}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (phase === "answer-feedback") {
    if (error) {
      return (
        <div className={containerClass}>
          <div className={contentClass}>
            <p className="text-base text-red-300 mb-6">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-semibold"
            >
              Späť
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={containerClass}>
        <div className={`${contentClass} flex-1 justify-start pt-6 pb-8`}>
          <motion.p
            animate={{ opacity: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-bold text-center px-6 mt-3 leading-relaxed"
          >
            {currentQuestion?.text}
          </motion.p>
          <div className="flex flex-col space-y-3 w-full mt-4">
            {currentQuestion?.answers?.map((a, i) => (
              <motion.button
                key={i}
                type="button"
                animate={{
                  scale: selectedAnswer === i ? 1.02 : 1,
                  opacity: selectedAnswer === i ? 1 : 0.1,
                }}
                transition={{ duration: 0.5 }}
                className={`w-full py-4 rounded-2xl text-base font-semibold text-center border pointer-events-none ${
                  selectedAnswer === i
                    ? "bg-[#f3e6c0]/15 border-[#f3e6c0]/30"
                    : "bg-[#f3e6c0]/[0.07] border-[#f3e6c0]/[0.12]"
                }`}
              >
                {a}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    return (
      <div className={containerClass}>
        <div className={`${contentClass} justify-center text-center`}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-4xl font-extrabold tracking-tight"
          >
            KONIEC
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <span className="block text-6xl font-extrabold mt-4 tabular-nums">
              {displayedScore}
            </span>
            <p className="text-sm opacity-40 mt-1">celkový počet bodov</p>
          </motion.div>

          {ranking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 3.5 }}
              className="mt-8"
            >
              <p className="text-2xl font-bold">{ranking}</p>
              {totalPlayers != null && (
                <p className="text-sm opacity-40 mt-1">z {totalPlayers} hráčov</p>
              )}
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 4.5 }}
            type="button"
            onClick={onClose}
            className="mt-10 px-8 py-4 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-bold text-base"
          >
            Späť na hlavnú
          </motion.button>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 5 }}
            className="text-[10px] opacity-20 uppercase tracking-widest mt-6"
          >
            Správne odpovede zverejníme na Instagrame
          </motion.p>
        </div>
      </div>
    );
  }

  return null;
}
