"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RequestUser = {
  rupsyId?: string;
  nickname?: string;
  city?: string;
  level?: number;
};

type RequestItem = {
  requestId: string;
  user: RequestUser;
};

export default function FriendsPanel() {
  const router = useRouter();
  const [showRequests, setShowRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState<{ rupsyId?: string } | null>(null);
  const [addFriendInput, setAddFriendInput] = useState("");
  const [addFriendMessage, setAddFriendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Requests state
  const [incoming, setIncoming] = useState<RequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<RequestItem[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

  const CODE_REGEX = /^[ABCDEFGHJKLMNPQRTUVWXYZ2346789]{5}$/;

  function processPastedCode(pasted: string): string {
    let s = pasted.trim().toUpperCase();
    if (s.startsWith("RUPSY-")) {
      s = s.slice(6);
    }
    return s
      .replace(/[^ABCDEFGHJKLMNPQRTUVWXYZ2346789]/g, "")
      .slice(-5);
  }

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        router.replace("/");
        return;
      }
      setUser(json.user ?? null);

      const countRes = await fetch("/api/friends/pending-count", {
        credentials: "include",
      });
      const countJson = await countRes.json();
      if (countJson.success) {
        setPendingCount(countJson.pendingCount ?? 0);
      }
    }
    load();
  }, [router]);

  async function loadRequests() {
    const res = await fetch("/api/friends/requests", { credentials: "include" });
    const json = await res.json();
    if (!res.ok || !json.success) return;
    setIncoming(json.incoming ?? []);
    setOutgoing(json.outgoing ?? []);
  }

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
        // Update pending count
        const countRes = await fetch("/api/friends/pending-count", {
          credentials: "include",
        });
        const countJson = await countRes.json();
        if (countJson.success) {
          setPendingCount(countJson.pendingCount ?? 0);
        }
      }
    } finally {
      setActingId(null);
    }
  }

  function handleOpenRequests() {
    loadRequests();
    setShowRequests(true);
  }

  const rupsyId = user?.rupsyId ?? "";

  // ── Requests sub-view ──
  if (showRequests) {
    return (
      <div className="h-full overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
        <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10 px-4 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => setShowRequests(false)}
              className="p-2 -ml-2 rounded-xl bg-[#1b2833]/5 text-[#1b2833] border-0"
            >
              ← Späť
            </button>
            <h1 className="text-xl font-bold">Žiadosti</h1>
          </div>

          <section className="mb-8">
            <h2 className="text-sm font-semibold opacity-90 mb-3">Prichádzajúce</h2>
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {r.user?.nickname ?? r.user?.rupsyId ?? "—"}
                      </p>
                      <p className="text-sm opacity-60">{r.user?.rupsyId ?? ""}</p>
                    </div>
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
                      <p className="font-medium truncate">
                        {r.user?.nickname ?? r.user?.rupsyId ?? "—"}
                      </p>
                      <p className="text-sm opacity-60">{r.user?.rupsyId ?? ""}</p>
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

  // ── Main friends view ──
  return (
    <div className="h-full overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
      <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10 px-4">
        <div className="mb-4">
          <p className="text-sm opacity-90 mb-2">Tvoje RUPSY ID</p>
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg">{rupsyId}</p>
            {rupsyId && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(rupsyId)}
                className="p-1.5 rounded-lg bg-[#1b2833]/10 text-[#1b2833] text-xs border-0"
              >
                Kopírovať
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm opacity-90 mb-2">Pridať priateľa</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAddFriendMessage(null);
              const code = addFriendInput.trim().toUpperCase();
              if (!CODE_REGEX.test(code)) {
                setAddFriendMessage({
                  type: "error",
                  text: "Zadaj 5 platných znakov",
                });
                return;
              }
              const fullId = "RUPSY-" + code;
              const res = await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ rupsyId: fullId }),
              });
              const json = await res.json();
              if (json.success) {
                setAddFriendMessage({ type: "success", text: "Žiadosť odoslaná" });
                setAddFriendInput("");
              } else if (res.status === 400 || res.status === 404) {
                setAddFriendMessage({
                  type: "error",
                  text: json.message ?? "Chyba",
                });
              }
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="p-2 text-[#1b2833] font-medium">RUPSY-</span>
              <input
                type="text"
                value={addFriendInput}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text");
                  setAddFriendInput(processPastedCode(pasted));
                }}
                onChange={(e) => {
                  const filtered = e.target.value
                    .toUpperCase()
                    .replace(/[^ABCDEFGHJKLMNPQRTUVWXYZ2346789]/g, "")
                    .slice(0, 5);
                  setAddFriendInput(filtered);
                }}
                maxLength={5}
                placeholder="XXXXX"
                className="flex-1 p-2 border border-[#1b2833]/20 rounded-xl bg-white/50"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-[#1b2833]/5 text-[#1b2833] rounded-xl font-medium border-0"
            >
              Pridať
            </button>
          </form>
          {addFriendMessage && (
            <p
              className={
                addFriendMessage.type === "success"
                  ? "text-sm text-green-700 mt-2"
                  : "text-sm text-red-600 mt-2"
              }
            >
              {addFriendMessage.text}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenRequests}
          className="relative w-full py-2 bg-[#1b2833]/5 text-[#1b2833] rounded-xl font-medium border-0 text-center"
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
