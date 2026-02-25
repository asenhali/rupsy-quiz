"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [meData, setMeData] = useState<{
    success?: boolean;
    needsOnboarding?: boolean;
    user?: unknown;
  } | null>(null);

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.rupsy.sk") return;

      if (event.data?.token) {
        setToken(event.data.token);
        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${event.data.token}` },
        });
        const json = await res.json();
        setMeData(json);
      }
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-[400px] text-center">
        {!token && (
          <p className="text-gray-600">
            Waiting for secure token from Wix...
          </p>
        )}

        {token && (
          <div>
            <h1 className="text-2xl font-bold mb-4">RUPSY KVÍZ</h1>
            <p className="text-green-600 font-semibold">
              Identity connected ✅
            </p>
          </div>
        )}
      </div>
    </div>
  );
}