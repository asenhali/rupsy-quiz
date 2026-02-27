"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "denied" | "admin";

type Question = {
  text: string;
  type: "text" | "image" | "yesno";
  imageUrl?: string;
  answers: string[];
  correctIndex: number;
  timeLimitSec: number;
};

type Category = {
  name: string;
  questions: Question[];
};

type QuizData = {
  weekId: string;
  categories: Category[];
};

function validateQuizData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") return { valid: false, error: "Invalid JSON" };
  const obj = data as Record<string, unknown>;

  if (typeof obj.weekId !== "string" || !obj.weekId) {
    return { valid: false, error: "weekId musí byť neprázdny reťazec" };
  }

  if (!Array.isArray(obj.categories)) {
    return { valid: false, error: "categories musí byť pole" };
  }

  for (let ci = 0; ci < obj.categories.length; ci++) {
    const cat = obj.categories[ci] as Record<string, unknown>;
    if (typeof cat.name !== "string" || !cat.name) {
      return { valid: false, error: `Kategória ${ci}: name musí byť neprázdny reťazec` };
    }
    if (!Array.isArray(cat.questions)) {
      return { valid: false, error: `Kategória ${ci}: questions musí byť pole` };
    }
    for (let qi = 0; qi < cat.questions.length; qi++) {
      const q = cat.questions[qi] as Record<string, unknown>;
      if (typeof q.text !== "string") {
        return { valid: false, error: `Kategória ${ci}, otázka ${qi}: text musí byť reťazec` };
      }
      if (!["text", "image", "yesno"].includes(q.type as string)) {
        return { valid: false, error: `Kategória ${ci}, otázka ${qi}: type musí byť text, image alebo yesno` };
      }
      if (!Array.isArray(q.answers)) {
        return { valid: false, error: `Kategória ${ci}, otázka ${qi}: answers musí byť pole` };
      }
      const answers = q.answers as unknown[];
      const correctIndex = q.correctIndex as number;
      if (typeof correctIndex !== "number" || correctIndex < 0 || correctIndex >= answers.length) {
        return { valid: false, error: `Kategória ${ci}, otázka ${qi}: correctIndex musí byť platný index` };
      }
      if (typeof q.timeLimitSec !== "number" || q.timeLimitSec <= 0) {
        return { valid: false, error: `Kategória ${ci}, otázka ${qi}: timeLimitSec musí byť kladné číslo` };
      }
      if (q.type === "yesno" && answers.length !== 2) {
        return { valid: false, error: `Kategória ${ci}, otázka ${qi}: yesno typ vyžaduje presne 2 odpovede` };
      }
    }
  }

  return { valid: true };
}

function parseQuizData(data: unknown): QuizData {
  const obj = data as Record<string, unknown>;
  const categories = (obj.categories as unknown[]).map((cat) => {
    const c = cat as Record<string, unknown>;
    const questions = (c.questions as unknown[]).map((q) => {
      const qu = q as Record<string, unknown>;
      return {
        text: String(qu.text),
        type: qu.type as "text" | "image" | "yesno",
        imageUrl: qu.imageUrl as string | undefined,
        answers: (qu.answers as unknown[]).map(String),
        correctIndex: Number(qu.correctIndex),
        timeLimitSec: Number(qu.timeLimitSec),
      };
    });
    return { name: String(c.name), questions };
  });
  return {
    weekId: String(obj.weekId),
    categories,
  };
}

export default function AdminPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [step, setStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pasteJson, setPasteJson] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      setUploadError("Súbor musí byť .json");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const validation = validateQuizData(parsed);
        if (!validation.valid) {
          setUploadError(validation.error ?? "Neplatná štruktúra");
          return;
        }
        setQuizData(parseQuizData(parsed));
        setStep(2);
      } catch {
        setUploadError("Neplatný JSON");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handlePasteLoad() {
    setUploadError(null);
    try {
      const parsed = JSON.parse(pasteJson);
      const validation = validateQuizData(parsed);
      if (!validation.valid) {
        setUploadError(validation.error ?? "Neplatná štruktúra");
        return;
      }
      setQuizData(parseQuizData(parsed));
      setStep(2);
    } catch {
      setUploadError("Neplatný JSON");
    }
  }

  function updateQuizData(updater: (prev: QuizData) => QuizData) {
    setQuizData((prev) => (prev ? updater(prev) : prev));
  }

  function updateWeekId(weekId: string) {
    updateQuizData((prev) => ({ ...prev, weekId }));
  }

  function updateCategoryName(catIndex: number, name: string) {
    updateQuizData((prev) => ({
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === catIndex ? { ...c, name } : c
      ),
    }));
  }

  function updateQuestion(
    catIndex: number,
    qIndex: number,
    updater: (q: Question) => Question
  ) {
    updateQuizData((prev) => ({
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === catIndex
          ? {
              ...c,
              questions: c.questions.map((q, j) =>
                j === qIndex ? updater(q) : q
              ),
            }
          : c
      ),
    }));
  }

  function addQuestion(catIndex: number) {
    updateQuizData((prev) => ({
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === catIndex
          ? {
              ...c,
              questions: [
                ...c.questions,
                {
                  text: "",
                  type: "text",
                  answers: ["", "", "", ""],
                  correctIndex: 0,
                  timeLimitSec: 30,
                },
              ],
            }
          : c
      ),
    }));
  }

  function deleteQuestion(catIndex: number, qIndex: number) {
    updateQuizData((prev) => ({
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === catIndex
          ? {
              ...c,
              questions: c.questions.filter((_, j) => j !== qIndex),
            }
          : c
      ),
    }));
  }

  function addCategory() {
    updateQuizData((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          name: "Nová kategória",
          questions: [],
        },
      ],
    }));
  }

  function handleImageUpload(
    catIndex: number,
    qIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateQuestion(catIndex, qIndex, (q) => ({
        ...q,
        imageUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handlePublish() {
    if (!quizData) return;
    setPublishError(null);
    setPublishSuccess(false);
    setPublishLoading(true);
    try {
      const res = await fetch("/api/admin/publish-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(quizData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setPublishError(json.message ?? "Chyba pri publikovaní");
        return;
      }
      setPublishSuccess(true);
    } catch {
      setPublishError("Chyba siete");
    } finally {
      setPublishLoading(false);
    }
  }

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
    <div className="min-h-screen overflow-y-auto bg-white p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>

      {step === 1 && (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-3">Krok 1 — Upload JSON</h2>
            <div className="flex flex-col gap-4">
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:bg-gray-50"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">alebo vlož JSON</p>
                <textarea
                  value={pasteJson}
                  onChange={(e) => setPasteJson(e.target.value)}
                  placeholder='{"weekId": "...", "categories": [...]}'
                  className="w-full h-32 p-3 border border-gray-300 rounded font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={handlePasteLoad}
                  className="mt-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                  Načítať
                </button>
              </div>
              {uploadError && (
                <p className="text-red-600 text-sm">{uploadError}</p>
              )}
            </div>
          </section>
        </div>
      )}

      {step === 2 && quizData && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Krok 2 — Preview & Edit</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week ID
            </label>
            <input
              type="text"
              value={quizData.weekId}
              onChange={(e) => updateWeekId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {quizData.categories.map((cat, catIndex) => (
            <div
              key={catIndex}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
            >
              <input
                type="text"
                value={cat.name}
                onChange={(e) => updateCategoryName(catIndex, e.target.value)}
                className="text-lg font-semibold mb-4 w-full p-2 border border-gray-200 rounded bg-white"
              />
              <div className="space-y-4">
                {cat.questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="relative border border-gray-200 rounded p-4 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => deleteQuestion(catIndex, qIndex)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xl leading-none"
                    >
                      ×
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Typ:</span>
                      <select
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(catIndex, qIndex, (prev) => ({
                            ...prev,
                            type: e.target.value as "text" | "image" | "yesno",
                            answers:
                              e.target.value === "yesno"
                                ? q.answers.slice(0, 2).length === 2
                                  ? q.answers.slice(0, 2)
                                  : ["Áno", "Nie"]
                                : prev.answers.length >= 4
                                  ? prev.answers
                                  : [...prev.answers, "", ""].slice(0, 4),
                          }))
                        }
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="text">text</option>
                        <option value="image">image</option>
                        <option value="yesno">yesno</option>
                      </select>
                    </div>
                    <textarea
                      value={q.text}
                      onChange={(e) =>
                        updateQuestion(catIndex, qIndex, (prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded mb-2 text-sm"
                      rows={2}
                      placeholder="Text otázky"
                    />
                    {q.type === "image" && (
                      <div className="mb-2">
                        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-500 text-sm">
                          {q.imageUrl ? (
                            <img
                              src={q.imageUrl}
                              alt="Preview"
                              className="max-h-32 mx-auto mb-2"
                            />
                          ) : (
                            "Nahrať obrázok"
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(catIndex, qIndex, e)
                            }
                            className="block w-full text-xs mt-1"
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 mb-2">
                      {(q.type === "yesno"
                        ? [q.answers[0] ?? "", q.answers[1] ?? ""]
                        : q.answers
                      ).map(
                        (ans, aIndex) => (
                          <div
                            key={aIndex}
                            className={`flex items-center gap-2 ${
                              q.correctIndex === aIndex
                                ? "border-l-4 border-green-500 pl-2"
                                : ""
                            }`}
                          >
                            {q.correctIndex === aIndex && (
                              <span className="text-green-600">✓</span>
                            )}
                            <input
                              type="text"
                              value={ans}
                              onChange={(e) =>
                                updateQuestion(catIndex, qIndex, (prev) => ({
                                  ...prev,
                                  answers:
                                    prev.type === "yesno"
                                      ? aIndex === 0
                                        ? [e.target.value, prev.answers[1] ?? ""]
                                        : [prev.answers[0] ?? "", e.target.value]
                                      : prev.answers.map((a, i) =>
                                          i === aIndex ? e.target.value : a
                                        ),
                                }))
                              }
                              onClick={() =>
                                updateQuestion(catIndex, qIndex, (prev) => ({
                                  ...prev,
                                  correctIndex: aIndex,
                                }))
                              }
                              className="flex-1 p-2 border border-gray-300 rounded text-sm"
                              placeholder={`Odpoveď ${aIndex + 1}`}
                            />
                          </div>
                        )
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Čas:{" "}
                      <input
                        type="number"
                        value={q.timeLimitSec}
                        onChange={(e) =>
                          updateQuestion(catIndex, qIndex, (prev) => ({
                            ...prev,
                            timeLimitSec: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1
                            ),
                          }))
                        }
                        className="w-16 p-1 border border-gray-300 rounded inline"
                      />{" "}
                      sekúnd
                    </p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addQuestion(catIndex)}
                className="mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-sm"
              >
                Pridať otázku
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCategory}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Pridať kategóriu
          </button>
          <div>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              Ďalej
            </button>
          </div>
        </div>
      )}

      {step === 3 && quizData && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Krok 3 — Publish</h2>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <p className="text-sm">
              <strong>weekId:</strong> {quizData.weekId}
            </p>
            <p className="text-sm">
              <strong>Kategórie:</strong> {quizData.categories.length}
            </p>
            <p className="text-sm">
              <strong>Celkom otázok:</strong>{" "}
              {quizData.categories.reduce(
                (acc, c) => acc + c.questions.length,
                0
              )}
            </p>
          </div>
          {publishSuccess && (
            <p className="text-green-600 font-medium">Kvíz publikovaný!</p>
          )}
          {publishError && (
            <p className="text-red-600 text-sm">{publishError}</p>
          )}
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishLoading}
            className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {publishLoading ? "Publikujem..." : "Publikovať kvíz"}
          </button>
        </div>
      )}
    </div>
  );
}
