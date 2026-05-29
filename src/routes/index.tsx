import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  submitDailyAnswers, getDailyQuestions, getTodayDecode, upsertProfile, getProfile,
  type EraCard as EraCardType, type QuestionDTO,
} from "@/lib/era.functions";
import { detectLocation, getCachedLocation } from "@/lib/location";
import { EraCard } from "@/components/EraCard";
import { Onboarding, type OnboardingData } from "@/components/Onboarding";
import { Login } from "@/components/Login";
import { supabase } from "@/integrations/supabase/client";

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
const READING_TEXT = "reading your world...";

function Index() {
  const decode = useServerFn(submitDailyAnswers);
  const fetchQs = useServerFn(getDailyQuestions);
  const fetchToday = useServerFn(getTodayDecode);
  const saveProfile = useServerFn(upsertProfile);
  const loadProfile = useServerFn(getProfile);
  const router = useRouter();

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [loadingQs, setLoadingQs] = useState(false);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [answers, setAnswers] = useState<{ question_id: string; question: string; answer: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<null | "liquid" | "glitch" | "fade">(null);
  const [card, setCard] = useState<EraCardType | null>(null);
  const [typed, setTyped] = useState("");
  const [readingTyped, setReadingTyped] = useState("");
  const [alreadyDecoded, setAlreadyDecoded] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [regenUsed, setRegenUsed] = useState(0);

  // Watch auth state
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  // After login: load profile + today's decode
  useEffect(() => {
    if (!authed) return;
    (async () => {
      const p = await loadProfile();
      if (!p || !p.name || !p.dob) {
        setNeedsOnboarding(true);
      } else {
        setProfile(p);
        setNeedsOnboarding(false);
        const t = await fetchToday();
        setIsPremium(t.is_premium);
        setRegenUsed(t.regenerations_used);
        if (t.card) {
          setCard(t.card);
          setAlreadyDecoded(true);
          setStep(4);
          setStarted(true);
        }
      }
    })().catch((e) => toast.error(e instanceof Error ? e.message : "Load failed"));
  }, [authed]);

  const completeOnboarding = async (data: OnboardingData) => {
    try {
      const loc = await detectLocation().catch(() => ({ region: "GLOBAL" as const }));
      await saveProfile({ data: { ...data, region: loc.region } });
      const p = await loadProfile();
      setProfile(p);
      setNeedsOnboarding(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save profile");
    }
  };

  const beginQuestions = async () => {
    setLoadingQs(true);
    setStarted(true);
    try {
      // try cached location first for speed, then refresh in background
      let loc = getCachedLocation();
      if (!loc?.city) {
        loc = await detectLocation().catch(() => null);
      }
      const res = await fetchQs({ data: { city: loc?.city, country: loc?.country } });
      setQuestions(res.questions);
      setAnswers([]);
      setStep(0);
      setLoadingQs(false);
    } catch (e) {
      setLoadingQs(false);
      setStarted(false);
      toast.error(e instanceof Error ? e.message : "Couldn't load questions");
    }
  };

  // Typewriter — "reading your world..." while questions generate
  useEffect(() => {
    if (!loadingQs) return;
    setReadingTyped("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setReadingTyped(READING_TEXT.slice(0, i));
      if (i >= READING_TEXT.length) {
        // loop the typing for that "still thinking" feel
        setTimeout(() => { i = 0; setReadingTyped(""); }, 900);
      }
    }, 70);
    return () => clearInterval(id);
  }, [loadingQs]);

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

  const runDecode = async (allAnswers: typeof answers, force = false) => {
    setStep(3);
    try {
      const result = await decode({ data: { answers: allAnswers, force } });
      setTimeout(() => {
        setCard(result.card);
        setRegenUsed(result.regenerations_used);
        setAlreadyDecoded(true);
        setStep(4);
      }, 1600);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Decode failed";
      if (msg.includes("DAILY_LIMIT")) {
        toast.error("Your era is set for today. Come back tomorrow. 🌙");
      } else if (msg.includes("REGEN_LIMIT")) {
        toast.error("You've used your daily regeneration. 🌙");
      } else {
        toast.error(msg);
      }
      setStep(2);
    }
  };

  const handleSelect = (opt: string) => {
    if (selected || transitioning) return;
    setSelected(opt);
    const curStyle = Q_STYLES[step];
    const q = questions[step];
    setTimeout(() => {
      setTransitioning(curStyle.transition);
      setTimeout(() => {
        const nextAnswers = [...answers, { question_id: q.id, question: q.question_text, answer: opt }];
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
      toast.error("Couldn't save.");
    }
  };

  const onShare = async () => {
    if (!card) return;
    const text = `My current era: ${card.current_era}\n"${card.brutal_truth}"\n— decoded by era os`;
    try {
      if (navigator.share) await navigator.share({ title: "My Era", text });
      else { await navigator.clipboard.writeText(text); toast.success("Copied."); }
    } catch {}
  };

  const tryRegenerate = async () => {
    if (!isPremium) {
      toast.error("Your era is set for today. Come back tomorrow. 🌙");
      return;
    }
    if (regenUsed >= 1) {
      toast.error("You've used your daily regeneration. 🌙");
      return;
    }
    await beginQuestions();
  };

  if (authed === null) {
    return <main className="h-[100dvh] w-full bg-black" />;
  }

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden text-white font-sans">
      <Toaster theme="dark" position="top-center" richColors />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;700;800;900&display=swap"
      />

      {!authed && <Login />}
      {authed && needsOnboarding && <Onboarding onDone={completeOnboarding} />}

      {authed && !needsOnboarding && !started && (
        <IntroScreen onStart={beginQuestions} profile={profile} />
      )}

      {authed && started && loadingQs && (
        <LoadingScreen typed={readingTyped} sublabel="eraos · reading the room" />
      )}

      {authed && started && !loadingQs && step <= 2 && questions[step] && (
        <QuestionScreen
          index={step}
          question={questions[step]}
          selected={selected}
          transitioning={transitioning}
          onSelect={handleSelect}
        />
      )}

      {step === 3 && !loadingQs && <LoadingScreen typed={typed} sublabel="eraos · oracle" />}

      {step === 4 && card && (
        <ResultScreen
          card={card}
          profile={profile}
          onSave={onSave}
          onShare={onShare}
          onReset={tryRegenerate}
          alreadyDecoded={alreadyDecoded}
          isPremium={isPremium}
          regenUsed={regenUsed}
        />
      )}
    </main>
  );
}


const MARQUEE_ITEMS = ["know your arc", "decode your era", "find your vibe", "trust the process"];

function IntroScreen({ onStart, profile }: { onStart: () => void; profile: any }) {
  return (
    <div className="absolute inset-0 overflow-hidden text-white" style={{ background: "var(--grad-hero)" }}>
      <div className="blob float-slow" style={{ width: 320, height: 320, background: "#FF006E", top: -60, left: -80 }} />
      <div className="blob float-med" style={{ width: 280, height: 280, background: "#FFBE0B", bottom: -60, right: -60 }} />
      <div className="blob float-slow" style={{ width: 220, height: 220, background: "#8338EC", top: "40%", right: -40 }} />
      <div className="grain absolute inset-0 pointer-events-none" />

      <div className="relative h-full flex flex-col px-6 pt-6 pb-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-4 h-4 rounded-full bg-[#FFBE0B] shadow-[0_0_18px_6px_rgba(255,190,11,0.55)] animate-pulse" />
            <span className="text-lg font-bold tracking-tight lowercase text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">era os</span>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white"
          >sign out</button>
        </div>

        <div className="mt-10">
          <h1 className="font-display text-[4.2rem] leading-[0.92] -tracking-[0.04em] text-shadow-pop">
            <span className="block text-white">{profile?.name ? `HEY ${String(profile.name).split(" ")[0].toUpperCase()},` : "DECODE"}</span>
            <span className="block text-white">DECODE</span>
            <span className="block text-[#FFBE0B]">YOUR ERA.</span>
          </h1>
          <p className="mt-5 text-base font-bold text-white max-w-[18rem] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
            Three weird questions. One brutally honest card.
          </p>
        </div>

        <div className="mt-6 marquee">
          <div className="inline-block rounded-full bg-black/55 px-5 py-2 backdrop-blur-sm border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="marquee-track text-xs font-black uppercase tracking-[0.25em] text-white">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
                <span key={i} className="px-3">{t} ·</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4" />

        <button
          onClick={onStart}
          className="press animate-bounce-in w-full rounded-2xl py-7 font-display text-[1.8rem] uppercase tracking-wide text-white shadow-[0_0_30px_rgba(255,0,110,0.35),0_0_60px_rgba(131,56,236,0.25),6px_6px_0_0_#000]"
          style={{ background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)", border: "4px solid black", borderBottomWidth: "8px", borderBottomColor: "#FFBE0B" }}
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
          <div className="h-full bg-black transition-all duration-500" style={{ width: i < index ? "100%" : i === index ? "100%" : "0%" }} />
        </div>
      ))}
    </div>
  );
}

function QuestionScreen({
  index, question, selected, transitioning, onSelect,
}: {
  index: number;
  question: QuestionDTO;
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
          {question.question_text}
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
        <div className="mt-6 text-[11px] tracking-[0.4em] uppercase text-white/40">eraos · oracle</div>
      </div>
    </div>
  );
}

function Countdown() {
  const [str, setStr] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const ms = tomorrow.getTime() - now.getTime();
      const h = Math.floor(ms / 3.6e6);
      const m = Math.floor((ms % 3.6e6) / 6e4);
      const s = Math.floor((ms % 6e4) / 1000);
      setStr(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono">{str}</span>;
}

function ResultScreen({
  card, profile, onSave, onShare, onReset, alreadyDecoded, isPremium, regenUsed,
}: {
  card: EraCardType;
  profile: any;
  onSave: () => void;
  onShare: () => void;
  onReset: () => void;
  alreadyDecoded: boolean;
  isPremium: boolean;
  regenUsed: number;
}) {
  const canRegen = isPremium && regenUsed < 1;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <EraCard card={card} profile={profile} onSave={onSave} onShare={onShare} />


      {alreadyDecoded && (
        <div className="absolute top-3 left-3 z-20 rounded-full bg-black/55 backdrop-blur-md border border-white/30 text-white text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1.5">
          next decode in <Countdown />
        </div>
      )}

      {canRegen && (
        <button
          onClick={onReset}
          aria-label="Regenerate"
          className="press absolute top-3 right-3 z-20 rounded-full bg-gradient-to-r from-[#FF006E] to-[#8338EC] border border-white/40 text-white text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1.5"
        >↻ regenerate (premium)</button>
      )}
    </div>
  );
}
