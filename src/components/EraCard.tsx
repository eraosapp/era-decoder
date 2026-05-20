import type { EraCard as EraCardType } from "@/lib/era.functions";

// Push saturation way up using HSL boost
function boostSaturation(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = ((n >> 16) & 255) / 255;
  let g = ((n >> 8) & 255) / 255;
  let b = (n & 255) / 255;
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
  let r = ((n >> 16) & 255) / 255;
  let g = ((n >> 8) & 255) / 255;
  let b = (n & 255) / 255;
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

// Deterministic scattered positions for stars/dots
const STARS = [
  { top: "6%", left: "8%", size: 14, delay: "0s" },
  { top: "12%", left: "78%", size: 10, delay: "0.4s" },
  { top: "22%", left: "42%", size: 8, delay: "0.9s" },
  { top: "34%", left: "88%", size: 12, delay: "0.2s" },
  { top: "48%", left: "6%", size: 10, delay: "1.1s" },
  { top: "58%", left: "92%", size: 8, delay: "0.7s" },
  { top: "70%", left: "12%", size: 12, delay: "1.4s" },
  { top: "82%", left: "70%", size: 10, delay: "0.3s" },
  { top: "90%", left: "30%", size: 8, delay: "1.0s" },
];

const DOTS = [
  { top: "18%", left: "20%", size: 4 },
  { top: "28%", left: "65%", size: 3 },
  { top: "40%", left: "32%", size: 5 },
  { top: "44%", left: "72%", size: 3 },
  { top: "54%", left: "22%", size: 4 },
  { top: "64%", left: "50%", size: 3 },
  { top: "76%", left: "84%", size: 5 },
  { top: "86%", left: "48%", size: 3 },
  { top: "14%", left: "55%", size: 3 },
  { top: "38%", left: "12%", size: 4 },
];

export function EraCard({
  card,
  onSave,
  onShare,
}: {
  card: EraCardType;
  onSave?: () => void;
  onShare?: () => void;
}) {
  const baseRaw = card.aura_color_hex || "#FF006E";
  const base = boostSaturation(baseRaw);
  const comp = complement(baseRaw);

  return (
    <div
      className="absolute inset-0 flex flex-col text-white overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${base} 0%, ${comp} 55%, ${base} 100%)`,
      }}
    >
      {/* vibrant blobs */}
      <div
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-70 pointer-events-none"
        style={{ background: comp }}
      />
      <div
        className="absolute -bottom-28 -right-20 w-96 h-96 rounded-full blur-3xl opacity-70 pointer-events-none"
        style={{ background: base }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "#FFBE0B" }}
      />

      {/* scattered stars */}
      {STARS.map((s, i) => (
        <svg
          key={`s-${i}`}
          className="absolute twinkle pointer-events-none drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M12 0l2.6 8.4L24 12l-9.4 3.6L12 24l-2.6-8.4L0 12l9.4-3.6z" />
        </svg>
      ))}

      {/* scattered dots */}
      {DOTS.map((d, i) => (
        <span
          key={`d-${i}`}
          className="absolute rounded-full bg-white/80 pointer-events-none"
          style={{ top: d.top, left: d.left, width: d.size, height: d.size }}
        />
      ))}

      <div className="grain absolute inset-0 pointer-events-none" />

      {/* CONTENT — evenly distributed */}
      <div className="relative h-full w-full flex flex-col justify-between px-5 pt-4 pb-4">
        {/* TOP BAR */}
        <div className="flex items-center justify-between text-[10px] tracking-[0.35em] uppercase text-white font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
          <span>● era os</span>
          <span>daily card ●</span>
        </div>

        {/* AVATAR */}
        <div className="flex justify-center fade-up" style={{ animationDelay: "0.05s" }}>
          <div
            className="relative h-28 w-28 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "3px solid rgba(255,255,255,0.95)",
              boxShadow:
                "0 0 0 6px rgba(255,255,255,0.18), 0 0 50px 10px rgba(255,255,255,0.5), inset 0 0 30px rgba(255,255,255,0.2)",
            }}
          >
            <div className="flex items-center gap-0.5 text-[2rem] leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
              <span className="-rotate-12">{card.emojis?.[0] ?? "✨"}</span>
              <span className="scale-125">{card.emojis?.[1] ?? "🌀"}</span>
              <span className="rotate-12">{card.emojis?.[2] ?? "🔥"}</span>
            </div>
          </div>
        </div>

        {/* ERA NAME with shimmer */}
        <div className="relative fade-up" style={{ animationDelay: "0.15s" }}>
          <h2
            className="font-display text-center text-[2.1rem] leading-[0.95] -tracking-[0.03em] uppercase relative"
            style={{
              textShadow: "0 2px 16px rgba(0,0,0,0.35), 0 0 30px rgba(255,255,255,0.25)",
            }}
          >
            {card.current_era}
          </h2>
          <div
            className="absolute inset-0 pointer-events-none shimmer-bg"
            style={{ mixBlendMode: "overlay" }}
          />
        </div>

        {/* BRUTAL TRUTH */}
        <div
          className="rounded-2xl px-4 py-3 backdrop-blur-md fade-up"
          style={{
            animationDelay: "0.25s",
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
          }}
        >
          <div className="flex gap-2">
            <span
              className="font-display text-3xl leading-none -mt-1"
              style={{ color: base }}
            >
              “
            </span>
            <p className="text-[0.95rem] font-bold text-black/85 leading-snug">
              {card.brutal_truth}
            </p>
          </div>
        </div>

        {/* PILLS — larger, wrap text */}
        <div className="flex flex-col gap-2 fade-up" style={{ animationDelay: "0.35s" }}>
          <Pill label={card.aura_color_name} tint={base} icon="●" />
          <Pill label={card.todays_warning} tint={comp} icon="⚠" />
          <Pill label={card.todays_power_move} tint={base} icon="⚡" />
        </div>

        {/* BUTTONS */}
        <div className="grid gap-2 fade-up" style={{ animationDelay: "0.5s" }}>
          <button
            onClick={onSave}
            className="press w-full rounded-2xl py-3.5 font-display text-base uppercase tracking-wide bg-black text-white border-2 border-black/80 shadow-[0_6px_0_0_rgba(0,0,0,0.35)]"
          >
            Save Card
          </button>
          <button
            onClick={onShare}
            className="press w-full rounded-2xl py-3 font-display text-sm uppercase tracking-wide text-white border-2 border-white/90 bg-white/15 backdrop-blur-sm"
          >
            Share
          </button>
        </div>

        {/* WATERMARK */}
        <div className="text-center text-[9px] tracking-[0.4em] uppercase text-white/60">
          era os
        </div>
      </div>
    </div>
  );
}

function Pill({ label, tint, icon }: { label: string; tint: string; icon: string }) {
  return (
    <span
      className="rounded-2xl px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white flex items-start gap-2 backdrop-blur-sm leading-tight"
      style={{
        background: `${tint}dd`,
        border: "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
      }}
    >
      <span className="text-sm leading-none mt-px shrink-0">{icon}</span>
      <span className="break-words">{label}</span>
    </span>
  );
}
