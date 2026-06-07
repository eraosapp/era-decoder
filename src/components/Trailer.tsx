import { useEffect, useState } from "react";
import { AnimatedBg } from "./AnimatedBg";

const LINES = [
  { icon: "🌍", text: "questions based on your world" },
  { icon: "🪞", text: "a mirror that doesn't lie" },
  { icon: "⚡", text: "your era. every single day." },
];

export function Trailer({ onContinue }: { onContinue: () => void }) {
  // Reveal sequence: 0 = "be honest." only
  //                  1 = + "era os already knows."
  //                  2,3,4 = + each bullet
  //                  5 = + button
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timings = [600, 1300, 2000, 2600, 3200, 3800];
    const ids = timings.map((t, i) => window.setTimeout(() => setStage(i + 1), t));
    const auto = window.setTimeout(onContinue, 5500);
    return () => { ids.forEach(clearTimeout); clearTimeout(auto); };
  }, [onContinue]);

  return (
    <div className="absolute inset-0 overflow-hidden text-white anim-fade-in-slow">
      <AnimatedBg preset="hero" />
      <div className="grain absolute inset-0 pointer-events-none" />

      <button
        onClick={onContinue}
        aria-label="Skip"
        className="absolute inset-0 z-10"
      />

      <div className="relative h-full flex flex-col justify-between px-6 pt-14 pb-8 z-20 pointer-events-none">
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <h1
            className={
              "font-display uppercase leading-[0.95] -tracking-[0.03em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] transition-all duration-700 " +
              (stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
            }
            style={{ fontSize: "clamp(3rem, 14vw, 6rem)" }}
          >
            be honest.
          </h1>

          <h2
            className={
              "mt-3 font-display uppercase leading-[0.95] -tracking-[0.03em] text-[#FFBE0B] drop-shadow-[0_0_22px_rgba(255,190,11,0.55)] transition-all duration-700 " +
              (stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
            }
            style={{ fontSize: "clamp(2.2rem, 9vw, 4rem)" }}
          >
            era os already knows.
          </h2>

          <div className="mt-10 w-full max-w-[20rem] space-y-3">
            {LINES.map((l, i) => (
              <div
                key={i}
                className={
                  "flex items-center gap-3 rounded-2xl bg-black/40 backdrop-blur px-4 py-3 border border-white/15 transition-all duration-500 " +
                  (stage >= 3 + i ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4")
                }
              >
                <span className="text-2xl">{l.icon}</span>
                <span className="text-[15px] font-bold text-white">{l.text}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onContinue}
          className={
            "press pointer-events-auto w-full rounded-2xl py-6 font-display text-[1.7rem] uppercase tracking-wide text-white shadow-[0_0_30px_rgba(255,0,110,0.4),6px_6px_0_0_#000] transition-all duration-500 " +
            (stage >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
          }
          style={{
            background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
            border: "4px solid black",
            borderBottomWidth: "8px",
            borderBottomColor: "#FFBE0B",
          }}
        >
          I'm Ready
        </button>
      </div>
    </div>
  );
}
