"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "denied" | "admin";

export default function AdminPage() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    async function check() {
      const meRes = await fetch("/api/me", { credentials: "include" });
      const meJson = await meRes.json();

      if (!meRes.ok || !meJson.success) {
        setStatus("denied");
        return;
      }

      const checkRes = await fetch("/api/admin/check", { credentials: "include" });
      const checkJson = await checkRes.json();

      if (!checkRes.ok || !checkJson.success) {
        setStatus("denied");
        return;
      }

      if (!checkJson.isAdmin) {
        setStatus("denied");
        return;
      }

      setStatus("admin");
    }
    check();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-medium">
        Prístup zamietnutý
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
      <div className="space-y-6">
        <section className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Upload JSON</h2>
          <p className="text-sm text-gray-500">Placeholder</p>
        </section>
        <section className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Preview</h2>
          <p className="text-sm text-gray-500">Placeholder</p>
        </section>
        <section className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Publish</h2>
          <p className="text-sm text-gray-500">Placeholder</p>
        </section>
      </div>
    </div>
  );
}
