import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Auto-shrink text to fit its parent box. Pure DOM measurement,
 * binary-search for speed. Recomputes on resize and content change.
 */
export function FitText({
  children,
  max = 160,
  min = 18,
  className = "",
  style,
  lineHeight = 0.9,
  as: As = "div",
}: {
  children: ReactNode;
  max?: number;
  min?: number;
  className?: string;
  style?: CSSProperties;
  lineHeight?: number;
  as?: any;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    const w = wrap.current;
    const el = inner.current;
    if (!w || !el) return;

    const fit = () => {
      let lo = min;
      let hi = max;
      let best = min;
      // binary search font size
      for (let i = 0; i < 12 && lo <= hi; i++) {
        const mid = Math.floor((lo + hi) / 2);
        el.style.fontSize = mid + "px";
        const fits = el.scrollWidth <= w.clientWidth && el.scrollHeight <= w.clientHeight;
        if (fits) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
      }
      el.style.fontSize = best + "px";
      setSize(best);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(w);
    return () => ro.disconnect();
  }, [children, max, min]);

  return (
    <div ref={wrap} className={"w-full h-full flex items-center justify-center " + className} style={style}>
      <As
        ref={inner as any}
        style={{ fontSize: size, lineHeight, whiteSpace: "pre-wrap", textWrap: "balance" as any, textAlign: "center", width: "100%" }}
      >
        {children}
      </As>
    </div>
  );
}
