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
      { name: "description", content: "A daily oracle for your current era. Brutally funny, hyper-specific, dark-luxury." },
    ],
  }),
  component: Index,
});

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
          answers: QUESTIONS.map((q) => ({
            question: q.prompt,
            answer: answers[q.id],
          })),
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
    <main className="min-h-screen bg-background bg-noise text-foreground">
      <Toaster theme="dark" position="top-center" richColors />

      <div className="mx-auto max-w-md px-5 pt-10 pb-16">
        <header className="flex items-center justify-between mb-10 fade-in">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--gold)]" />
            <span className="text-sm tracking-[0.4em] uppercase text-muted-foreground">EraOS</span>
          </div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/70">
            v1 · oracle
          </span>
        </header>

        {!card && (
          <>
            <section className="mb-10 fade-up">
              <h1 className="font-display text-5xl leading-[1.0] gold-text mb-3">
                Decode your era.
              </h1>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                Three weird questions. One brutally honest card.
                No notes app required.
              </p>
            </section>

            <div className="space-y-7">
              {QUESTIONS.map((q, idx) => (
                <div
                  key={q.id}
                  className="fade-up"
                  style={{ animationDelay: `${0.1 + idx * 0.08}s` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-display text-2xl gold-text">0{idx + 1}</span>
                    <h3 className="text-base leading-snug text-foreground/95">
                      {q.prompt}
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className={
                            "text-left rounded-2xl px-4 py-3 text-[14.5px] leading-snug transition-all border " +
                            (selected
                              ? "border-primary/60 bg-primary/[0.06] text-foreground shadow-[0_0_24px_-8px_var(--gold)]"
                              : "border-border bg-card/40 text-foreground/80 hover:border-border hover:bg-card/70")
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onDecode}
              disabled={!allAnswered || loading}
              className={
                "mt-10 w-full rounded-full py-4 font-medium tracking-wide transition-all " +
                (allAnswered && !loading
                  ? "bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_40px_-10px_var(--gold)]"
                  : "bg-secondary text-muted-foreground cursor-not-allowed")
              }
            >
              {loading ? "Consulting the oracle…" : "Decode My Era"}
            </button>
          </>
        )}

        {card && (
          <div className="fade-in">
            <EraCard card={card} />

            <div className="mt-6 grid gap-3">
              <button
                onClick={onSave}
                className="w-full rounded-full py-4 font-medium tracking-wide bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_40px_-10px_var(--gold)] transition-all"
              >
                Save Card
              </button>
              <button
                onClick={reset}
                className="w-full rounded-full py-3 text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Re-decode
              </button>
            </div>
          </div>
        )}
      </div>

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap"
      />
    </main>
  );
}
