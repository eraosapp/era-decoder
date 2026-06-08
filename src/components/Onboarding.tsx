import { useMemo, useState } from "react";
import { detectLocation } from "@/lib/location";

const ZODIAC = [
  { sign: "Capricorn", symbol: "♑", from: [12, 22], to: [1, 19] },
  { sign: "Aquarius", symbol: "♒", from: [1, 20], to: [2, 18] },
  { sign: "Pisces", symbol: "♓", from: [2, 19], to: [3, 20] },
  { sign: "Aries", symbol: "♈", from: [3, 21], to: [4, 19] },
  { sign: "Taurus", symbol: "♉", from: [4, 20], to: [5, 20] },
  { sign: "Gemini", symbol: "♊", from: [5, 21], to: [6, 20] },
  { sign: "Cancer", symbol: "♋", from: [6, 21], to: [7, 22] },
  { sign: "Leo", symbol: "♌", from: [7, 23], to: [8, 22] },
  { sign: "Virgo", symbol: "♍", from: [8, 23], to: [9, 22] },
  { sign: "Libra", symbol: "♎", from: [9, 23], to: [10, 22] },
  { sign: "Scorpio", symbol: "♏", from: [10, 23], to: [11, 21] },
  { sign: "Sagittarius", symbol: "♐", from: [11, 22], to: [12, 21] },
] as const;

function getZodiac(dob: string) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  for (const z of ZODIAC) {
    const [fm, fd] = z.from;
    const [tm, td] = z.to;
    if (fm === tm) {
      if (m === fm && day >= fd && day <= td) return z;
    } else {
      if ((m === fm && day >= fd) || (m === tm && day <= td)) return z;
    }
  }
  return null;
}

export type LivingSituation = "home" | "hostel" | "alone" | "other";
export type OnboardingData = {
  name: string;
  dob: string;
  zodiac: string;
  symbol: string;
  living_situation: LivingSituation;
  city?: string | null;
};

const LIVING_OPTIONS: { id: LivingSituation; icon: string; label: string }[] = [
  { id: "home",   icon: "🏠", label: "Ghar pe (with family)" },
  { id: "hostel", icon: "🏢", label: "Hostel / College campus" },
  { id: "alone",  icon: "🏙️", label: "Alone / PG in a new city" },
  { id: "other",  icon: "✈️", label: "Somewhere else entirely" },
];

export function Onboarding({ onDone }: { onDone: (data: OnboardingData) => void }) {
  const [slide, setSlide] = useState(0);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [living, setLiving] = useState<LivingSituation | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [locationMode, setLocationMode] = useState<"explain" | "manual">("explain");
  const [manualCity, setManualCity] = useState("");
  const [locating, setLocating] = useState(false);
  const zodiac = useMemo(() => getZodiac(dob), [dob]);

  const TOTAL = 6;
  const next = () => setSlide((s) => s + 1);
  const finish = () => {
    onDone({
      name: name.trim() || "friend",
      dob,
      zodiac: zodiac?.sign ?? "",
      symbol: zodiac?.symbol ?? "✦",
      living_situation: living ?? "other",
      city: city || null,
    });
  };

  const handleAllowLocation = async () => {
    setLocating(true);
    try {
      const loc = await detectLocation();
      if (loc.city) {
        setCity(loc.city);
        next();
      } else {
        setLocationMode("manual");
      }
    } catch {
      setLocationMode("manual");
    } finally {
      setLocating(false);
    }
  };

  const handleSaveManualCity = () => {
    const trimmed = manualCity.trim();
    if (!trimmed) return;
    setCity(trimmed);
    next();
  };

  return (
    <div className="absolute inset-0 overflow-hidden text-white anim-fade-in-slow" style={{ background: "var(--grad-hero)" }}>
      <div className="blob float-slow" style={{ width: 320, height: 320, background: "#FF006E", top: -60, left: -80 }} />
      <div className="blob float-med" style={{ width: 280, height: 280, background: "#FFBE0B", bottom: -60, right: -60 }} />
      <div className="blob float-slow" style={{ width: 220, height: 220, background: "#8338EC", top: "40%", right: -40 }} />
      <div className="grain absolute inset-0 pointer-events-none" />

      {/* progress */}
      <div className="absolute top-0 left-0 right-0 flex gap-1.5 px-4 pt-4 z-30">
        {Array.from({ length: TOTAL }, (_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white transition-all duration-500" style={{ width: i <= slide ? "100%" : "0%" }} />
          </div>
        ))}
      </div>

      <div key={slide} className="relative h-full flex flex-col justify-between px-6 pt-16 pb-8 anim-question-in overflow-y-auto">
        {slide === 0 && (
          <>
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="font-display text-[3.2rem] leading-[0.98] -tracking-[0.03em] text-shadow-pop">
                <span className="text-white">era os knows you </span>
                <span className="text-[#FFBE0B]">better</span>
                <span className="text-white"> than you know yourself.</span>
              </h1>
              <p className="mt-6 text-lg font-bold text-white/90">Your daily personality decoder.</p>
            </div>
            <PinkButton onClick={next}>Let's Go</PinkButton>
          </>
        )}

        {slide === 1 && (
          <>
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="font-display text-[2.6rem] leading-[1.02] -tracking-[0.03em] mb-8">
                What do people call you?
              </h2>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="your name..."
                className="w-full rounded-2xl bg-white text-black placeholder-black/40 px-6 py-5 text-xl font-bold outline-none border-4 border-black focus:ring-4 focus:ring-[#FFBE0B]"
              />
            </div>
            <PinkButton onClick={next} disabled={!name.trim()}>Next</PinkButton>
          </>
        )}

        {slide === 2 && (
          <>
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="font-display text-[2.4rem] leading-[1.02] -tracking-[0.03em] mb-2">
                When did the chaos begin?
              </h2>
              <p className="text-sm text-white/80 mb-6 font-semibold">
                (your date of birth — for zodiac + age-based questions that actually make sense for your life)
              </p>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-2xl bg-white text-black px-6 py-5 text-xl font-bold outline-none border-4 border-black focus:ring-4 focus:ring-[#FFBE0B]"
              />
              {zodiac && (
                <div className="mt-6 text-center anim-fade-in-slow">
                  <div className="inline-block rounded-full bg-black/40 backdrop-blur-sm px-6 py-3 border border-white/20">
                    <span className="font-display text-2xl text-[#FFBE0B] drop-shadow-[0_0_18px_rgba(255,190,11,0.85)]">
                      {zodiac.symbol} {zodiac.sign} energy detected
                    </span>
                  </div>
                </div>
              )}
            </div>
            <PinkButton onClick={next} disabled={!zodiac}>Next</PinkButton>
          </>
        )}

        {slide === 3 && (
          <>
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="font-display text-[2.4rem] leading-[1.02] -tracking-[0.03em] mb-2">
                Where are you at right now?
              </h2>
              <p className="text-sm text-white/80 mb-6 font-semibold">(the place that's shaping your day)</p>
              <div className="grid gap-3">
                {LIVING_OPTIONS.map((o) => {
                  const sel = living === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setLiving(o.id)}
                      className={
                        "press text-left rounded-2xl px-5 py-4 font-bold leading-snug border-4 border-black transition-all duration-200 flex items-center gap-3 " +
                        (sel ? "bg-black text-white scale-[1.02] shadow-[0_0_0_4px_#FFBE0B]" : "bg-white text-black hover:bg-white/95")
                      }
                    >
                      <span className="text-2xl">{o.icon}</span>
                      <span>{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <PinkButton onClick={next} disabled={!living}>Next</PinkButton>
          </>
        )}

        {slide === 4 && (
          <>
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="text-6xl mb-5">📍</div>
              <h2 className="font-display text-[2.2rem] leading-[1.05] -tracking-[0.03em] mb-4">
                era os wants to know your city
              </h2>

              {locationMode === "explain" && (
                <>
                  <p className="text-[15px] font-semibold text-white/90 leading-relaxed max-w-[18rem] mb-8">
                    Toh teri questions actually teri life ke baare mein hon — kisi aur ki nahi.
                    Delhi mein kya chal raha hai, wahi puchenge.
                  </p>
                  <div className="w-full grid gap-3">
                    <PinkButton onClick={handleAllowLocation} disabled={locating}>
                      {locating ? "Locating..." : "Allow Location"}
                    </PinkButton>
                    <button
                      onClick={() => setLocationMode("manual")}
                      className="press w-full rounded-2xl py-5 font-bold text-white bg-white/10 border-4 border-black backdrop-blur-sm hover:bg-white/20 transition-colors"
                    >
                      Enter my city manually
                    </button>
                  </div>
                </>
              )}

              {locationMode === "manual" && (
                <>
                  <input
                    autoFocus
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    placeholder="e.g. Delhi, Mumbai, Bangalore..."
                    className="w-full rounded-2xl bg-white text-black placeholder-black/40 px-6 py-5 text-xl font-bold outline-none border-4 border-black focus:ring-4 focus:ring-[#FFBE0B] mb-6"
                  />
                  <PinkButton onClick={handleSaveManualCity} disabled={!manualCity.trim()}>
                    Save City
                  </PinkButton>
                </>
              )}
            </div>
          </>
        )}

        {slide === 5 && (
          <>
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <h2 className="font-display text-[2.4rem] leading-[1.02] -tracking-[0.03em]">
                Your daily decoder is ready,
                <span className="block text-[#FFBE0B]">{name.trim() || "friend"}.</span>
              </h2>
              <div className="my-8 font-display text-[8rem] leading-none text-white drop-shadow-[0_0_40px_rgba(255,190,11,0.7)]">
                {zodiac?.symbol ?? "✦"}
              </div>
              <p className="text-lg font-bold text-white/90">3 questions. 1 brutal truth. Every day.</p>
            </div>
            <PinkButton onClick={finish}>Decode My Era</PinkButton>
          </>
        )}
      </div>
    </div>
  );
}

function PinkButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="press w-full rounded-2xl py-6 font-display text-[1.6rem] uppercase tracking-wide text-white shadow-[0_0_30px_rgba(255,0,110,0.4),6px_6px_0_0_#000] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)", border: "4px solid black", borderBottomWidth: "8px", borderBottomColor: "#FFBE0B" }}
    >
      {children}
    </button>
  );
}
