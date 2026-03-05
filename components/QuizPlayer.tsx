"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeContext } from "@/context/SwipeContext";
import { useXPReward } from "@/context/XPRewardContext";
import { shareQuizResult } from "@/lib/shareQuizResult";

type Phase = "loading" | "countdown" | "category-reveal" | "category-outro" | "question-reveal" | "question-outro" | "question-active" | "answer-feedback" | "summary";

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
  const { showXPReward } = useXPReward();
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
  const [rank, setRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [weekId, setWeekId] = useState<string | null>(null);
  const [countdownNum, setCountdownNum] = useState(3);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [answersInteractive, setAnswersInteractive] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [xpRewardData, setXpRewardData] = useState<{
    xpBreakdown: { participationXP: number; correctXP: number; rankXP: number; totalXP: number };
    coinBreakdown?: { participationCoins: number; correctCoins: number; rankCoins: number; totalCoins: number };
    previousRCoins?: number;
    newRCoins?: number;
    levelBefore: number;
    levelAfter: number;
    newTotalXP: number;
    rank: number;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionOutroTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryOutroTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSubmittedForQuestionRef = useRef(false);
  const completeCalledRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    console.log("QuizPlayer phase changed to:", phase);
  }, [phase]);

  useEffect(() => {
    setSwipeDisabled(isOpen);
    return () => setSwipeDisabled(false);
  }, [isOpen, setSwipeDisabled]);

  useEffect(() => {
    if (!isOpen) setXpRewardData(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      clearTimer();
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }
      if (questionRevealTimeoutRef.current) {
        clearTimeout(questionRevealTimeoutRef.current);
        questionRevealTimeoutRef.current = null;
      }
      if (questionOutroTimeoutRef.current) {
        clearTimeout(questionOutroTimeoutRef.current);
        questionOutroTimeoutRef.current = null;
      }
      if (categoryOutroTimeoutRef.current) {
        clearTimeout(categoryOutroTimeoutRef.current);
        categoryOutroTimeoutRef.current = null;
      }
      if (timerStartTimeoutRef.current) {
        clearTimeout(timerStartTimeoutRef.current);
        timerStartTimeoutRef.current = null;
      }
    }
  }, [isOpen, clearTimer]);

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
    setRank(null);
    setTotalPlayers(null);
    setWeekId(null);
    setDisplayedScore(0);
    setAnswersInteractive(false);
    completeCalledRef.current = false;

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
      countdownRef.current = setTimeout(tick, 1500);
    };
    countdownRef.current = setTimeout(tick, 1500);
    return clearCountdown;
  }, [phase, isOpen, clearCountdown]);

  useEffect(() => {
    if (phase !== "category-reveal" || !isOpen) return;
    countdownRef.current = setTimeout(() => {
      setPhase("category-outro");
    }, 2500);
    return clearCountdown;
  }, [phase, isOpen, clearCountdown]);

  useEffect(() => {
    if (phase !== "category-outro" || !isOpen) return;
    categoryOutroTimeoutRef.current = setTimeout(() => {
      setPhase("question-reveal");
    }, 900);
    return () => {
      if (categoryOutroTimeoutRef.current) {
        clearTimeout(categoryOutroTimeoutRef.current);
        categoryOutroTimeoutRef.current = null;
      }
    };
  }, [phase, isOpen]);

  const startQuestionTimer = useCallback(() => {
    if (!currentQuestion) return;
    clearTimer();
    const timeLimitSec = currentQuestion.timeLimitSec ?? 30;
    questionStartTimeRef.current = Date.now();
    setTimeRemaining(timeLimitSec);
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
      const remaining = Math.max(0, Math.ceil(timeLimitSec - elapsed));
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearTimer();
        submitAnswer(-1, timeLimitSec * 1000);
      }
    }, 100);
  }, [currentQuestion?.timeLimitSec, currentQuestion?.id]);

  useEffect(() => {
    if (!currentQuestion?.id) return;
    return () => {
      clearTimer();
    };
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (phase !== "question-reveal" || !currentQuestion || !isOpen) return;
    startQuestionTimer();
    questionRevealTimeoutRef.current = setTimeout(() => {
      setPhase("question-outro");
    }, 2000);
    return () => {
      if (questionRevealTimeoutRef.current) {
        clearTimeout(questionRevealTimeoutRef.current);
        questionRevealTimeoutRef.current = null;
      }
    };
  }, [phase, currentQuestion?.id, isOpen, startQuestionTimer]);

  useEffect(() => {
    if (phase !== "question-outro" || !currentQuestion || !isOpen) return;
    questionOutroTimeoutRef.current = setTimeout(() => {
      setPhase("question-active");
    }, 700);
    return () => {
      if (questionOutroTimeoutRef.current) {
        clearTimeout(questionOutroTimeoutRef.current);
        questionOutroTimeoutRef.current = null;
      }
    };
  }, [phase, currentQuestion?.id, isOpen]);

  useEffect(() => {
    if (phase !== "question-active" || !currentQuestion) return;
    setSelectedAnswer(null);
    setAnswersInteractive(false);
    hasSubmittedForQuestionRef.current = false;
    const answersCount = currentQuestion.answers?.length ?? 4;
    const answerDelays = answersCount === 2 ? [800, 1000] : [800, 1000, 1200, 1400];
    const lastAnswerStart = answerDelays[answersCount - 1] ?? 800 + (answersCount - 1) * 200;
    const timerStartDelay = lastAnswerStart + 400;
    timerStartTimeoutRef.current = setTimeout(() => {
      setAnswersInteractive(true);
    }, timerStartDelay);
    return () => {
      if (timerStartTimeoutRef.current) {
        clearTimeout(timerStartTimeoutRef.current);
        timerStartTimeoutRef.current = null;
      }
    };
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
        } else if (isNewCategory && nextQ) {
          setCurrentCategory(nextCat);
          setCurrentQuestion(nextQ);
          setCurrentQuestionIndex(json.currentQuestionIndex ?? 0);
          setPhase("category-reveal");
        } else if (nextQ) {
          setCurrentQuestion(nextQ);
          setCurrentQuestionIndex(json.currentQuestionIndex ?? 0);
          setSelectedAnswer(null);
          setPhase("question-reveal");
        }
      }, 2500);
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

  useEffect(() => {
    if (phase !== "summary" || !sessionId) return;
    if (completeCalledRef.current) return;
    completeCalledRef.current = true;
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
          setRank(completeJson.rank);
        }
        if (completeJson.success && completeJson.totalPlayers != null) {
          setTotalPlayers(completeJson.totalPlayers);
        }
        if (completeJson.success && completeJson.weekId != null) {
          setWeekId(completeJson.weekId);
        }
        if (
          completeJson.success &&
          completeJson.xpBreakdown != null &&
          completeJson.levelBefore != null &&
          completeJson.levelAfter != null &&
          completeJson.newTotalXP != null &&
          completeJson.rank != null
        ) {
          setXpRewardData({
            xpBreakdown: completeJson.xpBreakdown,
            coinBreakdown: completeJson.coinBreakdown,
            previousRCoins: completeJson.previousRCoins,
            newRCoins: completeJson.newRCoins,
            levelBefore: completeJson.levelBefore,
            levelAfter: completeJson.levelAfter,
            newTotalXP: completeJson.newTotalXP,
            rank: completeJson.rank,
          });
        }
      } catch {
        // ignore
      }
    })();
  }, [phase, sessionId]);

  const scoreIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase !== "summary") return;
    setDisplayedScore(0);
    const startDelay = 800;
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

  return (
    <div
      className={`${containerClass} relative`}
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999 }}
    >
      {phase !== "summary" && (
        <>
          {phase === "loading" && (
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
                  <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-semibold">
                    Späť
                  </button>
                </motion.div>
              )}
            </div>
          )}
          {phase === "countdown" && (
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
          )}
          {phase === "category-reveal" && currentQuestion && (
            <div className={`${contentClass} justify-center`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center text-center"
              >
                <p className="text-3xl font-extrabold uppercase tracking-widest">{currentCategory}</p>
                <p className="text-sm opacity-40 mt-2">Otázka {currentQuestionIndex + 1} z {totalQuestions}</p>
                <motion.div
                  className="h-0.5 bg-[#f3e6c0]/20 mx-auto mt-6"
                  initial={{ width: 0 }}
                  animate={{ width: 48 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </motion.div>
            </div>
          )}
          {phase === "category-outro" && currentQuestion && (
            <div className={`${contentClass} justify-center`}>
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center text-center"
              >
                <p className="text-3xl font-extrabold uppercase tracking-widest">{currentCategory}</p>
                <p className="text-sm opacity-40 mt-2">Otázka {currentQuestionIndex + 1} z {totalQuestions}</p>
                <div className="w-12 h-0.5 bg-[#f3e6c0]/20 mx-auto mt-6" />
              </motion.div>
            </div>
          )}
          {phase === "question-reveal" && currentQuestion && (() => {
            const isUrgent = timeRemaining <= 3;
            const timeLimitSec = currentQuestion.timeLimitSec ?? 30;
            const borderOpacity = isUrgent ? undefined : 0.1 + (0.2 * timeRemaining) / timeLimitSec;
            return (
              <div className={`${contentClass} justify-center flex-1`}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex flex-col items-center justify-center w-full"
                >
                  <p className="text-2xl font-bold text-center px-8 leading-relaxed">{currentQuestion.text}</p>
                  <div
                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mt-6 ${isUrgent ? "border-red-400/50 text-red-400" : "border-[#f3e6c0]/20"}`}
                    style={!isUrgent && borderOpacity != null ? { borderColor: `rgba(243, 230, 192, ${borderOpacity})` } : undefined}
                  >
                    <motion.span key={timeRemaining} className="text-2xl font-bold tabular-nums" animate={isUrgent ? { scale: [1, 1.1, 1] } : {}} transition={isUrgent ? { duration: 0.5, repeat: Infinity } : {}}>
                      {timeRemaining}
                    </motion.span>
                  </div>
                </motion.div>
              </div>
            );
          })()}
          {phase === "question-outro" && currentQuestion && (() => {
            const isUrgent = timeRemaining <= 3;
            const timeLimitSec = currentQuestion.timeLimitSec ?? 30;
            const borderOpacity = isUrgent ? undefined : 0.1 + (0.2 * timeRemaining) / timeLimitSec;
            return (
              <div className={`${contentClass} justify-center flex-1`}>
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center w-full">
                  <p className="text-2xl font-bold text-center px-8 leading-relaxed">{currentQuestion.text}</p>
                  <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mt-6 ${isUrgent ? "border-red-400/50 text-red-400" : "border-[#f3e6c0]/20"}`} style={!isUrgent && borderOpacity != null ? { borderColor: `rgba(243, 230, 192, ${borderOpacity})` } : undefined}>
                    <span className="text-2xl font-bold tabular-nums">{timeRemaining}</span>
                  </div>
                </motion.div>
              </div>
            );
          })()}
          {phase === "question-active" && currentQuestion && (() => {
            const progressPct = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
            const isUrgent = timeRemaining <= 3;
            const timeLimitSec = currentQuestion.timeLimitSec ?? 30;
            const borderOpacity = isUrgent ? undefined : 0.1 + (0.2 * timeRemaining) / timeLimitSec;
            const answersCount = currentQuestion.answers?.length ?? 4;
            const answerDelays = answersCount === 2 ? [800, 1000] : [800, 1000, 1200, 1400];
            return (
              <div className={`${contentClass} flex-1 justify-start pt-6 pb-8`}>
                <div className="w-full">
                  <div className="w-full h-1 bg-[#f3e6c0]/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-[#f3e6c0] rounded-full" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6, ease: "easeInOut" }} />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 text-right mt-2">{currentQuestionIndex + 1} / {totalQuestions}</p>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 text-center mt-4">{currentCategory}</p>
                  <p className="text-xl font-bold text-center px-6 mt-3 leading-relaxed">{currentQuestion.text}</p>
                  {currentQuestion.type === "image" && currentQuestion.imageUrl && <img src={currentQuestion.imageUrl} alt="" className="mx-auto mt-4 max-w-[260px] w-full rounded-2xl overflow-hidden object-contain" />}
                </motion.div>
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mt-6 mb-6 ${isUrgent ? "border-red-400/50 text-red-400" : "border-[#f3e6c0]/20"}`} style={!isUrgent && borderOpacity != null ? { borderColor: `rgba(243, 230, 192, ${borderOpacity})` } : undefined}>
                  <motion.span key={timeRemaining} className="text-2xl font-bold tabular-nums" animate={isUrgent ? { scale: [1, 1.1, 1] } : {}} transition={isUrgent ? { duration: 0.5, repeat: Infinity } : {}}>{timeRemaining}</motion.span>
                </div>
                <div className="flex flex-col space-y-3 w-full">
                  {currentQuestion.answers?.map((a, i) => (
                    <motion.button key={i} type="button" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (answerDelays[i] ?? 1400) / 1000, duration: 0.4 }} onClick={() => handleAnswerClick(i)} disabled={selectedAnswer !== null || !answersInteractive} style={{ pointerEvents: selectedAnswer !== null || !answersInteractive ? "none" : "auto" }} className={`w-full py-4 rounded-2xl text-base font-semibold text-center border transition-colors ${selectedAnswer === i ? "bg-[#f3e6c0]/20 border-[#f3e6c0]/30" : "bg-[#f3e6c0]/[0.07] border-[#f3e6c0]/[0.12] active:bg-[#f3e6c0]/20"}`}>
                      {a}
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })()}
          {phase === "answer-feedback" && (error ? (
            <div className={contentClass}>
              <p className="text-base text-red-300 mb-6">{error}</p>
              <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-semibold">Späť</button>
            </div>
          ) : (
            (() => {
              const progressPct = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
              return (
                <div className={`${contentClass} flex-1 justify-start pt-6 pb-8`}>
                  <div className="w-full">
                    <div className="w-full h-1 bg-[#f3e6c0]/10 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-[#f3e6c0] rounded-full" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6, ease: "easeInOut" }} />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 text-right mt-2">{currentQuestionIndex + 1} / {totalQuestions}</p>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 text-center mt-4">{currentCategory}</p>
                  <motion.div animate={{ opacity: 0.25 }} transition={{ duration: 0.5 }}>
                    <p className="text-xl font-bold text-center px-6 mt-3 leading-relaxed">{currentQuestion?.text}</p>
                    {currentQuestion?.type === "image" && currentQuestion?.imageUrl && <img src={currentQuestion.imageUrl} alt="" className="mx-auto mt-4 max-w-[260px] w-full rounded-2xl overflow-hidden object-contain opacity-25" />}
                    <motion.div animate={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mt-6 mb-6 border-[#f3e6c0]/20">
                      <span className="text-2xl font-bold tabular-nums">{timeRemaining}</span>
                    </motion.div>
                  </motion.div>
                  <div className="flex flex-col space-y-3 w-full">
                    {currentQuestion?.answers?.map((a, i) => (
                      <motion.button key={i} type="button" animate={{ scale: selectedAnswer === i ? 1.03 : 1, opacity: selectedAnswer === i ? 1 : 0.08 }} transition={{ duration: 0.5 }} className={`w-full py-4 rounded-2xl text-base font-semibold text-center border pointer-events-none ${selectedAnswer === i ? "bg-[#f3e6c0]/20 border-[#f3e6c0]/30" : "bg-[#f3e6c0]/[0.07] border-[#f3e6c0]/[0.12]"}`}>
                        {a}
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })()
          ))}
        </>
      )}
      {phase === "summary" && (
        <motion.div
          key="summary-screen"
          className="absolute inset-0 flex flex-col items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(243,230,192,0.06) 0%, transparent 60%)" }}
          />
          <div className={`${contentClass} justify-center text-center relative`}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="text-[10px] uppercase tracking-[0.3em] opacity-30">
              KVÍZ DOKONČENÝ
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }}>
              <span className="block text-7xl font-extrabold mt-4 tabular-nums">{displayedScore}</span>
              <p className="text-xs uppercase tracking-widest opacity-30 mt-2">BODOV</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5, duration: 0.8 }} className="w-16 h-[1px] bg-[#f3e6c0]/15 mx-auto mt-6" />
            {rank != null && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4, duration: 0.8 }} className="bg-[#f3e6c0]/[0.05] rounded-2xl px-8 py-5 mt-6">
                <p className="text-3xl font-extrabold">#{rank}</p>
                <p className="text-xs opacity-40 mt-1">v Slovensku</p>
                {totalPlayers != null && <p className="text-[10px] opacity-20 mt-0.5">z {totalPlayers} hráčov</p>}
              </motion.div>
            )}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5.5, duration: 0.6 }}
              type="button"
              onClick={() => {
                if (xpRewardData) {
                  showXPReward(xpRewardData);
                }
                onClose();
              }}
              className="mt-10 px-10 py-4 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-bold text-sm"
            >
              Zobraziť odmeny
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 6, duration: 0.6 }}
              type="button"
              onClick={() =>
                shareQuizResult(
                  totalScore,
                  rank,
                  (msg) => {
                    setShareToast(msg);
                    setTimeout(() => setShareToast(null), 2500);
                  },
                  totalPlayers ?? undefined,
                  weekId ?? undefined
                )
              }
              className="text-xs uppercase tracking-widest opacity-25 mt-4 underline-offset-4 hover:opacity-50 transition-opacity"
            >
              Zdieľať výsledok
            </motion.button>
            <AnimatePresence>
              {shareToast && (
                <motion.div
                  key="share-toast"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[#f3e6c0] text-[#1b2833] text-sm font-medium z-[10001]"
                >
                  {shareToast}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6.5, duration: 0.8 }} className="mt-8 text-center">
              <p className="text-xs uppercase tracking-widest opacity-40">SPRÁVNE ODPOVEDE NÁJDEŠ NA</p>
              <motion.a href="https://www.instagram.com/rupsy_sirupy" target="_blank" rel="noopener noreferrer" animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="block text-base font-bold mt-2">
                @rupsy_sirupy
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
