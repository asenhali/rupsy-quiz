"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

type FriendItem = {
  wixUserId: string;
  rupsyId: string;
  nickname: string;
  avatarId: string;
  city: string;
  level: number;
};

type RequestUser = {
  rupsyId?: string;
  nickname?: string;
  city?: string;
  level?: number;
  avatarId?: string;
};

type RequestItem = {
  requestId: string;
  user: RequestUser;
};

export default function FriendsPanel() {
  const router = useRouter();
  const [view, setView] = useState<"main" | "addFriend" | "requests">("main");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState<{ rupsyId?: string } | null>(null);
  const [addFriendInput, setAddFriendInput] = useState("");
  const [addFriendMessage, setAddFriendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  async function reloadFriends() {
    const res = await fetch("/api/friends/list", { credentials: "include" });
    const json = await res.json();
    if (res.ok && json.success) {
      setFriends(json.friends ?? []);
    }
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

      const listRes = await fetch("/api/friends/list", { credentials: "include" });
      const listJson = await listRes.json();
      if (listRes.ok && listJson.success) {
        setFriends(listJson.friends ?? []);
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
        if (action === "accept") {
          await reloadFriends();
        }
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

  const rupsyId = user?.rupsyId ?? "";

  // ── ADD FRIEND VIEW ──
  if (view === "addFriend") {
    return (
      <div className="h-full overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
        <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10 px-4 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => setView("main")}
              className="p-2 -ml-2 bg-transparent text-sm font-medium opacity-50 text-[#1b2833] border-0"
            >
              ← Späť
            </button>
            <h1 className="text-xl font-bold">Pridať priateľa</h1>
          </div>

          <div className="mb-4">
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
                <span className="p-3 text-[#1b2833] font-semibold opacity-40">RUPSY-</span>
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
                  className="flex-1 p-3 border border-[#1b2833]/10 rounded-xl bg-white/40"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#1b2833]/5 text-[#1b2833] rounded-2xl font-medium border-0"
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
        </div>
      </div>
    );
  }

  // ── REQUESTS VIEW ──
  if (view === "requests") {
    return (
      <div className="h-full overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
        <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10 px-4 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => setView("main")}
              className="p-2 -ml-2 bg-transparent text-sm font-medium opacity-50 text-[#1b2833] border-0"
            >
              ← Späť
            </button>
            <h1 className="text-xl font-bold">Žiadosti</h1>
          </div>

          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-3">Prichádzajúce</h2>
            {incoming.length === 0 ? (
              <p className="text-sm opacity-50">Žiadne prichádzajúce žiadosti</p>
            ) : (
              <ul className="space-y-3">
                {incoming.map((r) => (
                  <li
                    key={r.requestId}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 border border-[#1b2833]/[0.06]"
                  >
                    <Avatar
                      characterId={r.user?.avatarId ?? "default"}
                      sizePx={40}
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {r.user?.nickname ?? r.user?.rupsyId ?? "—"}
                      </p>
                      <p className="text-sm opacity-50">{r.user?.rupsyId ?? ""}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={actingId === r.requestId}
                        onClick={() => handleRespond(r.requestId, "accept")}
                        className="px-3 py-3 rounded-xl bg-green-600/90 text-white text-sm font-medium border-0 disabled:opacity-50"
                      >
                        Prijať
                      </button>
                      <button
                        type="button"
                        disabled={actingId === r.requestId}
                        onClick={() => handleRespond(r.requestId, "reject")}
                        className="px-3 py-3 rounded-2xl bg-[#1b2833]/15 text-[#1b2833] text-sm font-medium border-0 disabled:opacity-50"
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
            <h2 className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-3">Odoslané</h2>
            {outgoing.length === 0 ? (
              <p className="text-sm opacity-50">Žiadne odoslané žiadosti</p>
            ) : (
              <ul className="space-y-3">
                {outgoing.map((r) => (
                  <li
                    key={r.requestId}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 border border-[#1b2833]/[0.06]"
                  >
                    <Avatar
                      characterId={r.user?.avatarId ?? "default"}
                      sizePx={40}
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {r.user?.nickname ?? r.user?.rupsyId ?? "—"}
                      </p>
                      <p className="text-sm opacity-50">{r.user?.rupsyId ?? ""}</p>
                      <p className="text-sm opacity-50">Čaká na schválenie</p>
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

  // ── MAIN VIEW ──
  return (
    <div className="h-full overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
      <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10 px-4 min-h-0">
        <div className="flex-shrink-0 mb-4">
          <p className="text-xs font-medium uppercase tracking-widest opacity-40 mb-2">Tvoje RUPSY ID</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold tracking-tight">{rupsyId}</p>
            {rupsyId && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(rupsyId)}
                className="text-xs font-medium opacity-40 uppercase tracking-wider bg-transparent underline text-[#1b2833] border-0"
              >
                Kopírovať
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <p className="text-xs font-medium uppercase tracking-widest opacity-40 mb-3">
            Priatelia ({friends.length})
          </p>
          <div className="flex-1 overflow-y-auto min-h-0">
            {friends.length === 0 ? (
              <p className="text-sm opacity-40">Zatiaľ žiadni priatelia</p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.wixUserId}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 border border-[#1b2833]/[0.06]"
                  >
                    <Avatar
                      characterId={friend.avatarId || "default"}
                      sizePx={40}
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{friend.nickname ?? friend.rupsyId ?? "—"}</p>
                      <p className="text-xs opacity-40">{friend.rupsyId ?? ""}</p>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[10px] uppercase tracking-widest opacity-40 font-medium">LVL</span>
                      <span className="text-sm font-bold">{friend.level ?? 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 pt-3 pb-4 space-y-2">
          <button
            type="button"
            onClick={() => setView("addFriend")}
            className="w-full py-3 bg-[#1b2833] text-[#f3e6c0] rounded-2xl font-medium border-0 text-center"
          >
            Pridať priateľa
          </button>
          <button
            type="button"
            onClick={async () => {
              await loadRequests();
              setView("requests");
            }}
            className="relative w-full py-3 bg-[#1b2833]/5 text-[#1b2833] rounded-2xl font-medium border-0 text-center"
          >
            Žiadosti
            {pendingCount > 0 && (
              <span className="absolute top-2 right-4 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
