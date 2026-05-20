import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  answers: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).length(3),
});

const CardSchema = z.object({
  current_era: z.string(),
  energy_match: z.string(),
  brutal_truth: z.string(),
  aura_color_name: z.string(),
  aura_color_hex: z.string(),
  todays_warning: z.string(),
  todays_power_move: z.string(),
  emojis: z.array(z.string()).length(3),
});

export type EraCard = z.infer<typeof CardSchema>;

export const decodeEra = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<EraCard> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are EraOS, a brutally funny, Gen Z oracle. Based on these answers, decode the user's CURRENT ERA. Be specific, weird, dramatic, and unhinged-but-poetic. Avoid clichés. No emojis.

Answers:
${data.answers.map((a, i) => `${i + 1}. ${a.question}\n   -> ${a.answer}`).join("\n")}

Return a Daily Era Card with:
- current_era: 2-4 words, evocative (e.g. "Quiet Villain Arc", "Soft Launch Saboteur")
- energy_match: a hyper-specific funny comparison (e.g. "a Tuesday afternoon at a Whole Foods hot bar")
- brutal_truth: ONE sharp funny line
- aura_color_name: creative invented color name (e.g. "Bruised Peach")
- aura_color_hex: matching hex code starting with #
- todays_warning: short and dramatic, 1 sentence
- todays_power_move: short and empowering, 1 sentence`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_era_card",
            description: "Return the user's Era Card",
            parameters: {
              type: "object",
              properties: {
                current_era: { type: "string" },
                energy_match: { type: "string" },
                brutal_truth: { type: "string" },
                aura_color_name: { type: "string" },
                aura_color_hex: { type: "string" },
                todays_warning: { type: "string" },
                todays_power_move: { type: "string" },
              },
              required: ["current_era", "energy_match", "brutal_truth", "aura_color_name", "aura_color_hex", "todays_warning", "todays_power_move"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_era_card" } },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
      throw new Error(`AI gateway error (${res.status}): ${txt.slice(0, 200)}`);
    }

    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No card returned from AI");
    return CardSchema.parse(JSON.parse(args));
  });
