import type { EraCard as EraCardType } from "@/lib/era.functions";
import { CharacterAvatar, pickCharacter } from "./Characters";

function boostSaturation(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  s = Math.min(1, s * 1.6 + 0.35);
  const newL = Math.min(0.62, Math.max(0.45, l));
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s;
  const p = 2 * newL - q;
  const rr = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const gg = Math.round(hue2rgb(p, q, h) * 255);
  const bb = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  return `#${[rr, gg, bb].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

function complement(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#FFBE0B";
  const n = parseInt(m[1], 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = (h + 0.45) % 1;
  s = Math.min(1, s * 1.7 + 0.4);
  const nl = 0.55;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = nl < 0.5 ? nl * (1 + s) : nl + s - nl * s;
  const p = 2 * nl - q;
  const rr = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const gg = Math.round(hue2rgb(p, q, h) * 255);
  const bb = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  return `#${[rr, gg, bb].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

const STARS = [
  { top: "8%", left: "12%", size: 10 }, { top: "14%", right: "10%", size: 8 },
  { top: "50%", left: "6%", size: 8 }, { top: "55%", right: "6%", size: 10 },
  { top: "78%", left: "16%", size: 8 }, { top: "82%", right: "14%", size: 10 },
];

export function EraCard({
  card, onSave, onShare,
}: {
  card: EraCardType; onSave?: () => void; onShare?: () => void;
}) {
  const baseRaw = card.aura_color_hex || "#FF006E";
  const base = boostSaturation(baseRaw);
  const comp = complement(baseRaw);
  const character = pickCharacter(card.character_type);

  return (
    <div
      className="absolute inset-0 flex flex-col text-white overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${base} 0%, ${comp} 55%, ${base} 100%)` }}
    >
      {/* blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-60 pointer-events-none" style={{ background: comp }} />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full blur-3xl opacity-60 pointer-events-none" style={{ background: base }} />

      {/* stars */}
      {STARS.map((s, i) => (
        <svg key={i} className="absolute twinkle pointer-events-none drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          style={{ top: s.top, left: s.left, right: s.right, width: s.size, height: s.size, animationDelay: `${i * 0.3}s` }}
          viewBox="0 0 24 24" fill="white">
          <path d="M12 0l2.6 8.4L24 12l-9.4 3.6L12 24l-2.6-8.4L0 12l9.4-3.6z" />
        </svg>
      ))}

      <div className="grain absolute inset-0 pointer-events-none" />

      {/* CONTENT */}
      <div className="relative h-full w-full flex flex-col px-4 pt-3 pb-3 gap-3">
        {/* TOP BAR */}
        <div className="flex items-center justify-between text-[10px] tracking-[0.35em] uppercase font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
          <span>● era os</span>
          <span>daily card ●</span>
        </div>

        {/* MAIN TWO COLUMN */}
        <div className="grid grid-cols-[1fr_1.15fr] gap-3 items-center fade-up" style={{ animationDelay: "0.1s" }}>
          {/* Left: character */}
          <div className="flex flex-col items-center gap-2">
            <CharacterAvatar name={character} size={120} />
            <div className="text-center text-[9px] font-black uppercase tracking-[0.18em] text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] leading-tight">
              {character}
            </div>
          </div>

          {/* Right: vibe + era + truth */}
          <div className="flex flex-col gap-2 min-w-0">
            <div className="font-display text-[2.4rem] leading-[0.9] -tracking-[0.04em] text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.4)] break-words">
              {card.vibe_word}
            </div>
            <div className="font-display text-[1rem] leading-[1] uppercase text-white/95 -tracking-[0.02em] break-words">
              {card.current_era}
            </div>
            <div className="rounded-xl px-2.5 py-1.5 bg-white/95 text-black backdrop-blur-sm shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
              <p className="text-[10.5px] font-bold leading-snug">
                <span className="font-display text-base mr-1" style={{ color: base }}>"</span>
                {card.brutal_truth}
              </p>
            </div>
          </div>
        </div>

        {/* TRAITS ROW — 3 pills full width */}
        <div className="grid grid-cols-3 gap-1.5 fade-up" style={{ animationDelay: "0.2s" }}>
          <Trait icon="●" label="aura" value={card.aura_color_name} tint={base} />
          <Trait icon="⚠" label="warning" value={card.todays_warning} tint={comp} />
          <Trait icon="⚡" label="power move" value={card.todays_power_move} tint={base} />
        </div>

        {/* COSMIC ENERGY */}
        <div className="flex-1 flex flex-col gap-1.5 fade-up min-h-0" style={{ animationDelay: "0.3s" }}>
          <div className="h-px bg-white/30" />
          <div className="text-center text-[10px] tracking-[0.3em] uppercase font-black text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
            ✦ cosmic energy today ✦
          </div>
          <div className="rounded-xl px-3 py-2 bg-black/30 backdrop-blur-md border border-white/20 overflow-hidden">
            <p className="text-[11px] leading-snug text-white/95 italic">
              {card.cosmic_prediction}
            </p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="grid grid-cols-2 gap-2 fade-up" style={{ animationDelay: "0.45s" }}>
          <button
            onClick={onSave}
            className="press rounded-xl py-2.5 font-display text-xs uppercase tracking-wide bg-black text-white border-2 border-black/80 shadow-[0_4px_0_0_rgba(0,0,0,0.35)]"
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

function Trait({ icon, label, value, tint }: { icon: string; label: string; value: string; tint: string }) {
  return (
    <div
      className="rounded-xl px-2 py-1.5 text-white backdrop-blur-sm overflow-hidden flex flex-col"
      style={{
        background: `${tint}dd`,
        border: "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
      }}
    >
      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.18em] opacity-90">
        <span className="text-[10px]">{icon}</span>{label}
      </div>
      <div className="text-[10px] font-bold leading-tight mt-0.5 break-words line-clamp-3">
        {value}
      </div>
    </div>
  );
}
