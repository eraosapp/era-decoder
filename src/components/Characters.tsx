import type { CSSProperties } from "react";

export const CHARACTER_NAMES = [
  "The Menace", "The Ghost", "The Delulu", "The Villain",
  "The Sage", "The Gremlin", "The Romantic", "The Chaotic",
  "The Unbothered", "The Overthinker", "The Main Character", "The Goblin",
  "The Mystic", "The Softlaunch", "The Haunted", "The Feral",
] as const;

export type CharacterName = typeof CHARACTER_NAMES[number];

type Spec = {
  face: string;       // face gradient
  cheek?: string;     // cheek blush color
  eyeStyle: "round" | "wink" | "x" | "spiral" | "star" | "line" | "heart" | "sleepy" | "dot" | "wide";
  mouth: "smile" | "smirk" | "frown" | "open" | "fang" | "kiss" | "tongue" | "flat" | "zigzag" | "ohh";
  accessory?: "horns" | "halo" | "crown" | "tear" | "hoodie" | "antenna" | "stars" | "leaf" | "sweat" | "sparkle";
  faceShape?: "round" | "blob" | "oval";
};

const SPECS: Record<CharacterName, Spec> = {
  "The Menace":       { face: "linear-gradient(135deg,#FF2D6F,#8B0033)", eyeStyle: "wink",   mouth: "smirk",  accessory: "horns" },
  "The Ghost":        { face: "linear-gradient(135deg,#E8F0FF,#A8B6D6)", eyeStyle: "dot",    mouth: "ohh",    faceShape: "blob" },
  "The Delulu":       { face: "linear-gradient(135deg,#FFD1E8,#FF7AB6)", eyeStyle: "heart",  mouth: "smile",  accessory: "sparkle", cheek: "#FF5C9C" },
  "The Villain":      { face: "linear-gradient(135deg,#3A2A5F,#0F0820)", eyeStyle: "x",      mouth: "fang",   accessory: "crown" },
  "The Sage":         { face: "linear-gradient(135deg,#B79EFF,#6A48C7)", eyeStyle: "sleepy", mouth: "flat",   accessory: "stars" },
  "The Gremlin":      { face: "linear-gradient(135deg,#9BE15D,#3F8E2C)", eyeStyle: "wide",   mouth: "fang",   accessory: "horns" },
  "The Romantic":     { face: "linear-gradient(135deg,#FF9BB3,#E0376B)", eyeStyle: "heart",  mouth: "kiss",   cheek: "#FF4D7E" },
  "The Chaotic":      { face: "linear-gradient(135deg,#FFC93C,#FF5722)", eyeStyle: "spiral", mouth: "zigzag", accessory: "sparkle" },
  "The Unbothered":   { face: "linear-gradient(135deg,#7FD9CC,#1A8A82)", eyeStyle: "line",   mouth: "flat" },
  "The Overthinker":  { face: "linear-gradient(135deg,#C3D7FF,#5C7AC9)", eyeStyle: "spiral", mouth: "zigzag", accessory: "sweat" },
  "The Main Character": { face: "linear-gradient(135deg,#FFE066,#FF8C00)", eyeStyle: "star",   mouth: "smile",  accessory: "crown", cheek: "#FF5C7E" },
  "The Goblin":       { face: "linear-gradient(135deg,#A8E063,#347818)", eyeStyle: "wide",   mouth: "tongue", accessory: "leaf" },
  "The Mystic":       { face: "linear-gradient(135deg,#5B2A86,#1A0A3C)", eyeStyle: "star",   mouth: "flat",   accessory: "stars" },
  "The Softlaunch":   { face: "linear-gradient(135deg,#FFDFE5,#FF99B3)", eyeStyle: "sleepy", mouth: "smile",  cheek: "#FF7AA0", accessory: "sparkle" },
  "The Haunted":      { face: "linear-gradient(135deg,#3F3F58,#0A0A1A)", eyeStyle: "dot",    mouth: "open",   accessory: "tear" },
  "The Feral":        { face: "linear-gradient(135deg,#FF5722,#7A1A00)", eyeStyle: "wide",   mouth: "fang",   accessory: "hoodie" },
};

export function pickCharacter(name?: string | null): CharacterName {
  if (!name) return "The Chaotic";
  const found = CHARACTER_NAMES.find((n) => n.toLowerCase() === name.toLowerCase().trim());
  return found ?? "The Chaotic";
}

export function CharacterAvatar({ name, size = 160 }: { name: CharacterName; size?: number }) {
  const spec = SPECS[name];
  const shape = spec.faceShape ?? "round";
  const radius = shape === "blob" ? "50% 50% 48% 52% / 52% 48% 50% 50%" : shape === "oval" ? "48% 52% 50% 50% / 55% 55% 45% 45%" : "50%";
  const eyeSize = size * 0.13;

  return (
    <div
      className="relative bob"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: spec.face,
        boxShadow: "0 18px 40px rgba(0,0,0,0.35), inset 0 -10px 18px rgba(0,0,0,0.18), inset 0 10px 18px rgba(255,255,255,0.18)",
        border: "3px solid rgba(255,255,255,0.95)",
      }}
    >
      {/* shine highlight */}
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          top: size * 0.1, left: size * 0.18,
          width: size * 0.22, height: size * 0.14,
          background: "rgba(255,255,255,0.55)",
          filter: "blur(4px)",
          transform: "rotate(-20deg)",
        }}
      />

      {/* cheeks */}
      {spec.cheek && (
        <>
          <span style={cheekStyle(size, "left", spec.cheek)} />
          <span style={cheekStyle(size, "right", spec.cheek)} />
        </>
      )}

      {/* eyes */}
      <Eyes style={spec.eyeStyle} size={eyeSize} faceSize={size} />

      {/* mouth */}
      <Mouth style={spec.mouth} faceSize={size} />

      {/* accessory */}
      {spec.accessory && <Accessory type={spec.accessory} size={size} />}
    </div>
  );
}

function cheekStyle(face: number, side: "left" | "right", color: string): CSSProperties {
  return {
    position: "absolute",
    top: face * 0.58,
    [side]: face * 0.1,
    width: face * 0.18,
    height: face * 0.1,
    background: color,
    borderRadius: "50%",
    opacity: 0.55,
    filter: "blur(3px)",
  } as CSSProperties;
}

function Eyes({ style, size, faceSize }: { style: Spec["eyeStyle"]; size: number; faceSize: number }) {
  const top = faceSize * 0.4;
  const positions: CSSProperties[] = [
    { position: "absolute", top, left: faceSize * 0.26 },
    { position: "absolute", top, right: faceSize * 0.26 },
  ];

  const render = (key: number, base: CSSProperties) => {
    const common: CSSProperties = { ...base, width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" };
    switch (style) {
      case "round":
      case "dot":
        return <span key={key} style={{ ...common, background: "#0a0a0a", borderRadius: "50%" }} />;
      case "wide":
        return (
          <span key={key} style={{ ...common, background: "white", borderRadius: "50%", border: "2px solid #0a0a0a" }}>
            <span style={{ width: size * 0.5, height: size * 0.5, background: "#0a0a0a", borderRadius: "50%" }} />
          </span>
        );
      case "wink":
        return key === 1
          ? <span key={key} style={{ ...common, background: "#0a0a0a", borderRadius: "50%" }} />
          : <span key={key} style={{ ...common, height: 3, background: "#0a0a0a", borderRadius: 4 }} />;
      case "x":
        return <span key={key} style={{ ...common, color: "#0a0a0a", fontSize: size * 1.1, fontWeight: 900, lineHeight: 1 }}>✕</span>;
      case "spiral":
        return <span key={key} style={{ ...common, color: "#0a0a0a", fontSize: size * 1.2, lineHeight: 1 }}>@</span>;
      case "star":
        return <span key={key} style={{ ...common, color: "#FFF59D", fontSize: size * 1.3, lineHeight: 1, filter: "drop-shadow(0 0 6px rgba(255,245,157,0.9))" }}>★</span>;
      case "line":
        return <span key={key} style={{ ...common, height: 3, background: "#0a0a0a", borderRadius: 4 }} />;
      case "heart":
        return <span key={key} style={{ ...common, color: "#FF2D6F", fontSize: size * 1.15, lineHeight: 1, filter: "drop-shadow(0 0 6px rgba(255,45,111,0.7))" }}>♥</span>;
      case "sleepy":
        return <span key={key} style={{ ...common, height: size * 0.5, borderTop: "3px solid #0a0a0a", borderRadius: "50%" }} />;
    }
  };

  return <>{positions.map((p, i) => render(i, p))}</>;
}

function Mouth({ style, faceSize }: { style: Spec["mouth"]; faceSize: number }) {
  const top = faceSize * 0.68;
  const left = faceSize * 0.5;
  const wrap: CSSProperties = { position: "absolute", top, left, transform: "translateX(-50%)" };
  switch (style) {
    case "smile":
      return <span style={{ ...wrap, width: faceSize * 0.36, height: faceSize * 0.18, borderBottom: "3px solid #0a0a0a", borderRadius: "0 0 60% 60%" }} />;
    case "smirk":
      return <span style={{ ...wrap, width: faceSize * 0.32, height: faceSize * 0.14, borderBottom: "3px solid #0a0a0a", borderRadius: "0 0 80% 20%", transform: "translateX(-50%) rotate(-8deg)" }} />;
    case "frown":
      return <span style={{ ...wrap, top: faceSize * 0.72, width: faceSize * 0.3, height: faceSize * 0.14, borderTop: "3px solid #0a0a0a", borderRadius: "60% 60% 0 0" }} />;
    case "open":
      return <span style={{ ...wrap, width: faceSize * 0.16, height: faceSize * 0.18, background: "#0a0a0a", borderRadius: "50%" }} />;
    case "fang":
      return (
        <span style={{ ...wrap, width: faceSize * 0.32, height: faceSize * 0.14, background: "#0a0a0a", borderRadius: "0 0 40% 40%" }}>
          <span style={{ position: "absolute", top: faceSize * 0.06, left: faceSize * 0.05, width: 0, height: 0, borderLeft: `${faceSize * 0.04}px solid transparent`, borderRight: `${faceSize * 0.04}px solid transparent`, borderTop: `${faceSize * 0.08}px solid white` }} />
          <span style={{ position: "absolute", top: faceSize * 0.06, right: faceSize * 0.05, width: 0, height: 0, borderLeft: `${faceSize * 0.04}px solid transparent`, borderRight: `${faceSize * 0.04}px solid transparent`, borderTop: `${faceSize * 0.08}px solid white` }} />
        </span>
      );
    case "kiss":
      return <span style={{ ...wrap, width: faceSize * 0.14, height: faceSize * 0.12, background: "#FF2D6F", borderRadius: "50% 50% 40% 40%", boxShadow: "0 0 10px rgba(255,45,111,0.7)" }} />;
    case "tongue":
      return (
        <span style={{ ...wrap, width: faceSize * 0.3, height: faceSize * 0.14, borderBottom: "3px solid #0a0a0a", borderRadius: "0 0 60% 60%" }}>
          <span style={{ position: "absolute", bottom: -faceSize * 0.06, left: "50%", transform: "translateX(-50%)", width: faceSize * 0.12, height: faceSize * 0.1, background: "#FF7AB6", borderRadius: "0 0 50% 50%" }} />
        </span>
      );
    case "flat":
      return <span style={{ ...wrap, width: faceSize * 0.24, height: 3, background: "#0a0a0a", borderRadius: 4 }} />;
    case "zigzag":
      return (
        <svg style={{ ...wrap, width: faceSize * 0.32, height: faceSize * 0.1 }} viewBox="0 0 40 12" fill="none">
          <path d="M2 6 L8 2 L14 10 L20 2 L26 10 L32 2 L38 6" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ohh":
      return <span style={{ ...wrap, width: faceSize * 0.14, height: faceSize * 0.2, background: "#0a0a0a", borderRadius: "50%" }} />;
  }
}

function Accessory({ type, size }: { type: NonNullable<Spec["accessory"]>; size: number }) {
  switch (type) {
    case "horns":
      return (
        <>
          <span style={{ position: "absolute", top: -size * 0.16, left: size * 0.15, width: 0, height: 0, borderLeft: `${size * 0.07}px solid transparent`, borderRight: `${size * 0.07}px solid transparent`, borderBottom: `${size * 0.22}px solid #FF1744`, transform: "rotate(-18deg)", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} />
          <span style={{ position: "absolute", top: -size * 0.16, right: size * 0.15, width: 0, height: 0, borderLeft: `${size * 0.07}px solid transparent`, borderRight: `${size * 0.07}px solid transparent`, borderBottom: `${size * 0.22}px solid #FF1744`, transform: "rotate(18deg)", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} />
        </>
      );
    case "halo":
      return <span style={{ position: "absolute", top: -size * 0.12, left: "50%", transform: "translateX(-50%)", width: size * 0.7, height: size * 0.18, borderRadius: "50%", border: "3px solid #FFE066", boxShadow: "0 0 18px rgba(255,224,102,0.9)" }} />;
    case "crown":
      return (
        <svg style={{ position: "absolute", top: -size * 0.18, left: "50%", transform: "translateX(-50%)", width: size * 0.6, height: size * 0.22, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }} viewBox="0 0 60 22" fill="#FFD700">
          <path d="M2 20 L8 4 L20 14 L30 2 L40 14 L52 4 L58 20 Z" stroke="#0a0a0a" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "tear":
      return <span style={{ position: "absolute", top: size * 0.52, left: size * 0.22, width: size * 0.08, height: size * 0.16, background: "linear-gradient(180deg,#7BC8FF,#1E88E5)", borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%", boxShadow: "0 0 8px rgba(123,200,255,0.8)" }} />;
    case "hoodie":
      return <span style={{ position: "absolute", top: -size * 0.08, left: -size * 0.1, width: size * 1.2, height: size * 0.6, background: "rgba(0,0,0,0.7)", borderRadius: "50% 50% 0 0 / 70% 70% 0 0", zIndex: -1 }} />;
    case "antenna":
      return (
        <>
          <span style={{ position: "absolute", top: -size * 0.18, left: "50%", transform: "translateX(-50%)", width: 2, height: size * 0.18, background: "#0a0a0a" }} />
          <span style={{ position: "absolute", top: -size * 0.22, left: "50%", transform: "translateX(-50%)", width: size * 0.08, height: size * 0.08, background: "#FFBE0B", borderRadius: "50%", boxShadow: "0 0 12px rgba(255,190,11,0.9)" }} />
        </>
      );
    case "stars":
      return (
        <>
          <span style={{ position: "absolute", top: -size * 0.05, right: -size * 0.05, fontSize: size * 0.16, filter: "drop-shadow(0 0 6px white)" }}>✦</span>
          <span style={{ position: "absolute", top: size * 0.15, left: -size * 0.08, fontSize: size * 0.12, filter: "drop-shadow(0 0 6px white)" }}>✦</span>
          <span style={{ position: "absolute", bottom: -size * 0.04, right: size * 0.1, fontSize: size * 0.14, filter: "drop-shadow(0 0 6px white)" }}>✦</span>
        </>
      );
    case "leaf":
      return <span style={{ position: "absolute", top: -size * 0.1, left: size * 0.1, fontSize: size * 0.22, transform: "rotate(-30deg)" }}>🍃</span>;
    case "sweat":
      return <span style={{ position: "absolute", top: size * 0.32, right: size * 0.08, width: size * 0.08, height: size * 0.14, background: "linear-gradient(180deg,#7BC8FF,#1E88E5)", borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%", boxShadow: "0 0 6px rgba(123,200,255,0.7)" }} />;
    case "sparkle":
      return (
        <>
          <span style={{ position: "absolute", top: size * 0.05, right: -size * 0.02, fontSize: size * 0.16, color: "#FFF59D", filter: "drop-shadow(0 0 8px #FFF59D)" }}>✦</span>
          <span style={{ position: "absolute", bottom: size * 0.1, left: -size * 0.04, fontSize: size * 0.14, color: "#FFB6E1", filter: "drop-shadow(0 0 8px #FFB6E1)" }}>✦</span>
        </>
      );
  }
}
