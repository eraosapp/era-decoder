import { useRef, useEffect, useState, type ReactNode, type CSSProperties } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import type { EraCard as EraCardType } from "@/lib/era.functions";
import { pickCharacter } from "./Characters";

const CHARACTER_EMOJI: Record<string, string> = {
  "The Menace": "😈", "The Ghost": "👻", "The Haunted": "👻",
  "The Villain": "🖤", "The Delulu": "🌸", "The Goblin": "👺",
  "The Romantic": "💘", "The Overthinker": "🌀", "The Chaotic": "⚡",
  "The Sage": "🔮", "The Gremlin": "👹", "The Unbothered": "😌",
  "The Main Character": "👑", "The Mystic": "🌙", "The Softlaunch": "🌷",
  "The Feral": "🔥",
};

// Solid vibrant slide background per character (matches grad-hero family)
const VIBE_BG: Record<string, string> = {
  "The Ghost":          "#1E63FF",
  "The Haunted":        "#1E63FF",
  "The Villain":        "#9D0208",
  "The Romantic":       "#FF6F61",
  "The Softlaunch":     "#FF8FA3",
  "The Delulu":         "#FF4FA3",
  "The Sage":           "#7209B7",
  "The Mystic":         "#5B2EFF",
  "The Overthinker":    "#3A86FF",
  "The Unbothered":     "#06D6A0",
  "The Main Character": "#FB5607",
  "The Chaotic":        "#FF006E",
  "The Menace":         "#FF006E",
  "The Gremlin":        "#7AB52C",
  "The Feral":          "#FF3D00",
  "The Goblin":         "#347818",
};
const DEFAULT_BG = "#FF006E";

// Second-slide poster background (different color than slide 1)
const CHARACTER_BG: Record<string, string> = {
  "The Ghost":          "#8338EC",
  "The Haunted":        "#8338EC",
  "The Villain":        "#3A0CA3",
  "The Romantic":       "#FFBE0B",
  "The Softlaunch":     "#FFD166",
  "The Delulu":         "#8338EC",
  "The Sage":           "#FF006E",
  "The Mystic":         "#FF006E",
  "The Overthinker":    "#FF006E",
  "The Unbothered":     "#118AB2",
  "The Main Character": "#FF006E",
  "The Chaotic":        "#FB5607",
  "The Menace":         "#FFBE0B",
  "The Gremlin":        "#1A4D2E",
  "The Feral":          "#FFBE0B",
  "The Goblin":         "#FFBE0B",
};

const ZODIAC_SYMBOLS: Record<string, string> = {
  aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋",
  leo: "♌", virgo: "♍", libra: "♎", scorpio: "♏",
  sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓",
};

function zodiacSymbol(profile: any): string {
  if (profile?.symbol) return profile.symbol;
  const z = (profile?.zodiac || "").toLowerCase().trim();
  return ZODIAC_SYMBOLS[z] || "✦";
}

function todayStr() {
  return new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

// pick readable text color for an arbitrary hex bg
function textOnHex(hex: string): "white" | "#0a0a0a" {
  const h = hex.replace("#", "");
  if (h.length < 6) return "white";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.65 ? "#0a0a0a" : "white";
}

export function EraCard({
  card, profile, onSave, onShare,
}: {
  card: EraCardType;
  profile?: { name?: string; zodiac?: string; symbol?: string } | null;
  onSave?: () => void;
  onShare?: () => void;
}) {
  const character = pickCharacter(card.character_type);
  const emoji = CHARACTER_EMOJI[character] ?? "✨";
  const vibeBg = VIBE_BG[character] ?? DEFAULT_BG;
  const charBg = CHARACTER_BG[character] ?? "#8338EC";
  const firstName = (profile?.name || "you").split(" ")[0];
  const zSym = zodiacSymbol(profile);
  const auraHex = card.aura_color_hex?.match(/^#[0-9a-fA-F]{6}$/) ? card.aura_color_hex : "#FF006E";
  const auraTextColor = textOnHex(auraHex);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, dragFree: false });
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const on = () => setIdx(embla.selectedScrollSnap());
    embla.on("select", on);
    on();
    return () => { embla.off("select", on); };
  }, [embla]);

  const saveSlide = async (i: number, name: string) => {
    const node = slideRefs.current[i];
    if (!node) return;
    try {
      toast.loading("Capturing your slide...", { id: "snap" });
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: undefined });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `eraos-${name}-${Date.now()}.png`;
      a.click();
      toast.success("Saved to downloads.", { id: "snap" });
    } catch (e) {
      toast.error("Couldn't save slide.", { id: "snap" });
    }
    onSave?.();
  };

  const saveAllAsStory = async () => {
    try {
      toast.loading("Building your story...", { id: "story" });
      for (let i = 0; i < 5; i++) {
        embla?.scrollTo(i);
        await new Promise((r) => setTimeout(r, 250));
        const node = slideRefs.current[i];
        if (!node) continue;
        const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `eraos-story-${i + 1}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 180));
      }
      toast.success("Story saved (5 slides).", { id: "story" });
    } catch {
      toast.error("Couldn't save story.", { id: "story" });
    }
  };

  const slides = [
    { key: "vibe",      label: "Save vibe",      node: <SlideVibe bg={vibeBg} word={card.vibe_word} /> },
    { key: "character", label: "Save poster",    node: <SlideCharacter bg={charBg} emoji={emoji} character={character} era={card.current_era} /> },
    { key: "truth",     label: "Save truth",     node: <SlideTruth truth={card.brutal_truth} name={firstName} /> },
    { key: "aura",      label: "Save aura",      node: <SlideAura hex={auraHex} name={card.aura_color_name} textColor={auraTextColor} /> },
    { key: "cosmic",    label: "Save all",       node: <SlideCosmic symbol={zSym} prediction={card.cosmic_prediction} /> },
  ];

  return (
    <div className="absolute inset-0 bg-black text-white">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;700;800;900&display=swap" />

      <div className="h-full w-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((s, i) => (
            <div key={s.key} className="relative min-w-0 shrink-0 grow-0 basis-full h-full">
              <div
                ref={(el) => { slideRefs.current[i] = el; }}
                className="absolute inset-0"
              >
                {s.node}
              </div>

              {/* Save button per slide */}
              <button
                onClick={() => (i === 4 ? saveAllAsStory() : saveSlide(i, s.key))}
                className="press absolute bottom-16 left-1/2 -translate-x-1/2 z-30 rounded-full bg-white text-black font-black text-[11px] tracking-[0.22em] uppercase px-5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.45)] border-2 border-black/10"
              >
                {i === 4 ? "💾 save all as story" : `💾 ${s.label}`}
              </button>

              {/* Share on last */}
              {i === 4 && onShare && (
                <button
                  onClick={onShare}
                  className="press absolute bottom-3 right-3 z-30 rounded-full bg-black/60 backdrop-blur border border-white/30 text-white text-[10px] tracking-[0.22em] uppercase px-3 py-2"
                >share</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Swipe hint (first slide only) */}
      {idx === 0 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 text-white/70 text-[10px] tracking-[0.4em] uppercase pointer-events-none animate-pulse">
          swipe →
        </div>
      )}

      {/* Dots nav */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => embla?.scrollTo(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === idx ? 24 : 8,
              background: i === idx ? "white" : "rgba(255,255,255,0.4)",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ============ SLIDE 1: VIBE ============ */
function SlideVibe({ bg, word }: { bg: string; word: string }) {
  return (
    <SlideShell bg={bg}>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <h1
          className="font-display text-white text-center uppercase leading-[0.82] -tracking-[0.05em] break-words drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
          style={{ fontSize: "clamp(4rem, 24vw, 9rem)", width: "100%" }}
        >
          {word}
        </h1>
      </div>
      <Watermark />
    </SlideShell>
  );
}

/* ============ SLIDE 2: CHARACTER ============ */
function SlideCharacter({ bg, emoji, character, era }: { bg: string; emoji: string; character: string; era: string }) {
  return (
    <SlideShell bg={bg}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-6">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 220, height: 220,
            background: "rgba(0,0,0,0.18)",
            border: "3px solid rgba(255,255,255,0.95)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 -10px 20px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ fontSize: 160, lineHeight: 1, filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.45))" }}>{emoji}</span>
        </div>
        <div className="text-center">
          <div className="font-display text-white uppercase leading-none -tracking-[0.03em] break-words"
               style={{ fontSize: "clamp(2.4rem, 10vw, 3.6rem)", maxWidth: "100%" }}>
            {character}
          </div>
          <div className="mt-4 text-white/90 font-black uppercase tracking-[0.4em] text-[11px] break-words max-w-full">
            {era}
          </div>
        </div>
      </div>
      <Watermark />
    </SlideShell>
  );
}

/* ============ SLIDE 3: BRUTAL TRUTH ============ */
function SlideTruth({ truth, name }: { truth: string; name: string }) {
  return (
    <SlideShell bg="#0A0A0F">
      {/* subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: "radial-gradient(ellipse at center, rgba(255,0,110,0.18), transparent 70%)" }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
        <p
          className="font-display text-white leading-[1.05] -tracking-[0.03em] break-words max-w-full"
          style={{ fontSize: "clamp(1.9rem, 7vw, 2.6rem)" }}
        >
          <span className="text-[#FF006E] font-display align-top mr-1" style={{ fontSize: "1.4em" }}>“</span>
          {truth}
          <span className="text-[#FF006E] font-display align-top ml-1" style={{ fontSize: "1.4em" }}>”</span>
        </p>
        <div className="mt-8 text-white/60 text-[11px] tracking-[0.45em] uppercase font-bold">
          — {name}
        </div>
      </div>
      <Watermark />
    </SlideShell>
  );
}

/* ============ SLIDE 4: AURA ============ */
function SlideAura({ hex, name, textColor }: { hex: string; name: string; textColor: string }) {
  return (
    <SlideShell bg={hex}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-3" style={{ color: textColor }}>
        <h2
          className="font-display uppercase text-center leading-[0.85] -tracking-[0.05em] break-words"
          style={{ fontSize: "clamp(3rem, 16vw, 5.5rem)", maxWidth: "100%" }}
        >
          {name}
        </h2>
        <div className="text-[11px] tracking-[0.4em] uppercase font-bold opacity-80">
          your color today
        </div>
        <div className="mt-3 text-[10px] tracking-[0.3em] uppercase opacity-70 font-mono">
          {hex.toUpperCase()}
        </div>
      </div>
      <Watermark color={textColor} />
    </SlideShell>
  );
}

/* ============ SLIDE 5: COSMIC ============ */
function SlideCosmic({ symbol, prediction }: { symbol: string; prediction: string }) {
  return (
    <SlideShell bg="linear-gradient(180deg,#06000F 0%,#1A0A3C 45%,#3A0CA3 100%)">
      {/* stars */}
      {Array.from({ length: 30 }).map((_, i) => {
        const top = (i * 37) % 100;
        const left = (i * 53) % 100;
        const size = (i % 3) + 2;
        return (
          <span key={i} className="absolute rounded-full pointer-events-none"
            style={{ top: `${top}%`, left: `${left}%`, width: size, height: size,
              background: "white", opacity: 0.5 + (i % 5) * 0.1,
              boxShadow: "0 0 6px rgba(255,255,255,0.8)" }} />
        );
      })}

      <div className="absolute inset-0 flex flex-col items-center justify-center px-7 gap-8 text-center">
        <div
          className="leading-none drop-shadow-[0_0_30px_rgba(167,139,250,0.8)]"
          style={{ fontSize: 140, color: "white" }}
        >
          {symbol}
        </div>
        <p
          className="font-display text-white leading-[1.15] -tracking-[0.02em] break-words w-full"
          style={{ fontSize: "clamp(1.4rem, 5.2vw, 1.9rem)", maxWidth: "24rem" }}
        >
          {prediction}
        </p>
      </div>

      <div className="absolute bottom-3 left-3 z-10 text-white/70 text-[9px] tracking-[0.4em] uppercase font-bold">
        era os
      </div>
      <div className="absolute bottom-3 right-3 z-10 text-white/70 text-[9px] tracking-[0.4em] uppercase font-mono">
        {todayStr()}
      </div>
    </SlideShell>
  );
}

/* ============ SHELL ============ */
function SlideShell({ bg, children }: { bg: string; children: ReactNode }) {
  const style: CSSProperties = bg.startsWith("linear-gradient") || bg.startsWith("radial-gradient")
    ? { background: bg }
    : { backgroundColor: bg };
  return (
    <div className="absolute inset-0 overflow-hidden" style={style}>
      {children}
    </div>
  );
}

function Watermark({ color = "rgba(255,255,255,0.7)" }: { color?: string }) {
  return (
    <div
      className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.5em] uppercase font-bold z-10"
      style={{ color }}
    >
      era os
    </div>
  );
}
