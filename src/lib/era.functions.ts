import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CHARACTERS = [
  "The Menace", "The Ghost", "The Delulu", "The Villain",
  "The Sage", "The Gremlin", "The Romantic", "The Chaotic",
  "The Unbothered", "The Overthinker", "The Main Character", "The Goblin",
  "The Mystic", "The Softlaunch", "The Haunted", "The Feral",
] as const;

const CardSchema = z.object({
  current_era: z.string(),
  energy_match: z.string(),
  brutal_truth: z.string(),
  aura_color_name: z.string(),
  aura_color_hex: z.string(),
  todays_warning: z.string(),
  todays_power_move: z.string(),
  emojis: z.array(z.string()).length(3),
  character_type: z.enum(CHARACTERS),
  vibe_word: z.string(),
  cosmic_prediction: z.string(),
});

export type EraCard = z.infer<typeof CardSchema>;

export type QuestionDTO = {
  id: string;
  question_text: string;
  options: string[];
};

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fetch 3 random unseen questions for the user's region.
 * If all questions are exhausted, reset the seen list and return fresh 3.
 */
export const getDailyQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ questions: QuestionDTO[]; cycleReset: boolean; region: "GLOBAL" | "IN" }> => {
    const { supabase, userId } = context;

    // get region from profile
    const { data: profile } = await supabase.from("profiles").select("region").eq("id", userId).maybeSingle();
    const region = (profile?.region as "GLOBAL" | "IN") || "GLOBAL";

    const { data: allQs, error: qErr } = await supabase
      .from("questions").select("id, question_text, options").eq("region", region);
    if (qErr) throw new Error(qErr.message);
    if (!allQs || allQs.length === 0) throw new Error("No questions configured for region " + region);

    const { data: seen } = await supabase
      .from("user_questions_seen").select("question_id").eq("user_id", userId);
    const seenIds = new Set((seen || []).map((s) => s.question_id));

    let unseen = allQs.filter((q) => !seenIds.has(q.id));
    let cycleReset = false;

    if (unseen.length < 3) {
      // reset
      await supabase.from("user_questions_seen").delete().eq("user_id", userId);
      unseen = allQs;
      cycleReset = true;
    }

    // shuffle & take 3
    const picked = [...unseen].sort(() => Math.random() - 0.5).slice(0, 3);
    return { questions: picked as QuestionDTO[], cycleReset, region };
  });

/**
 * Get today's existing decode if any.
 */
export const getTodayDecode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ card: EraCard | null; regenerations_used: number; is_premium: boolean }> => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("is_premium").eq("id", userId).maybeSingle();
    const { data } = await supabase
      .from("daily_decodes").select("card, regenerations_used")
      .eq("user_id", userId).eq("decode_date", todayUTC()).maybeSingle();
    return {
      card: (data?.card as EraCard) ?? null,
      regenerations_used: data?.regenerations_used ?? 0,
      is_premium: !!profile?.is_premium,
    };
  });

const SubmitSchema = z.object({
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    question: z.string(),
    answer: z.string(),
  })).length(3),
  force: z.boolean().optional(), // premium regenerate
});

/**
 * Submit answers, mark seen, generate (or regenerate) today's card.
 */
export const submitDailyAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ card: EraCard; regenerations_used: number }> => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const today = todayUTC();
    const { data: profile } = await supabase
      .from("profiles").select("name, zodiac, is_premium, region").eq("id", userId).maybeSingle();

    const { data: existing } = await supabase
      .from("daily_decodes").select("id, card, regenerations_used")
      .eq("user_id", userId).eq("decode_date", today).maybeSingle();

    if (existing) {
      if (!data.force) {
        return { card: existing.card as EraCard, regenerations_used: existing.regenerations_used };
      }
      if (!profile?.is_premium) throw new Error("DAILY_LIMIT");
      if (existing.regenerations_used >= 1) throw new Error("REGEN_LIMIT");
    }

    const seenRows = data.answers.map((a) => ({ user_id: userId, question_id: a.question_id }));
    await supabase.from("user_questions_seen").upsert(seenRows, { onConflict: "user_id,question_id" });

    const zodiacLine = profile?.zodiac ? `\nZodiac sign: ${profile.zodiac}` : "";
    const nameLine = profile?.name ? `\nName: ${profile.name}` : "";
    const isIndia = profile?.region === "IN";
    const langInstruction = isIndia
      ? `\n\nLANGUAGE: User is from India (Delhi/North India). Write brutal_truth and cosmic_prediction in NATURAL Delhi Hinglish — code-switch mid-sentence like real people actually talk. Sprinkle "yaar", "bhai", "matlab", "seedha bol", "sach mein", "chal", "bas", "scene" organically. Mix Hindi (Roman script) into English naturally — DO NOT translate, just code-switch. Punchy, never forced. Other fields stay English.`
      : "";

    const prompt = `You are EraOS, a brutally funny, Gen Z oracle. Decode the user's CURRENT ERA. Be specific, weird, dramatic, unhinged-but-poetic. Avoid clichés. No emojis in text fields.
${nameLine}${zodiacLine}${langInstruction}

Answers:
${data.answers.map((a, i) => `${i + 1}. ${a.question}\n   -> ${a.answer}`).join("\n")}

Return a Daily Era Card with:
- current_era: 2-4 words, evocative
- energy_match: hyper-specific funny comparison
- brutal_truth: ONE sharp funny line${isIndia ? " in Delhi Hinglish" : ""}
- aura_color_name: invented color name (1-3 words)
- aura_color_hex: matching hex starting with #
- todays_warning: 1 dramatic sentence
- todays_power_move: 1 empowering sentence
- emojis: exactly 3 emoji characters
- character_type: pick EXACTLY ONE from: ${CHARACTERS.join(", ")}
- vibe_word: ONE punchy uppercase word
- cosmic_prediction: MAX 2 short sentences. Sharp, specific, punchy${isIndia ? ", in Delhi Hinglish" : ""}. NOT a paragraph.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
                emojis: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
                character_type: { type: "string", enum: CHARACTERS as unknown as string[] },
                vibe_word: { type: "string" },
                cosmic_prediction: { type: "string" },
              },
              required: ["current_era", "energy_match", "brutal_truth", "aura_color_name", "aura_color_hex", "todays_warning", "todays_power_move", "emojis", "character_type", "vibe_word", "cosmic_prediction"],
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
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI error (${res.status}): ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No card returned from AI");
    const card = CardSchema.parse(JSON.parse(args));

    if (existing) {
      const newCount = existing.regenerations_used + 1;
      await supabase.from("daily_decodes").update({ card, regenerations_used: newCount }).eq("id", existing.id);
      return { card, regenerations_used: newCount };
    } else {
      await supabase.from("daily_decodes").insert({ user_id: userId, decode_date: today, card, regenerations_used: 0 });
      return { card, regenerations_used: 0 };
    }
  });

/**
 * Update profile after onboarding.
 */
const ProfileSchema = z.object({
  name: z.string().min(1).max(80),
  dob: z.string().min(4).max(20),
  zodiac: z.string().max(40),
  symbol: z.string().max(8),
  region: z.enum(["GLOBAL", "IN"]),
});

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").upsert({
      id: userId, name: data.name, dob: data.dob, zodiac: data.zodiac, symbol: data.symbol, region: data.region,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return data;
  });
