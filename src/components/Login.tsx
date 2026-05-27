import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useState } from "react";

export function Login() {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Sign-in failed");
        setLoading(false);
        return;
      }
      if (result.redirected) return; // browser will navigate away
      // tokens received — auth state listener will pick it up
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden text-white" style={{ background: "var(--grad-hero)" }}>
      <div className="blob float-slow" style={{ width: 320, height: 320, background: "#FF006E", top: -60, left: -80 }} />
      <div className="blob float-med" style={{ width: 280, height: 280, background: "#FFBE0B", bottom: -60, right: -60 }} />
      <div className="blob float-slow" style={{ width: 220, height: 220, background: "#8338EC", top: "40%", right: -40 }} />
      <div className="grain absolute inset-0 pointer-events-none" />

      <div className="relative h-full flex flex-col px-6 pt-6 pb-8">
        <div className="flex items-center gap-2.5">
          <span className="inline-block w-4 h-4 rounded-full bg-[#FFBE0B] shadow-[0_0_18px_6px_rgba(255,190,11,0.55)] animate-pulse" />
          <span className="text-lg font-bold tracking-tight lowercase text-white">era os</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="font-display text-[3.6rem] leading-[0.95] -tracking-[0.03em] text-shadow-pop">
            <span className="block text-white">YOUR DAILY</span>
            <span className="block text-[#FFBE0B]">DECODER</span>
            <span className="block text-white">AWAITS.</span>
          </h1>
          <p className="mt-5 text-base font-bold text-white/90">Sign in to save your era. No spam, no algorithm.</p>
        </div>

        <button
          onClick={signIn}
          disabled={loading}
          className="press w-full rounded-2xl py-6 font-display text-[1.4rem] uppercase tracking-wide text-black bg-white border-4 border-black shadow-[6px_6px_0_0_#000] disabled:opacity-60 flex items-center justify-center gap-3"
        >
          <GoogleG /> {loading ? "Opening Google..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 7 29.3 5 24 5 16 5 9 9.6 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43c5.2 0 9.8-2 13.3-5.2l-6.1-5c-2 1.4-4.5 2.2-7.2 2.2-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9 39.4 16 43 24 43z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.8l6.1 5C40 35.4 44 30.1 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
