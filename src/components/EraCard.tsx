import type { EraCard as EraCardType } from "@/lib/era.functions";

export function EraCard({ card }: { card: EraCardType }) {
  return (
    <div
      className="iridescent-border rounded-[28px] w-full overflow-hidden fade-in relative"
      style={{ aspectRatio: "9 / 16" }}
    >
      <div className="shimmer absolute inset-0 rounded-[28px] pointer-events-none" />
      <div className="relative h-full w-full p-6 flex flex-col">
        <div className="flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          <span>EraOS</span>
          <span>Daily Card</span>
        </div>

        <div className="mt-5 fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            Current Era
          </div>
          <h2 className="font-display text-[2.6rem] leading-[1.05] gold-text">
            {card.current_era}
          </h2>
        </div>

        <div className="mt-6 space-y-5 flex-1">
          <Field
            label="Energy Match"
            value={card.energy_match}
            delay="0.15s"
          />
          <Field
            label="Brutal Truth"
            value={card.brutal_truth}
            delay="0.25s"
            serif
          />

          <div className="fade-up" style={{ animationDelay: "0.35s" }}>
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
              Aura Color
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full border border-border shadow-inner"
                style={{
                  backgroundColor: card.aura_color_hex,
                  boxShadow: `0 0 24px ${card.aura_color_hex}55, inset 0 0 12px rgba(255,255,255,0.15)`,
                }}
              />
              <div>
                <div className="text-foreground font-medium leading-tight">
                  {card.aura_color_name}
                </div>
                <div className="text-[11px] text-muted-foreground tracking-wider uppercase">
                  {card.aura_color_hex}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-5 pt-5 border-t border-border/50">
          <Field
            label="Today's Warning"
            value={card.todays_warning}
            delay="0.45s"
            compact
          />
          <Field
            label="Power Move"
            value={card.todays_power_move}
            delay="0.55s"
            compact
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-[9px] tracking-[0.3em] uppercase text-muted-foreground/70">
          <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          <span>—</span>
          <span>Decoded</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  delay,
  serif,
  compact,
}: {
  label: string;
  value: string;
  delay: string;
  serif?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="fade-up" style={{ animationDelay: delay }}>
      <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5">
        {label}
      </div>
      <div
        className={
          serif
            ? "font-display text-xl leading-snug text-foreground"
            : compact
              ? "text-sm leading-snug text-foreground/90"
              : "text-[15px] leading-snug text-foreground/90"
        }
      >
        {value}
      </div>
    </div>
  );
}
