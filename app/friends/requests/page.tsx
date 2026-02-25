"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RequestItem = {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  createdAt?: unknown;
};

export default function FriendsRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [incoming, setIncoming] = useState<RequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<RequestItem[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

  async function loadRequests() {
    const res = await fetch("/api/friends/requests", { credentials: "include" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      router.replace("/");
      return;
    }
    setIncoming(json.incoming ?? []);
    setOutgoing(json.outgoing ?? []);
  }

  useEffect(() => {
    loadRequests().finally(() => setLoading(false));
  }, [router]);

  async function handleRespond(requestId: string, action: "accept" | "reject") {
    setActingId(requestId);
    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId, action }),
      });
      const json = await res.json();
      if (json.success) {
        await loadRequests();
      }
    } finally {
      setActingId(null);
    }
  }

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
      <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10 px-4 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push("/friends")}
            className="p-2 -ml-2 rounded-xl bg-[#1b2833]/5 text-[#1b2833]"
          >
            ← Späť
          </button>
          <h1 className="text-xl font-bold">Žiadosti</h1>
        </div>

        <section className="mb-8">
          <h2 className="text-sm font-semibold opacity-90 mb-3">
            Prichádzajúce
          </h2>
          {incoming.length === 0 ? (
            <p className="text-sm opacity-60">Žiadne prichádzajúce žiadosti</p>
          ) : (
            <ul className="space-y-3">
              {incoming.map((r) => (
                <li
                  key={r.requestId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-[#1b2833]/10"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1b2833]/15 shrink-0" />
                  <span className="flex-1 font-medium truncate">
                    {r.fromUserId}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={actingId === r.requestId}
                      onClick={() => handleRespond(r.requestId, "accept")}
                      className="px-3 py-1.5 rounded-lg bg-green-600/90 text-white text-sm font-medium border-0 disabled:opacity-50"
                    >
                      Prijať
                    </button>
                    <button
                      type="button"
                      disabled={actingId === r.requestId}
                      onClick={() => handleRespond(r.requestId, "reject")}
                      className="px-3 py-1.5 rounded-lg bg-[#1b2833]/15 text-[#1b2833] text-sm font-medium border-0 disabled:opacity-50"
                    >
                      Zamietnuť
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold opacity-90 mb-3">Odoslané</h2>
          {outgoing.length === 0 ? (
            <p className="text-sm opacity-60">Žiadne odoslané žiadosti</p>
          ) : (
            <ul className="space-y-3">
              {outgoing.map((r) => (
                <li
                  key={r.requestId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-[#1b2833]/10"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1b2833]/15 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.toUserId}</p>
                    <p className="text-sm opacity-60">Čaká na schválenie</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
