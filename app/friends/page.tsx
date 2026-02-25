"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FriendsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        router.replace("/");
        return;
      }

      const countRes = await fetch("/api/friends/pending-count", {
        credentials: "include",
      });
      const countJson = await countRes.json();
      if (countJson.success) {
        setPendingCount(countJson.pendingCount ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
        <div className="flex-1 flex items-center justify-center p-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
      <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10 px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full py-2 bg-[#1b2833]/5 text-[#1b2833] rounded-xl font-medium border-0 mb-4"
        >
          Späť
        </button>

        <button
          type="button"
          className="relative w-full py-2 bg-[#1b2833]/5 text-[#1b2833] rounded-xl font-medium border-0"
        >
          Žiadosti
          {pendingCount > 0 && (
            <span className="absolute top-2 right-4 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.15)]">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
