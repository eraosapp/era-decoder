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

type GradientPair = { from: string; to: string; accent: string };

const GRADIENTS: Record<string, GradientPair> = {
  "The Ghost":         { from: "#4A6B8A", to: "#0E2A33", accent: "#A8C4D6" },
  "The Haunted":       { from: "#4A6B8A", to: "#0E2A33", accent: "#A8C4D6" },
  "The Chaotic":       { from: "#FF1A8C", to: "#7A1FE0", accent: "#FFD400" },
  "The Menace":        { from: "#FF1A8C", to: "#7A1FE0", accent: "#FFD400" },
  "The Gremlin":       { from: "#FF1A8C", to: "#7A1FE0", accent: "#9BE15D" },
  "The Feral":         { from: "#FF1A8C", to: "#7A1FE0", accent: "#FF5722" },
  "The Villain":       { from: "#0E1538", to: "#7A0A1F", accent: "#FFD400" },
  "The Romantic":      { from: "#FF7A5A", to: "#FFB347", accent: "#FFE0C2" },
  "The Softlaunch":    { from: "#FF8FA3", to: "#FFC371", accent: "#FFE0C2" },
  "The Delulu":        { from: "#9B5BE3", to: "#FF7AB6", accent: "#FFD1E8" },
  "The Sage":          { from: "#6A48C7", to: "#1E1B4B", accent: "#B79EFF" },
  "The Mystic":        { from: "#5B2A86", to: "#0F0C29", accent: "#C9A8FF" },
  "The Overthinker":   { from: "#3F5BA9", to: "#1B2A55", accent: "#C3D7FF" },
  "The Unbothered":    { from: "#1A8A82", to: "#0B3A45", accent: "#7FD9CC" },
  "The Main Character":{ from: "#FF6F61", to: "#FFB347", accent: "#FFE066" },
};

const DEFAULT_GRADIENT: GradientPair = { from: "#7A1FE0", to: "#FF1A8C", accent: "#FFD400" };

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
      style={{ background: `linear-gradient(160deg, ${g.from} 0%, ${g.to} 100%)` }}
    >
      {/* glow blobs */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-70 pointer-events-none" style={{ background: g.accent }} />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 rounded-full blur-3xl opacity-60 pointer-events-none" style={{ background: g.from }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: g.accent }} />

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

        {/* HERO: character + name */}
        <div className="flex flex-col items-center gap-2 fade-up" style={{ animationDelay: "0.1s" }}>
          <div
            className="relative flex items-center justify-center rounded-full bob"
            style={{
              width: 112, height: 112,
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), ${g.accent}aa 60%, ${g.from}cc 100%)`,
              border: "3px solid rgba(255,255,255,0.95)",
              boxShadow: `0 0 48px ${g.accent}, 0 14px 36px rgba(0,0,0,0.45), inset 0 -8px 18px rgba(0,0,0,0.2)`,
            }}
          >
            <span style={{ fontSize: 64, lineHeight: 1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}>{emoji}</span>
          </div>
          <div className="text-center text-[11px] font-black uppercase tracking-[0.22em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
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
