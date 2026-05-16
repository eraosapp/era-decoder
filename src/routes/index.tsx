import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { decodeEra, type EraCard as EraCardType } from "@/lib/era.functions";
import { QUESTIONS } from "@/lib/era-questions";
import { EraCard } from "@/components/EraCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EraOS — Decode Your Era" },
      { name: "description", content: "Three unhinged questions. One brutally honest era card." },
    ],
  }),
  component: Index,
});

const Q_STYLES = [
  { bg: "#CCFF00", text: "text-black", accent: "#000", transition: "liquid" },
  { bg: "#FF4D6D", text: "text-white", accent: "#fff", transition: "glitch" },
  { bg: "#00B4D8", text: "text-white", accent: "#fff", transition: "fade" },
] as const;

const LOADING_TEXT = "decoding your chaos...";

function Index() {
  const decode = useServerFn(decodeEra);
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0); // 0,1,2 = questions, 3 = loading, 4 = card
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<null | "liquid" | "glitch" | "fade">(null);
  const [card, setCard] = useState<EraCardType | null>(null);
  const [typed, setTyped] = useState("");

  // Typewriter
  useEffect(() => {
    if (step !== 3) return;
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(LOADING_TEXT.slice(0, i));
      if (i >= LOADING_TEXT.length) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, [step]);

  const runDecode = async (allAnswers: string[]) => {
    setStep(3);
    try {
      const result = await decode({
        data: { answers: QUESTIONS.map((q, i) => ({ question: q.prompt, answer: allAnswers[i] })) },
      });
      // Hold loading at least ~1.6s for drama
      setTimeout(() => {
        setCard(result);
        setStep(4);
      }, 1600);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went sideways.");
      setStep(2);
    }
  };

  const handleSelect = (opt: string) => {
    if (selected || transitioning) return;
    setSelected(opt);
    const curStyle = Q_STYLES[step];
    // glow phase, then transition
    setTimeout(() => {
      setTransitioning(curStyle.transition);
      setTimeout(() => {
        const nextAnswers = [...answers, opt];
        setAnswers(nextAnswers);
        setSelected(null);
        setTransitioning(null);
        if (step < 2) {
          setStep(step + 1);
        } else {
          runDecode(nextAnswers);
        }
      }, 700);
    }, 500);
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
    setAnswers([]);
    setSelected(null);
    setStep(0);
    setStarted(false);
    router.invalidate();
  };

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden text-white font-sans">
      <Toaster theme="dark" position="top-center" richColors />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;700;800;900&display=swap"
      />

      {!started && step === 0 && (
        <IntroScreen onStart={() => setStarted(true)} />
      )}

      {started && step <= 2 && (
        <QuestionScreen
          index={step}
          question={QUESTIONS[step]}
          selected={selected}
          transitioning={transitioning}
          onSelect={handleSelect}
        />
      )}

      {step === 3 && <LoadingScreen typed={typed} />}

      {step === 4 && card && (
        <ResultScreen card={card} onSave={onSave} onReset={reset} />
      )}
    </main>
  );
}


const MARQUEE_ITEMS = ["know your arc", "decode your era", "find your vibe", "trust the process"];

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 overflow-hidden text-white" style={{ background: "var(--grad-hero)" }}>
      {/* floating blobs */}
      <div className="blob float-slow" style={{ width: 320, height: 320, background: "#FF006E", top: -60, left: -80 }} />
      <div className="blob float-med" style={{ width: 280, height: 280, background: "#FFBE0B", bottom: -60, right: -60 }} />
      <div className="blob float-slow" style={{ width: 220, height: 220, background: "#8338EC", top: "40%", right: -40 }} />
      <div className="grain absolute inset-0 pointer-events-none" />

      {/* scattered stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "12%", left: "78%", s: 6 },
          { top: "22%", left: "18%", s: 4 },
          { top: "36%", left: "62%", s: 5 },
          { top: "52%", left: "8%", s: 3 },
          { top: "62%", left: "84%", s: 4 },
          { top: "70%", left: "30%", s: 6 },
        ].map((d, i) => (
          <div key={i} className="twinkle absolute rounded-full bg-white"
            style={{ top: d.top, left: d.left, width: d.s, height: d.s, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>

      <div className="relative h-full flex flex-col px-6 pt-6 pb-7">
        {/* logo */}
        <div className="flex items-center gap-2.5">
          <span className="inline-block w-4 h-4 rounded-full bg-[#FFBE0B] shadow-[0_0_18px_6px_rgba(255,190,11,0.55)] animate-pulse" />
          <span className="text-lg font-bold tracking-tight lowercase text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">era os</span>
        </div>

        {/* headline */}
        <div className="mt-10">
          <h1 className="font-display text-[4.2rem] leading-[0.92] -tracking-[0.04em] text-shadow-pop">
            <span className="block text-white">DECODE</span>
            <span className="block text-white">YOUR</span>
            <span className="block text-[#FFBE0B]">ERA.</span>
          </h1>
          <p className="mt-5 text-base font-bold text-white max-w-[18rem] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
            Three weird questions. One brutally honest card.
          </p>
        </div>

        {/* marquee */}
        <div className="mt-6 marquee">
          <div className="marquee-track text-xs font-black uppercase tracking-[0.25em] text-white/85">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
              <span key={i} className="px-3">{t} ·</span>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* button */}
        <button
          onClick={onStart}
          className="press neon-pulse animate-bounce-in w-full rounded-2xl py-6 font-display text-[1.6rem] uppercase tracking-wide bg-black text-white border-[4px] border-black border-b-[6px] border-b-[#FFBE0B] shadow-[6px_6px_0_0_#000]"
        >
          Decode My Era
        </button>
      </div>
    </div>
  );
}

function ProgressDots({ index }: { index: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 flex gap-1.5 px-4 pt-4 z-30">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 h-1 rounded-full bg-black/20 overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: i < index ? "100%" : i === index ? "100%" : "0%" }}
          />
        </div>
      ))}
    </div>
  );
}

function QuestionScreen({
  index, question, selected, transitioning, onSelect,
}: {
  index: number;
  question: typeof QUESTIONS[number];
  selected: string | null;
  transitioning: null | "liquid" | "glitch" | "fade";
  onSelect: (opt: string) => void;
}) {
  const s = Q_STYLES[index];
  const transClass =
    transitioning === "liquid" ? "anim-liquid"
    : transitioning === "glitch" ? "anim-glitch"
    : transitioning === "fade" ? "anim-fade-out"
    : "";

  return (
    <div
      key={index}
      className={"absolute inset-0 flex flex-col px-6 pt-10 pb-8 anim-question-in " + s.text + " " + transClass}
      style={{ background: s.bg }}
    >
      <ProgressDots index={index} />
      <div className="grain absolute inset-0 pointer-events-none" />

      <div className="relative flex-1 flex flex-col">
        <div className="text-[11px] font-black tracking-[0.35em] uppercase opacity-70 mb-4">
          0{index + 1} / 03
        </div>

        <h2 className="font-display text-[2.4rem] leading-[1.02] -tracking-[0.03em] mb-auto">
          {question.prompt}
        </h2>

        <div className="grid gap-3 mt-6">
          {question.options.map((opt) => {
            const isSel = selected === opt;
            return (
              <button
                key={opt}
                onClick={() => onSelect(opt)}
                disabled={!!selected}
                className={
                  "press text-left rounded-full px-5 py-4 font-bold leading-snug border-2 border-black transition-all duration-300 " +
                  (isSel
                    ? "bg-black text-white answer-glow scale-[1.02]"
                    : selected
                      ? "bg-white/60 text-black/50"
                      : "bg-white text-black hover:bg-white/95")
                }
                style={isSel ? { boxShadow: `0 0 0 4px ${s.bg}, 0 0 32px 8px ${s.accent === "#000" ? "#000" : "#fff"}` } : undefined}
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

function LoadingScreen({ typed }: { typed: string }) {
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center px-6 anim-fade-in-slow">
      <div className="text-center">
        <div className="font-display text-3xl text-white tracking-tight">
          {typed}
          <span className="inline-block w-[3px] h-7 bg-[#FFBE0B] ml-1 align-middle blink" />
        </div>
        <div className="mt-6 text-[11px] tracking-[0.4em] uppercase text-white/40">
          eraos · oracle
        </div>
      </div>
    </div>
  );
}

function ResultScreen({
  card, onSave, onReset,
}: {
  card: EraCardType; onSave: () => void; onReset: () => void;
}) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2a] to-[#0a0a0f]">
      <div className="grain absolute inset-0 pointer-events-none" />
      <div className="relative mx-auto max-w-md px-5 pt-8 pb-12">
        <h2 className="font-display text-4xl mb-5 -tracking-[0.04em] reveal" style={{ animationDelay: "0.05s" }}>
          <span className="text-white">YOUR ERA,</span><br/>
          <span className="text-[#FFBE0B]">DECODED.</span>
        </h2>
        <div className="reveal" style={{ animationDelay: "0.25s" }}>
          <EraCard card={card} />
        </div>

        <div className="mt-6 grid gap-3">
          <button
            onClick={onSave}
            className="press reveal w-full rounded-2xl py-5 font-display text-lg uppercase tracking-wide bg-black text-white border-[3px] border-black border-b-[6px] border-b-[#FFBE0B] shadow-[6px_6px_0_0_#000]"
            style={{ animationDelay: "0.55s" }}
          >
            Save Card
          </button>
          <button
            onClick={onReset}
            className="press reveal w-full rounded-2xl py-4 text-xs font-bold tracking-[0.3em] uppercase bg-white text-black border-[3px] border-black shadow-[6px_6px_0_0_#000]"
            style={{ animationDelay: "0.7s" }}
          >
            Re-decode
          </button>
        </div>
      </div>
    </div>
  );
}
