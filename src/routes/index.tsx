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

const BLOCK_STYLES = [
  { bg: "#CCFF00", text: "text-black", tilt: "-rotate-[1.5deg]", numColor: "text-black/15" },
  { bg: "#FF4D6D", text: "text-white", tilt: "rotate-[1.5deg]",  numColor: "text-white/20" },
  { bg: "#00B4D8", text: "text-white", tilt: "-rotate-[1deg]",   numColor: "text-white/20" },
] as const;

const MARQUEE_ITEMS = ["know your arc", "decode your era", "find your vibe"];

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
        data: { answers: QUESTIONS.map((q) => ({ question: q.prompt, answer: answers[q.id] })) },
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

      {/* Floating iOS-wallpaper blobs */}
      <div className="blob float-slow h-[360px] w-[360px] -top-24 -left-20 bg-white/40" />
      <div className="blob float-med  h-[280px] w-[280px] top-1/4 -right-20 bg-[#FFBE0B]" />
      <div className="blob float-slow h-[300px] w-[300px] bottom-10 -left-16 bg-[#FF006E]" />
      <div className="blob float-med  h-[220px] w-[220px] bottom-1/3 right-1/4 bg-white/30" />
      <div className="grain absolute inset-0" />

      {/* Scattered stars & dots */}
      <Sparkles />

      <div className="relative mx-auto max-w-md px-5 pt-7 pb-16">
        {/* Logo */}
        <header className="flex items-center justify-between mb-6 fade-in">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FFBE0B] shadow-[0_0_12px_#FFBE0B]" />
            <span className="font-display text-xl lowercase tracking-tight text-white text-shadow-pop">era os</span>
          </div>
        </header>

        {!card && (
          <>
            <section className="mb-5 fade-up">
              <h1 className="font-display text-[5.8rem] leading-[0.82] -tracking-[0.06em] text-shadow-pop">
                <span className="block text-white">DECODE</span>
                <span className="block text-white">YOUR</span>
                <span className="block text-[#FFBE0B]">ERA.</span>
              </h1>
              <p className="mt-4 text-white text-[15px] font-bold leading-snug max-w-xs text-shadow-pop">
                Three weird questions. One brutally honest card. ✦
              </p>
            </section>

            {/* Marquee */}
            <div className="marquee my-6 py-2 border-y-2 border-black bg-black/85">
              <div className="marquee-track text-white font-display text-sm uppercase tracking-[0.15em]">
                {[...Array(2)].map((_, i) => (
                  <span key={i} className="flex">
                    {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, j) => (
                      <span key={j} className="px-5">
                        {t} <span className="text-[#FFBE0B]">✦</span>
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-7">
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
                "press mt-10 w-full rounded-2xl py-5 font-display text-xl tracking-wide uppercase transition-all border-[3px] border-black " +
                "border-b-[6px] border-b-[#FFBE0B] shadow-[6px_6px_0_0_#000] " +
                (allAnswered && !loading
                  ? "bg-black text-white hover:translate-y-[1px]"
                  : "bg-black/70 text-white/70 cursor-not-allowed")
              }
            >
              {loading ? "Consulting the oracle…" : "Decode My Era"}
            </button>
          </>
        )}

        {card && (
          <div className="fade-in pt-2">
            <h2 className="font-display text-5xl mb-5 -tracking-[0.04em] text-shadow-pop">
              <span className="text-white">YOUR ERA,</span><br/>
              <span className="text-[#FFBE0B]">DECODED.</span>
            </h2>
            <EraCard card={card} />

            <div className="mt-6 grid gap-3">
              <button
                onClick={onSave}
                className="press w-full rounded-2xl py-5 font-display text-lg uppercase tracking-wide bg-black text-white border-[3px] border-black border-b-[6px] border-b-[#FFBE0B] shadow-[6px_6px_0_0_#000]"
              >
                Save Card
              </button>
              <button
                onClick={reset}
                className="press w-full rounded-2xl py-4 text-xs font-bold tracking-[0.3em] uppercase bg-white text-black border-[3px] border-black shadow-[6px_6px_0_0_#000]"
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
  index, prompt, options, selected, onSelect,
}: {
  index: number; prompt: string; options: string[];
  selected?: string; onSelect: (opt: string) => void;
}) {
  const s = BLOCK_STYLES[index % BLOCK_STYLES.length];
  return (
    <div
      className={"sticker relative overflow-hidden rounded-[28px] p-6 pt-5 fade-up transform " + s.tilt + " " + s.text}
      style={{ background: s.bg, animationDelay: `${0.08 + index * 0.08}s` }}
    >
      <div className="grain absolute inset-0" />
      <div
        className={"pointer-events-none absolute -top-8 -right-2 font-display text-[12rem] leading-none select-none " + s.numColor}
        aria-hidden
      >
        0{index + 1}
      </div>

      <div className="relative">
        <div className="text-[10px] font-black tracking-[0.3em] uppercase mb-3 opacity-80">
          Question 0{index + 1} / 03
        </div>
        <h3 className="font-display text-[1.95rem] leading-[1.02] mb-5 -tracking-[0.03em]">
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
                  "press text-left rounded-full px-5 py-3.5 font-bold leading-snug transition-all duration-200 border-2 border-black " +
                  (isSel
                    ? "bg-black text-white text-[16.5px] border-l-[6px] border-l-[#FFBE0B] shadow-[4px_4px_0_0_#000]"
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

function Sparkles() {
  const items = [
    { top: "8%",  left: "82%", color: "#FFBE0B", size: 18, kind: "star" },
    { top: "18%", left: "6%",  color: "#fff",    size: 12, kind: "star" },
    { top: "34%", left: "92%", color: "#fff",    size: 10, kind: "dot"  },
    { top: "46%", left: "4%",  color: "#FFBE0B", size: 14, kind: "star" },
    { top: "58%", left: "88%", color: "#FFBE0B", size: 16, kind: "star" },
    { top: "70%", left: "10%", color: "#fff",    size: 9,  kind: "dot"  },
    { top: "82%", left: "78%", color: "#fff",    size: 14, kind: "star" },
    { top: "92%", left: "20%", color: "#FFBE0B", size: 11, kind: "dot"  },
    { top: "26%", left: "50%", color: "#fff",    size: 8,  kind: "dot"  },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      {items.map((it, i) => (
        <span
          key={i}
          className="absolute twinkle font-display select-none"
          style={{
            top: it.top, left: it.left, color: it.color,
            fontSize: it.size, animationDelay: `${(i % 5) * 0.4}s`,
          }}
        >
          {it.kind === "star" ? "✦" : "●"}
        </span>
      ))}
    </div>
  );
}
