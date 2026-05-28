import type { EraCard as EraCardType } from "@/lib/era.functions";
import { pickCharacter } from "./Characters";

const CHARACTER_EMOJI: Record<string, string> = {
  "The Menace": "😈",
  "The Ghost": "👻",
  "The Haunted": "👻",
  "The Villain": "🖤",
  "The Delulu": "🌸",
  "The Goblin": "👺",
  "The Romantic": "💘",
  "The Overthinker": "🌀",
  "The Chaotic": "⚡",
  "The Sage": "🔮",
  "The Gremlin": "👹",
  "The Unbothered": "😌",
  "The Main Character": "👑",
  "The Mystic": "🌙",
  "The Softlaunch": "🌷",
  "The Feral": "🔥",
};

type Gradient = { bg: string; from: string; to: string; accent: string };

// All vibrant, loud, saturated — sibling to grad-hero (#FF006E → #8338EC → #FB5607 → #FFBE0B)
const GRADIENTS: Record<string, Gradient> = {
  // Haunted / Ghost — electric blue → deep purple (still vibrant, not dark navy)
  "The Ghost":         { bg: "linear-gradient(135deg,#00C2FF 0%,#5B2EFF 50%,#B5179E 100%)", from: "#5B2EFF", to: "#00C2FF", accent: "#FFD400" },
  "The Haunted":       { bg: "linear-gradient(135deg,#00C2FF 0%,#5B2EFF 50%,#B5179E 100%)", from: "#5B2EFF", to: "#00C2FF", accent: "#FFD400" },
  // Villain — deep red → dark purple, still vivid
  "The Villain":       { bg: "linear-gradient(135deg,#FF1744 0%,#9D0208 45%,#3A0CA3 100%)", from: "#FF1744", to: "#3A0CA3", accent: "#FFD400" },
  // Soft / Romantic — coral → warm gold
  "The Romantic":      { bg: "linear-gradient(135deg,#FF6F61 0%,#FF9E5E 45%,#FFD166 100%)", from: "#FF6F61", to: "#FFD166", accent: "#FFFFFF" },
  "The Softlaunch":    { bg: "linear-gradient(135deg,#FF8FA3 0%,#FFB347 50%,#FFD166 100%)", from: "#FF8FA3", to: "#FFD166", accent: "#FFFFFF" },
  // Delulu — purple → bubblegum pink
  "The Delulu":        { bg: "linear-gradient(135deg,#9B5BE3 0%,#FF4FA3 55%,#FFB6E1 100%)", from: "#9B5BE3", to: "#FF4FA3", accent: "#FFD166" },
  // Sage / Mystic — purple energy, still loud
  "The Sage":          { bg: "linear-gradient(135deg,#7209B7 0%,#B5179E 50%,#FF006E 100%)", from: "#7209B7", to: "#FF006E", accent: "#FFD400" },
  "The Mystic":        { bg: "linear-gradient(135deg,#7209B7 0%,#B5179E 50%,#FF006E 100%)", from: "#7209B7", to: "#FF006E", accent: "#FFD400" },
  // Overthinker — electric blue → purple → magenta
  "The Overthinker":   { bg: "linear-gradient(135deg,#3A86FF 0%,#8338EC 55%,#FF006E 100%)", from: "#3A86FF", to: "#FF006E", accent: "#FFD400" },
  // Unbothered — teal → magenta (loud)
  "The Unbothered":    { bg: "linear-gradient(135deg,#06D6A0 0%,#118AB2 50%,#8338EC 100%)", from: "#06D6A0", to: "#8338EC", accent: "#FFD166" },
  // Main Character — full hero gradient
  "The Main Character":{ bg: "linear-gradient(135deg,#FF006E 0%,#8338EC 38%,#FB5607 72%,#FFBE0B 100%)", from: "#FF006E", to: "#FFBE0B", accent: "#FFFFFF" },
  // Chaotic / Menace / Gremlin / Feral — hot pink → electric purple → orange
  "The Chaotic":       { bg: "linear-gradient(135deg,#FF006E 0%,#8338EC 50%,#FB5607 100%)", from: "#FF006E", to: "#FB5607", accent: "#FFD400" },
  "The Menace":        { bg: "linear-gradient(135deg,#FF006E 0%,#8338EC 50%,#FB5607 100%)", from: "#FF006E", to: "#FB5607", accent: "#FFD400" },
  "The Gremlin":       { bg: "linear-gradient(135deg,#FF006E 0%,#8338EC 50%,#9BE15D 100%)", from: "#FF006E", to: "#8338EC", accent: "#FFD400" },
  "The Feral":         { bg: "linear-gradient(135deg,#FF006E 0%,#FB5607 55%,#FFBE0B 100%)", from: "#FF006E", to: "#FB5607", accent: "#FFD400" },
};

const DEFAULT_GRADIENT: Gradient = {
  bg: "linear-gradient(135deg,#FF006E 0%,#8338EC 38%,#FB5607 72%,#FFBE0B 100%)",
  from: "#FF006E", to: "#FFBE0B", accent: "#FFFFFF",
};

const STARS = [
  { top: "6%", left: "10%", size: 10 },  { top: "11%", right: "12%", size: 7 },
  { top: "22%", left: "78%", size: 5 },  { top: "32%", left: "5%", size: 8 },
  { top: "46%", left: "92%", size: 6 },  { top: "55%", left: "4%", size: 9 },
  { top: "65%", right: "8%", size: 7 },  { top: "72%", left: "20%", size: 5 },
  { top: "85%", right: "22%", size: 8 }, { top: "92%", left: "50%", size: 6 },
];

const DOTS = [
  { top: "18%", left: "30%" }, { top: "27%", left: "62%" }, { top: "40%", left: "18%" },
  { top: "52%", left: "70%" }, { top: "60%", left: "40%" }, { top: "70%", left: "85%" },
  { top: "80%", left: "10%" }, { top: "88%", left: "65%" }, { top: "15%", left: "55%" },
  { top: "35%", left: "50%" }, { top: "48%", left: "32%" }, { top: "75%", left: "55%" },
];

export function EraCard({
  card, onSave, onShare,
}: {
  card: EraCardType; onSave?: () => void; onShare?: () => void;
}) {
  const character = pickCharacter(card.character_type);
  const emoji = CHARACTER_EMOJI[character] ?? "✨";
  const g = GRADIENTS[character] ?? DEFAULT_GRADIENT;

  return (
    <div
      className="absolute inset-0 flex flex-col text-white overflow-hidden"
      style={{ background: g.bg }}
    >
      {/* glow blobs — amp the vibrancy */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-70 pointer-events-none" style={{ background: g.accent }} />
      <div className="absolute -bottom-28 -right-24 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-70 pointer-events-none" style={{ background: g.from }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: g.to }} />

      {/* stars */}
      {STARS.map((s, i) => (
        <svg key={`s${i}`} className="absolute twinkle pointer-events-none drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
          style={{ top: s.top, left: s.left, right: s.right, width: s.size, height: s.size, animationDelay: `${i * 0.25}s` }}
          viewBox="0 0 24 24" fill="white">
          <path d="M12 0l2.6 8.4L24 12l-9.4 3.6L12 24l-2.6-8.4L0 12l9.4-3.6z" />
        </svg>
      ))}
      {/* dots */}
      {DOTS.map((d, i) => (
        <span key={`d${i}`} className="absolute rounded-full pointer-events-none twinkle"
          style={{ top: d.top, left: d.left, width: 4, height: 4, background: "rgba(255,255,255,0.85)", animationDelay: `${i * 0.4}s` }} />
      ))}

      <div className="grain absolute inset-0 pointer-events-none" />

      {/* CONTENT: full-height flex, evenly spread */}
      <div className="relative h-full w-full flex flex-col justify-between px-4 py-3">
        {/* TOP BAR */}
        <div className="flex items-center justify-between text-[10px] tracking-[0.35em] uppercase font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <span>● era os</span>
          <span>daily card ●</span>
        </div>

        {/* HERO: character poster */}
        <div className="flex flex-col items-center gap-3 fade-up" style={{ animationDelay: "0.1s" }}>
          <div
            className="relative flex items-center justify-center rounded-full bob"
            style={{
              width: 120, height: 120,
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), ${g.accent}cc 55%, ${g.from}dd 100%)`,
              border: "3px solid rgba(255,255,255,0.95)",
              boxShadow: `0 0 56px ${g.accent}, 0 16px 40px rgba(0,0,0,0.45), inset 0 -8px 18px rgba(0,0,0,0.2)`,
            }}
          >
            <span style={{ fontSize: 64, lineHeight: 1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))" }}>{emoji}</span>
          </div>
          <div className="text-center text-[11px] font-black uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            {character}
          </div>
        </div>

        {/* VIBE + ERA + TRUTH */}
        <div className="flex flex-col items-center gap-2 text-center fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative">
            <div className="font-display text-[2.6rem] leading-[0.95] -tracking-[0.04em] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.5)] break-words">
              {card.vibe_word}
            </div>
            <div className="absolute inset-0 shimmer-bg rounded-md pointer-events-none mix-blend-overlay" />
          </div>
          <div className="font-display text-base leading-tight uppercase text-white/95 -tracking-[0.02em] break-words px-2">
            {card.current_era}
          </div>
          <div className="w-full rounded-xl px-3 py-2 bg-white/95 text-black shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
            <p className="text-[11px] font-bold leading-snug">
              <span className="font-display text-base mr-1" style={{ color: g.from }}>"</span>
              {card.brutal_truth}
            </p>
          </div>
        </div>

        {/* PILLS: aura full width, then warning + power move */}
        <div className="flex flex-col gap-1.5 fade-up" style={{ animationDelay: "0.3s" }}>
          <Trait icon="●" label="aura" value={card.aura_color_name} tint={g.from} fullWidth />
          <div className="grid grid-cols-2 gap-1.5">
            <Trait icon="⚠" label="warning" value={card.todays_warning} tint={g.to} />
            <Trait icon="⚡" label="power move" value={card.todays_power_move} tint={g.accent} dark />
          </div>
        </div>

        {/* COSMIC ENERGY */}
        <div className="flex flex-col gap-1.5 fade-up" style={{ animationDelay: "0.4s" }}>
          <div className="text-center text-[10px] tracking-[0.3em] uppercase font-black text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            ✦ cosmic energy today ✦
          </div>
          <div className="rounded-xl px-3 py-2 bg-black/35 backdrop-blur-md border border-white/25">
            <p className="text-[11px] leading-snug text-white/95 italic">
              {card.cosmic_prediction}
            </p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="grid grid-cols-2 gap-2 fade-up" style={{ animationDelay: "0.5s" }}>
          <button
            onClick={onSave}
            className="press rounded-xl py-2.5 font-display text-xs uppercase tracking-wide bg-black text-white border-2 border-black/80 shadow-[0_4px_0_0_rgba(0,0,0,0.4)]"
          >
            Save Card
          </button>
          <button
            onClick={onShare}
            className="press rounded-xl py-2.5 font-display text-xs uppercase tracking-wide text-white border-2 border-white/90 bg-white/15 backdrop-blur-sm"
          >
            Share
          </button>
        </div>

        {/* WATERMARK */}
        <div className="text-center text-[8px] tracking-[0.4em] uppercase text-white/60">
          era os
        </div>
      </div>
    </div>
  );
}

function Trait({
  icon, label, value, tint, fullWidth, dark,
}: { icon: string; label: string; value: string; tint: string; fullWidth?: boolean; dark?: boolean }) {
  const textColor = dark ? "#0a0a0a" : "white";
  return (
    <div
      className={`rounded-xl px-2.5 py-1.5 backdrop-blur-sm flex ${fullWidth ? "flex-row items-center gap-2" : "flex-col"}`}
      style={{
        background: `${tint}e6`,
        border: "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        color: textColor,
      }}
    >
      <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.18em] ${dark ? "opacity-80" : "opacity-95"}`}>
        <span className="text-[11px]">{icon}</span>{label}
      </div>
      <div className={`text-[11px] font-bold leading-snug break-words ${fullWidth ? "flex-1 text-right" : "mt-0.5"}`}>
        {value}
      </div>
    </div>
  );
}
