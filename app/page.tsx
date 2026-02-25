"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [nickname, setNickname] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.rupsy.sk") return;

      if (event.data?.token) {
        setToken(event.data.token);
        setLoading(true);
        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${event.data.token}` },
        });
        const json = await res.json();
        setNeedsOnboarding(json.needsOnboarding ?? null);
        setLoading(false);
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

        {token && loading && <p>Loading...</p>}

        {token && !loading && needsOnboarding === true && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ nickname, city }),
              });
              const response = await res.json();
              if (response.success) {
                const meRes = await fetch("/api/me", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const meJson = await meRes.json();
                setNeedsOnboarding(meJson.needsOnboarding ?? false);
              } else {
                console.error(response);
              }
            }}
          >
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="nickname"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="city"
            />
            <button type="submit">Začať hrať</button>
          </form>
        )}

        {token && !loading && needsOnboarding === false && (
          <div>MAIN MENU</div>
        )}
      </div>
    </div>
  );
}