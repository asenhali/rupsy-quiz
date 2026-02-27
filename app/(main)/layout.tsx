"use client";

import AppView from "@/components/AppView";
import BottomNav from "@/components/BottomNav";
import ProfileModal from "@/components/ProfileModal";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ProfileModalProvider } from "@/context/ProfileModalContext";
import { PANELS } from "@/config/panels";

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
      <ProfileModal />
    </ProfileModalProvider>
    </OnboardingProvider>
  );
}
