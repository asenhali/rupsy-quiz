"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    console.log("IFRAME SCRIPT LOADED");

    function handleMessage(event: MessageEvent) {
      console.log("EVENT ORIGIN:", event.origin);
      console.log("EVENT DATA:", event.data);

      if (event.origin !== "https://www.rupsy.sk") return;

      if (event.data?.token) {
        console.log("TOKEN RECEIVED:", event.data.token);
        setToken(event.data.token);
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
            <p className="text-xs mt-2 break-all text-gray-500">
              {token}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}