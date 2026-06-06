import type { CSSProperties } from "react";

type Blob = { color: string; size: number; top?: string; left?: string; right?: string; bottom?: string; dur: number; delay?: number };

const PRESETS: Record<string, { bg: string; blobs: Blob[] }> = {
  hero: {
    bg: "linear-gradient(135deg, #FF006E 0%, #8338EC 38%, #FB5607 72%, #FFBE0B 100%)",
    blobs: [
      { color: "#FF006E", size: 360, top: "-12%", left: "-15%", dur: 18 },
      { color: "#8338EC", size: 320, bottom: "-10%", right: "-10%", dur: 22, delay: 2 },
      { color: "#FFBE0B", size: 240, top: "42%", right: "-8%", dur: 26, delay: 4 },
    ],
  },
  acid: {
    bg: "#CCFF00",
    blobs: [
      { color: "#00B4D8", size: 320, top: "-8%", left: "-12%", dur: 20 },
      { color: "#FF4D6D", size: 260, bottom: "-12%", right: "-12%", dur: 24, delay: 3 },
    ],
  },
  fuchsia: {
    bg: "#FF4D6D",
    blobs: [
      { color: "#8338EC", size: 320, top: "-12%", right: "-12%", dur: 22 },
      { color: "#FFBE0B", size: 240, bottom: "-10%", left: "-10%", dur: 18, delay: 2 },
    ],
  },
  cyan: {
    bg: "#00B4D8",
    blobs: [
      { color: "#FF006E", size: 320, top: "-10%", left: "-12%", dur: 20 },
      { color: "#FFBE0B", size: 240, bottom: "-12%", right: "-10%", dur: 26, delay: 3 },
    ],
  },
  loading: {
    bg: "#0a0a0f",
    blobs: [
      { color: "#FF006E", size: 360, top: "-12%", left: "-15%", dur: 18 },
      { color: "#8338EC", size: 320, bottom: "-10%", right: "-10%", dur: 22, delay: 2 },
      { color: "#FFBE0B", size: 220, top: "40%", right: "-12%", dur: 28, delay: 4 },
    ],
  },
};

export function AnimatedBg({
  preset = "hero",
  bg,
  blobs,
  className = "",
  intensity = 0.4,
}: {
  preset?: keyof typeof PRESETS;
  bg?: string;
  blobs?: Blob[];
  className?: string;
  intensity?: number;
}) {
  const p = PRESETS[preset];
  const finalBg = bg ?? p.bg;
  const finalBlobs = blobs ?? p.blobs;
  const style: CSSProperties = finalBg.startsWith("linear-gradient") || finalBg.startsWith("radial-gradient")
    ? { background: finalBg }
    : { backgroundColor: finalBg };

  return (
    <div className={"absolute inset-0 overflow-hidden " + className} style={style}>
      {finalBlobs.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full pointer-events-none animate-blob-drift"
          style={{
            width: b.size,
            height: b.size,
            background: b.color,
            filter: "blur(70px)",
            opacity: intensity,
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay ?? 0}s`,
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}

/* For static dark backgrounds — sprinkle blobs over caller's color */
export function BlobLayer({ blobs, intensity = 0.4 }: { blobs: Blob[]; intensity?: number }) {
  return (
    <>
      {blobs.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full pointer-events-none animate-blob-drift"
          style={{
            width: b.size,
            height: b.size,
            background: b.color,
            filter: "blur(70px)",
            opacity: intensity,
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay ?? 0}s`,
            mixBlendMode: "screen",
          }}
        />
      ))}
    </>
  );
}
