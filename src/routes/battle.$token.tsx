import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { getBattle, playBattle, type EraCard as EraCardType } from "@/lib/era.functions";
import { AnimatedBg } from "@/components/AnimatedBg";

export const Route = createFileRoute("/battle/$token")({
  head: () => ({ meta: [{ title: "Battle on era os" }] }),
  component: BattlePage,
});

function BattlePage() {
  const { token } = Route.useParams();
  const fetchBattle = useServerFn(getBattle);
  const submit = useServerFn(playBattle);

  const [battle, setBattle] = useState<any>(null);
  const [step, setStep] = useState<"intro" | "questions" | "loading" | "done">("intro");
  const [name, setName] = useState("");
  const [zodiac, setZodiac] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<{ question_id: string; question: string; answer: string }[]>([]);
  const [result, setResult] = useState<{ creator_card: EraCardType; creator_name: string; opponent_card: EraCardType; verdict: string } | null>(null);

  useEffect(() => {
    fetchBattle({ data: { token } })
      .then((b) => {
        setBattle(b);
        if (b.opponent_card) {
          setResult({
            creator_card: b.creator_card as unknown as EraCardType,
            creator_name: (b.creator_name as string) ?? "Player 1",
            opponent_card: b.opponent_card as unknown as EraCardType,
            verdict: b.verdict || "",
          });
          setStep("done");
        }

      })
      .catch(() => toast.error("Battle not found"));
  }, [token]);

  const pick = (opt: string) => {
    if (!battle) return;
    const q = battle.questions[qIdx];
    const next = [...answers, { question_id: q.id, question: q.question_text, answer: opt }];
    setAnswers(next);
    if (qIdx < 2) setQIdx(qIdx + 1);
    else {
      setStep("loading");
      submit({ data: { token, name: name.trim() || "Friend", zodiac: zodiac || undefined, answers: next } })
        .then((r) => {
          setResult({
            creator_card: battle.creator_card as unknown as EraCardType,
            creator_name: battle.creator_name,
            opponent_card: r.opponent_card,
            verdict: r.verdict,
          });
          setStep("done");
        })
        .catch((e) => { toast.error(e instanceof Error ? e.message : "Failed"); setStep("questions"); setAnswers(answers); setQIdx(2); });
    }
  };

  if (!battle) return <main className="h-[100dvh] w-full bg-black text-white flex items-center justify-center">loading battle…</main>;

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden text-white">
      <Toaster theme="dark" position="top-center" richColors />
      <AnimatedBg preset="hero" />

      {step === "intro" && (
        <div className="relative h-full flex flex-col px-6 pt-10 pb-8 overflow-y-auto">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/70 font-bold">⚔️ era battle</div>
          <h1 className="font-display text-4xl mt-3 leading-tight">{battle.creator_name} challenged you.</h1>
          <p className="mt-3 text-white/85 text-sm">Answer 3 questions. We'll decode your era and see who's winning today.</p>

          <label className="mt-6 text-[10px] tracking-[0.3em] uppercase text-white/70">your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-black/40 border border-white/30 rounded-full px-4 py-3 text-white" placeholder="enter your name" />

          <label className="mt-3 text-[10px] tracking-[0.3em] uppercase text-white/70">zodiac (optional)</label>
          <input value={zodiac} onChange={(e) => setZodiac(e.target.value)} className="mt-1 bg-black/40 border border-white/30 rounded-full px-4 py-3 text-white" placeholder="aries, leo, etc." />

          <button
            disabled={!name.trim()}
            onClick={() => setStep("questions")}
            className="press mt-auto w-full rounded-2xl py-5 font-display text-xl uppercase text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)", border: "4px solid black", borderBottomWidth: "8px", borderBottomColor: "#FFBE0B" }}
          >
            Begin Battle
          </button>
        </div>
      )}

      {step === "questions" && (
        <div className="relative h-full flex flex-col px-6 pt-10 pb-8">
          <div className="text-[11px] tracking-[0.35em] uppercase text-white/80 font-bold">0{qIdx + 1} / 03</div>
          <h2 className="font-display text-3xl mt-4 leading-tight">{battle.questions[qIdx].question_text}</h2>
          <div className="grid gap-3 mt-6">
            {battle.questions[qIdx].options.map((opt: string) => (
              <button key={opt} onClick={() => pick(opt)} className="press text-left rounded-full px-5 py-4 font-bold bg-white text-black border-2 border-black">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center">
            <div className="font-display text-2xl">decoding the battle…</div>
            <div className="mt-3 text-[11px] tracking-[0.4em] uppercase text-white/60">eraos · arena</div>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="relative h-full overflow-y-auto px-5 pt-8 pb-10">
          <div className="text-center">
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/70 font-bold">⚔️ verdict</div>
            <p className="font-display text-2xl mt-2 leading-tight">{result.verdict}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <BattleSide name={result.creator_name} card={result.creator_card} />
            <BattleSide name={battle.opponent_name || name || "you"} card={result.opponent_card} />
          </div>

          <button
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) navigator.share({ title: "Era Battle", text: result.verdict, url }).catch(() => {});
              else { navigator.clipboard.writeText(url); toast.success("Link copied."); }
            }}
            className="press mt-6 w-full rounded-2xl py-4 font-display text-lg uppercase text-white"
            style={{ background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)", border: "3px solid black", borderBottomWidth: "6px", borderBottomColor: "#FFBE0B" }}
          >
            share this battle
          </button>
        </div>
      )}
    </main>
  );
}

function BattleSide({ name, card }: { name: string; card: EraCardType }) {
  const bg = card.aura_color_hex?.match(/^#[0-9a-fA-F]{6}$/) ? card.aura_color_hex : "#FF006E";
  return (
    <div className="rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0_0_#000]" style={{ background: bg }}>
      <div className="text-[9px] tracking-[0.3em] uppercase text-black/70 font-bold">{name}</div>
      <div className="font-display text-white text-xl mt-2 leading-tight uppercase" style={{ textWrap: "balance" as any }}>{card.vibe_word}</div>
      <div className="text-white/90 text-[11px] font-bold uppercase tracking-wide mt-1 leading-tight">{card.current_era}</div>
      <div className="text-white text-[11px] mt-2 leading-snug italic">"{card.brutal_truth}"</div>
    </div>
  );
}
