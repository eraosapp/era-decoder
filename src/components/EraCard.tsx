import { useRef, useEffect, useState, type ReactNode, type CSSProperties } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import type { EraCard as EraCardType } from "@/lib/era.functions";
import { pickCharacter } from "./Characters";
import { FitText } from "./FitText";
import { BlobLayer } from "./AnimatedBg";

const CHARACTER_EMOJI: Record<string, string> = {
  "The Menace": "😈", "The Ghost": "👻", "The Haunted": "👻",
  "The Villain": "🖤", "The Delulu": "🌸", "The Goblin": "👺",
  "The Romantic": "💘", "The Overthinker": "🌀", "The Chaotic": "⚡",
  "The Sage": "🔮", "The Gremlin": "👹", "The Unbothered": "😌",
  "The Main Character": "👑", "The Mystic": "🌙", "The Softlaunch": "🌷",
  "The Feral": "🔥",
};

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

function textOnHex(hex: string): "white" | "#0a0a0a" {
  const h = hex.replace("#", "");
  if (h.length < 6) return "white";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.65 ? "#0a0a0a" : "white";
}

function complement(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#8338EC";
  const r = (255 - parseInt(h.slice(0, 2), 16)).toString(16).padStart(2, "0");
  const g = (255 - parseInt(h.slice(2, 4), 16)).toString(16).padStart(2, "0");
  const b = (255 - parseInt(h.slice(4, 6), 16)).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function EraCard({
  card, profile, onSave, onShare, onBattle,
}: {
  card: EraCardType;
  profile?: { name?: string; zodiac?: string; symbol?: string } | null;
  onSave?: () => void;
  onShare?: () => void;
  onBattle?: () => void;
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
    } catch {
      toast.error("Couldn't save slide.", { id: "snap" });
    }
    onSave?.();
  };

  const saveAllAsStory = async () => {
    try {
      toast.loading("Building your story...", { id: "story" });
      for (let i = 0; i < slides.length; i++) {
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
      toast.success(`Story saved (${slides.length} slides).`, { id: "story" });
    } catch {
      toast.error("Couldn't save story.", { id: "story" });
    }
  };

  const slides = [
    { key: "vibe",      label: "Save vibe",      node: <SlideVibe bg={vibeBg} word={card.vibe_word} /> },
    { key: "character", label: "Save poster",    node: <SlideCharacter bg={charBg} emoji={emoji} character={character} era={card.current_era} /> },
    { key: "truth",     label: "Save truth",     node: <SlideTruth truth={card.brutal_truth} name={firstName} /> },
    { key: "aura",      label: "Save aura",      node: <SlideAura hex={auraHex} name={card.aura_color_name} textColor={auraTextColor} /> },
    { key: "cosmic",    label: "Save cosmic",    node: <SlideCosmic symbol={zSym} prediction={card.cosmic_prediction} /> },
    { key: "song",      label: "Save song",      node: <SlideSong name={card.song_name} artist={card.song_artist} reason={card.song_reason} /> },
  ];

  const isLast = idx === slides.length - 1;

  return (
    <div className="absolute inset-0 bg-black text-white">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;700;800;900&display=swap" />

      <div className="h-full w-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((s, i) => (
            <div key={s.key} className="relative min-w-0 shrink-0 grow-0 basis-full h-full">
              <div ref={(el) => { slideRefs.current[i] = el; }} className="absolute inset-0">
                {s.node}
              </div>

              <button
                onClick={() => (i === slides.length - 1 ? saveAllAsStory() : saveSlide(i, s.key))}
                className="press absolute bottom-16 left-1/2 -translate-x-1/2 z-30 rounded-full bg-white text-black font-black text-[11px] tracking-[0.22em] uppercase px-5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.45)] border-2 border-black/10"
              >
                {i === slides.length - 1 ? "💾 save all as story" : `💾 ${s.label}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {idx === 0 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 text-white/70 text-[10px] tracking-[0.4em] uppercase pointer-events-none animate-pulse">
          swipe →
        </div>
      )}

      {/* Battle + Share on last slide */}
      {isLast && (
        <div className="absolute bottom-3 right-3 z-30 flex gap-2">
          {onBattle && (
            <button
              onClick={onBattle}
              className="press rounded-full bg-gradient-to-r from-[#FF006E] to-[#8338EC] border border-white/40 text-white text-[10px] tracking-[0.22em] uppercase px-3 py-2 font-black"
            >⚔️ battle a friend</button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="press rounded-full bg-black/60 backdrop-blur border border-white/30 text-white text-[10px] tracking-[0.22em] uppercase px-3 py-2"
            >share</button>
          )}
        </div>
      )}

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => embla?.scrollTo(i)}
            className="h-1.5 rounded-full transition-all"
            style={{ width: i === idx ? 24 : 8, background: i === idx ? "white" : "rgba(255,255,255,0.4)" }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ============ SHELL with animated blobs ============ */
function SlideShell({ bg, children, blobColors }: { bg: string; children: ReactNode; blobColors?: string[] }) {
  const style: CSSProperties = bg.startsWith("linear-gradient") || bg.startsWith("radial-gradient")
    ? { background: bg }
    : { backgroundColor: bg };
  const blobs = blobColors?.length
    ? [
        { color: blobColors[0], size: 320, top: "-12%", left: "-15%", dur: 20 },
        { color: blobColors[1] || blobColors[0], size: 260, bottom: "-10%", right: "-12%", dur: 26, delay: 3 },
      ]
    : [];
  return (
    <div className="absolute inset-0 overflow-hidden" style={style}>
      {blobs.length > 0 && <BlobLayer blobs={blobs} intensity={0.35} />}
      {children}
    </div>
  );
}

function Watermark({ color = "rgba(255,255,255,0.7)" }: { color?: string }) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.5em] uppercase font-bold z-10" style={{ color }}>
      era os
    </div>
  );
}

/* ============ SLIDE 1: VIBE ============ */
function SlideVibe({ bg, word }: { bg: string; word: string }) {
  return (
    <SlideShell bg={bg} blobColors={[complement(bg), "#FFBE0B"]}>
      <div className="absolute inset-0 flex items-center justify-center px-6 pt-16 pb-24">
        <div className="w-full h-full max-h-full">
          <FitText max={180} min={36} className="font-display uppercase text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]" lineHeight={0.85}>
            {word}
          </FitText>
        </div>
      </div>
      <Watermark />
    </SlideShell>
  );
}

/* ============ SLIDE 2: CHARACTER ============ */
function SlideCharacter({ bg, emoji, character, era }: { bg: string; emoji: string; character: string; era: string }) {
  return (
    <SlideShell bg={bg} blobColors={[complement(bg), "#FFBE0B"]}>
      <div className="absolute inset-0 flex flex-col items-center px-6 pt-12 pb-24 gap-5">
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: 200, height: 200,
            background: "rgba(0,0,0,0.18)",
            border: "3px solid rgba(255,255,255,0.95)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 -10px 20px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ fontSize: 140, lineHeight: 1, filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.45))" }}>{emoji}</span>
        </div>
        <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center gap-3">
          <div className="w-full h-[5rem]">
            <FitText max={64} min={22} className="font-display uppercase text-white" lineHeight={0.95}>
              {character}
            </FitText>
          </div>
          <div className="w-full h-[2.6rem]">
            <FitText max={18} min={10} className="text-white/90 font-black uppercase tracking-[0.4em]" lineHeight={1.15}>
              {era}
            </FitText>
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
      <BlobLayer
        intensity={0.4}
        blobs={[
          { color: "#FF006E", size: 320, top: "-12%", left: "-15%", dur: 22 },
          { color: "#8338EC", size: 260, bottom: "-10%", right: "-12%", dur: 26, delay: 3 },
        ]}
      />
      <div className="absolute inset-0 flex flex-col px-7 pt-16 pb-24 text-center">
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="w-full h-full">
            <FitText max={44} min={18} className="font-display text-white" lineHeight={1.1}>
              {`"${truth}"`}
            </FitText>
          </div>
        </div>
        <div className="text-white/60 text-[11px] tracking-[0.45em] uppercase font-bold mt-4">
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
    <SlideShell bg={hex} blobColors={[complement(hex), "#FFFFFF"]}>
      <div className="absolute inset-0 flex flex-col items-center px-6 pt-16 pb-24 gap-3" style={{ color: textColor }}>
        <div className="flex-1 w-full min-h-0 flex items-center justify-center">
          <FitText max={110} min={26} className="font-display uppercase" lineHeight={0.88}>
            {name}
          </FitText>
        </div>
        <div className="text-[11px] tracking-[0.4em] uppercase font-bold opacity-80">your color today</div>
        <div className="text-[10px] tracking-[0.3em] uppercase opacity-70 font-mono">{hex.toUpperCase()}</div>
      </div>
      <Watermark color={textColor} />
    </SlideShell>
  );
}

/* ============ SLIDE 5: COSMIC ============ */
function SlideCosmic({ symbol, prediction }: { symbol: string; prediction: string }) {
  return (
    <SlideShell bg="linear-gradient(180deg,#06000F 0%,#1A0A3C 45%,#3A0CA3 100%)">
      <BlobLayer
        intensity={0.35}
        blobs={[
          { color: "#5B2EFF", size: 280, top: "10%", left: "-12%", dur: 24 },
          { color: "#FF006E", size: 220, bottom: "8%", right: "-10%", dur: 28, delay: 3 },
        ]}
      />
      {Array.from({ length: 30 }).map((_, i) => {
        const top = (i * 37) % 100;
        const left = (i * 53) % 100;
        const size = (i % 3) + 2;
        return (
          <span key={i} className="absolute rounded-full pointer-events-none twinkle"
            style={{ top: `${top}%`, left: `${left}%`, width: size, height: size,
              background: "white", opacity: 0.5 + (i % 5) * 0.1,
              animationDelay: `${i * 0.1}s`,
              boxShadow: "0 0 6px rgba(255,255,255,0.8)" }} />
        );
      })}

      <div className="absolute inset-0 flex flex-col items-center px-7 pt-14 pb-24 gap-5 text-center">
        <div className="leading-none drop-shadow-[0_0_30px_rgba(167,139,250,0.8)] shrink-0"
             style={{ fontSize: 110, color: "white" }}>
          {symbol}
        </div>
        <div className="flex-1 w-full min-h-0 flex items-center justify-center">
          <FitText max={36} min={16} className="font-display text-white" lineHeight={1.2}>
            {prediction}
          </FitText>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-10 text-white/70 text-[9px] tracking-[0.4em] uppercase font-bold">era os</div>
      <div className="absolute bottom-3 right-3 z-10 text-white/70 text-[9px] tracking-[0.4em] uppercase font-mono">{todayStr()}</div>
    </SlideShell>
  );
}

/* ============ SLIDE 6: SONG ============ */
function SlideSong({ name, artist, reason }: { name: string; artist: string; reason: string }) {
  return (
    <SlideShell bg="linear-gradient(180deg,#0a0a0f 0%,#1a0028 50%,#2a0040 100%)">
      <BlobLayer
        intensity={0.35}
        blobs={[
          { color: "#FF006E", size: 280, top: "8%", left: "-12%", dur: 22 },
          { color: "#1DB954", size: 240, bottom: "20%", right: "-12%", dur: 26, delay: 2 },
        ]}
      />
      <div className="absolute inset-0 flex flex-col items-center px-6 pt-10 pb-32 text-center">
        <div className="text-7xl shrink-0" style={{ filter: "drop-shadow(0 8px 24px rgba(255,255,255,0.25))" }}>🎵</div>
        <div className="mt-3 text-[10px] tracking-[0.4em] uppercase text-white/70 font-bold shrink-0">your song today</div>

        <div className="flex-1 w-full min-h-0 mt-5 flex flex-col items-center justify-center gap-3">
          <div className="w-full h-[5rem]">
            <FitText max={56} min={20} className="font-display uppercase text-white" lineHeight={0.92}>
              {name}
            </FitText>
          </div>
          <div className="w-full h-[1.6rem]">
            <FitText max={20} min={10} className="text-white/80 font-bold tracking-wide" lineHeight={1.2}>
              {artist}
            </FitText>
          </div>
          <div className="w-full h-[3.5rem] mt-2 px-2">
            <FitText max={18} min={11} className="italic text-white/90" lineHeight={1.3}>
              {reason}
            </FitText>
          </div>
        </div>

        {/* music wave */}
        <div className="flex items-end gap-1 h-8 shrink-0 mt-2">
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="wave-bar w-[3px] bg-white/70 rounded-full"
              style={{ height: "100%", animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/60 mt-2 shrink-0">search on spotify →</div>
      </div>
      <Watermark />
    </SlideShell>
  );
}
