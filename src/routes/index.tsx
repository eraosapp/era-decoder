import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { decodeEra, type EraCard as EraCardType } from "@/lib/era.functions";
import { QUESTIONS } from "@/lib/era-questions";
import { EraCard } from "@/components/EraCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EraOS — Decode Your Era" },
      { name: "description", content: "Three unhinged questions. One brutally honest era card. Spotify Wrapped energy for your soul." },
    ],
  }),
  component: Index,
});

const GRADS = ["grad-1", "grad-2", "grad-3"] as const;

function Index() {
  const decode = useServerFn(decodeEra);
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [card, setCard] = useState<EraCardType | null>(null);
  const [loading, setLoading] = useState(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);

  const onDecode = async () => {
    if (!allAnswered) return;
    setLoading(true);
    try {
      const result = await decode({
        data: {
          answers: QUESTIONS.map((q) => ({ question: q.prompt, answer: answers[q.id] })),
        },
      });
      setCard(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went sideways. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSave = () => {
    if (!card) return;
    try {
      const key = "eraos.saved";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.unshift({ ...card, savedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 50)));
      toast.success("Saved to your archive.");
    } catch {
      toast.error("Couldn't save. Storage blocked.");
    }
  };

  const reset = () => {
    setCard(null);
    setAnswers({});
    router.invalidate();
  };

  return (
    <main className={"relative min-h-screen overflow-hidden text-white " + (card ? "grad-result" : "grad-hero")}>
      <Toaster theme="dark" position="top-center" richColors />

      {/* live blobs */}
      <div className="blob h-[340px] w-[340px] -top-20 -left-16 bg-fuchsia-400" />
      <div className="blob h-[300px] w-[300px] top-1/3 -right-24 bg-yellow-300" />
      <div className="blob h-[260px] w-[260px] bottom-0 left-1/4 bg-cyan-300" />
      <div className="grain absolute inset-0" />

      <div className="relative mx-auto max-w-md px-5 pt-8 pb-16">
        <header className="flex items-center justify-between mb-6 fade-in">
          <span className="font-display text-2xl tracking-tighter">ERAOS</span>
          <span className="text-[10px] tracking-[0.3em] uppercase bg-black/80 text-white px-3 py-1.5 rounded-full">
            v1 · oracle
          </span>
        </header>

        {!card && (
          <>
            <section className="mb-10 fade-up">
              <h1 className="font-display text-[5.5rem] leading-[0.82] text-black mb-4 -tracking-[0.06em]">
                DECODE<br/>YOUR<br/>ERA.
              </h1>
              <p className="text-black/80 text-[15px] font-semibold leading-snug max-w-xs">
                Three weird questions. One brutally honest card. No notes app required.
              </p>
            </section>

            <div className="space-y-6">
              {QUESTIONS.map((q, idx) => (
                <QuestionBlock
                  key={q.id}
                  index={idx}
                  prompt={q.prompt}
                  options={q.options}
                  selected={answers[q.id]}
                  onSelect={(opt) => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                />
              ))}
            </div>

            <button
              onClick={onDecode}
              disabled={!allAnswered || loading}
              className={
                "press mt-10 w-full rounded-full py-5 font-display text-xl tracking-wide uppercase transition-all " +
                (allAnswered && !loading
                  ? "bg-black text-white shadow-[0_10px_0_-2px_rgba(0,0,0,0.35)] hover:translate-y-[1px]"
                  : "bg-black/40 text-white/70 cursor-not-allowed")
              }
            >
              {loading ? "Consulting the oracle…" : "Decode My Era"}
            </button>
          </>
        )}

        {card && (
          <div className="fade-in pt-2">
            <h2 className="font-display text-4xl text-black mb-5 -tracking-[0.04em]">YOUR ERA, DECODED.</h2>
            <EraCard card={card} />

            <div className="mt-6 grid gap-3">
              <button
                onClick={onSave}
                className="press w-full rounded-full py-5 font-display text-lg uppercase tracking-wide bg-black text-white shadow-[0_10px_0_-2px_rgba(0,0,0,0.35)]"
              >
                Save Card
              </button>
              <button
                onClick={reset}
                className="press w-full rounded-full py-4 text-xs font-bold tracking-[0.3em] uppercase bg-white text-black"
              >
                Re-decode
              </button>
            </div>
          </div>
        )}
      </div>

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;700;800;900&display=swap"
      />
    </main>
  );
}

function QuestionBlock({
  index,
  prompt,
  options,
  selected,
  onSelect,
}: {
  index: number;
  prompt: string;
  options: string[];
  selected?: string;
  onSelect: (opt: string) => void;
}) {
  const grad = GRADS[index % GRADS.length];
  return (
    <div
      className={"relative overflow-hidden rounded-[32px] p-6 pt-5 fade-up " + grad}
      style={{ animationDelay: `${0.08 + index * 0.08}s` }}
    >
      <div className="grain absolute inset-0" />
      {/* giant faded number */}
      <div
        className="pointer-events-none absolute -top-6 -right-2 font-display text-[12rem] leading-none text-white/15 select-none"
        aria-hidden
      >
        0{index + 1}
      </div>

      <div className="relative">
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/70 mb-3">
          Question 0{index + 1} / 03
        </div>
        <h3 className="font-display text-[1.9rem] leading-[1.02] text-white mb-5 -tracking-[0.03em]">
          {prompt}
        </h3>

        <div className="grid gap-2.5">
          {options.map((opt) => {
            const isSel = selected === opt;
            return (
              <button
                key={opt}
                onClick={() => onSelect(opt)}
                className={
                  "press text-left rounded-full px-5 py-3.5 font-bold leading-snug transition-all duration-200 " +
                  (isSel
                    ? "bg-black text-white text-[16.5px] scale-[1.02] shadow-[0_6px_0_-1px_rgba(0,0,0,0.4)]"
                    : "bg-white text-black text-[15px] hover:bg-white/90")
                }
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
