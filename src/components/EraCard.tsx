import type { EraCard as EraCardType } from "@/lib/era.functions";

// Pick a vibrant complement for the diagonal gradient
function complement(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#FFBE0B";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  // rotate channels + boost saturation-ish
  const cr = Math.min(255, 255 - r);
  const cg = Math.min(255, 255 - g);
  const cb = Math.min(255, 255 - b);
  // mix toward a poppy hue
  const mix = (a: number, b: number) => Math.round(a * 0.55 + b * 0.45);
  return `#${[mix(cr, 255), mix(cg, 110), mix(cb, 200)]
    .map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function truncate(s: string, words: number) {
  const parts = s.split(/\s+/);
  if (parts.length <= words) return s.replace(/[.!?]+$/, "");
  return parts.slice(0, words).join(" ");
}

export function EraCard({
  card,
  onSave,
  onShare,
}: {
  card: EraCardType;
  onSave?: () => void;
  onShare?: () => void;
}) {
  const base = card.aura_color_hex || "#FF006E";
  const comp = complement(base);

  return (
    <div
      className="absolute inset-0 flex flex-col text-white overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${base} 0%, ${comp} 100%)`,
      }}
    >
      {/* soft blobs for depth */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: comp }}
      />
      <div
        className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: base }}
      />
      <div className="grain absolute inset-0 pointer-events-none" />

      <div className="relative h-full w-full flex flex-col px-5 pt-4 pb-4">
        {/* TOP BAR */}
        <div className="flex items-center justify-between text-[10px] tracking-[0.35em] uppercase text-white/70 font-bold">
          <span>era os</span>
          <span>daily card</span>
        </div>

        {/* AVATAR */}
        <div className="mt-3 flex justify-center fade-up" style={{ animationDelay: "0.05s" }}>
          <div
            className="relative h-32 w-32 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "3px solid rgba(255,255,255,0.95)",
              boxShadow:
                "0 0 0 6px rgba(255,255,255,0.15), 0 0 40px 6px rgba(255,255,255,0.45), inset 0 0 30px rgba(255,255,255,0.15)",
            }}
          >
            <div className="flex items-center gap-1 text-[2.2rem] leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              <span className="-rotate-12">{card.emojis?.[0] ?? "✨"}</span>
              <span className="scale-125">{card.emojis?.[1] ?? "🌀"}</span>
              <span className="rotate-12">{card.emojis?.[2] ?? "🔥"}</span>
            </div>
          </div>
        </div>

        {/* ERA NAME */}
        <h2
          className="mt-4 font-display text-center text-[2rem] leading-[0.95] -tracking-[0.03em] uppercase fade-up"
          style={{
            animationDelay: "0.15s",
            textShadow: "0 2px 12px rgba(0,0,0,0.25)",
          }}
        >
          {card.current_era}
        </h2>

        {/* BRUTAL TRUTH */}
        <div
          className="mt-4 rounded-2xl px-4 py-3 backdrop-blur-md fade-up"
          style={{
            animationDelay: "0.25s",
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
          }}
        >
          <div className="flex gap-2">
            <span
              className="font-display text-3xl leading-none -mt-1"
              style={{ color: base }}
            >
              “
            </span>
            <p
              className="text-[0.95rem] font-bold text-black/85 leading-snug overflow-hidden"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {card.brutal_truth}
            </p>
          </div>
        </div>

        {/* PILLS */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center fade-up" style={{ animationDelay: "0.35s" }}>
          <Pill label={card.aura_color_name} tint={base} />
          <Pill label={"⚠ " + truncate(card.todays_warning, 5)} tint={comp} />
          <Pill label={"⚡ " + truncate(card.todays_power_move, 5)} tint={base} />
        </div>

        {/* spacer */}
        <div className="flex-1" />

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
            className="press w-full rounded-2xl py-3 font-display text-sm uppercase tracking-wide text-white border-2 border-white/90 bg-white/10 backdrop-blur-sm"
          >
            Share
          </button>
        </div>

        {/* WATERMARK */}
        <div className="mt-2 text-center text-[9px] tracking-[0.4em] uppercase text-white/50">
          era os
        </div>
      </div>
    </div>
  );
}

function Pill({ label, tint }: { label: string; tint: string }) {
  return (
    <span
      className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white whitespace-nowrap backdrop-blur-sm"
      style={{
        background: `${tint}cc`,
        border: "1.5px solid rgba(255,255,255,0.85)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      {label}
    </span>
  );
}
