"use client";

import { useEffect } from "react";
import AppView from "@/components/AppView";
import BottomNav from "@/components/BottomNav";
import ProfileModal from "@/components/ProfileModal";
import QuizPlayer from "@/components/QuizPlayer";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ProfileModalProvider, useProfileModal } from "@/context/ProfileModalContext";
import { PANELS } from "@/config/panels";

function Modals() {
  const { showQuiz, setShowQuiz } = useProfileModal();
  useEffect(() => {
    console.log("showQuiz changed to:", showQuiz);
  }, [showQuiz]);
  return (
    <>
      <ProfileModal />
      <QuizPlayer isOpen={showQuiz} onClose={() => { console.log("QuizPlayer onClose called"); setShowQuiz(false); }} />
    </>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
    <ProfileModalProvider>
      <div className="app-shell flex flex-col h-dvh overflow-hidden bg-[#f3e6c0]">
        <main className="content-area flex-1 min-h-0 pb-[80px]">
          <AppView panels={PANELS} showDots={false} />
        </main>
        <BottomNav />
      </div>
      <Modals />
    </ProfileModalProvider>
    </OnboardingProvider>
  );
}
