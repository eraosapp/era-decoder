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

// ---------- helpers for AI question generation ----------

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function moonPhase(): string {
  // synodic month calc anchored at known new moon 2000-01-06 18:14 UTC
  const synodic = 29.53058867;
  const anchor = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
  const today = Date.now() / 86400000;
  const phase = (((today - anchor) % synodic) + synodic) % synodic;
  if (phase < 1.84) return "new moon";
  if (phase < 5.53) return "waxing crescent";
  if (phase < 9.22) return "first quarter";
  if (phase < 12.91) return "waxing gibbous";
  if (phase < 16.61) return "full moon";
  if (phase < 20.30) return "waning gibbous";
  if (phase < 23.99) return "last quarter";
  return "waning crescent";
}

async function fetchTrending(city?: string | null): Promise<string[]> {
  if (!city) return [];
  try {
    const q = encodeURIComponent(`${city} events this week`);
    const url = `https://news.google.com/rss/search?q=${q}&hl=en&gl=IN&ceid=IN:en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const titles: string[] = [];
    const re = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) && titles.length < 6) {
      const t = (m[1] || m[2] || "").trim();
      if (t && !t.toLowerCase().startsWith("google news")) titles.push(t);
    }
    return titles.slice(0, 5);
  } catch {
    return [];
  }
}

const QGenSchema = z.object({
  questions: z.array(z.object({
    question_text: z.string().min(4).max(220),
    options: z.array(z.string().min(1).max(140)).length(4),
  })).length(3),
});

const QInputSchema = z.object({
  city: z.string().max(80).optional(),
  country: z.string().max(8).optional(),
}).optional();

/**
 * Generate 3 hyper-personalised questions using Gemini, based on:
 * - user age (from DOB), region, zodiac
 * - city + trending events this week
 * - current date, day of week, moon phase
 */
export const getDailyQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => QInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ questions: QuestionDTO[]; cycleReset: boolean; region: "GLOBAL" | "IN" }> => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { data: profile } = await supabase
      .from("profiles").select("region, dob, zodiac, name").eq("id", userId).maybeSingle();
    const region = (profile?.region as "GLOBAL" | "IN") || "GLOBAL";
    const age = ageFromDob(profile?.dob);
    const city = data?.city?.trim() || null;
    const country = data?.country?.trim() || (region === "IN" ? "IN" : null);

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = now.toISOString().slice(0, 10);
    const moon = moonPhase();
    const trending = await fetchTrending(city);

    const isIndia = region === "IN";
    let ageBucket = "general adult";
    if (age != null) {
      if (age <= 18) ageBucket = "16-18 (school: exams, curfew, first crush, parents)";
      else if (age <= 21) ageBucket = "18-21 (college, hostel life, heartbreak, placements)";
      else if (age <= 24) ageBucket = "21-24 (first job, quarter-life crisis, salary vs passion)";
      else if (age <= 27) ageBucket = isIndia
        ? "24-27 India (marriage pressure, log kya kahenge, career vs family, settle down talk, money anxiety, comparison with cousins)"
        : "24-27 (career grind, relationship questions, comparison)";
      else if (age <= 32) ageBucket = "27-32 (therapy talk, career pivot, 'where did time go', friends drifting)";
      else ageBucket = `${age} (life check-ins, what matters now)`;
    }

    const langLine = isIndia
      ? `LANGUAGE: Natural Delhi/North-India Hinglish — code-switch mid-sentence the way people actually talk. Sprinkle "yaar", "bhai", "matlab", "scene", "literally", "bas", "chal" organically. Never translate; code-switch. Options must be embarrassingly specific and feel like a roast from their best friend.`
      : `LANGUAGE: English, Gen Z tone — sharp, dry, terminally online. Options should be embarrassingly specific.`;

    const trendingLine = trending.length
      ? `Trending in ${city} this week:\n${trending.map((t) => `- ${t}`).join("\n")}`
      : "";

    const prompt = `You are EraOS — generate 3 hyper-personalised daily questions for this user.

USER CONTEXT:
- Name: ${profile?.name || "friend"}
- Age bucket: ${ageBucket}
- Region: ${region}${country ? ` (${country})` : ""}
- City: ${city || "unknown"}
- Zodiac: ${profile?.zodiac || "unknown"}
- Date: ${dateStr} (${dayOfWeek})
- Moon phase: ${moon}
${trendingLine}

${langLine}

RULES:
- Exactly 3 questions, each with exactly 4 options.
- At least ONE question must reference something REAL happening in ${city || "their city"} this week or the current day/moon/weekend energy. Not generic "how are you feeling".
- Questions feel like the user's best friend texting them — casual, specific, knowing.
- Options must be embarrassingly accurate — the kind of thing they'd react to with "stop reading my mind".
- NO multiple choice that's morally loaded or judgemental. NO "self-help" tone.
- Match the age-bucket themes above. Don't ask a 27-year-old about exams or an 18-year-old about marriage.
- Keep questions under 18 words. Options under 14 words.
- No emojis inside questions or options.
- Return ONLY via the tool call.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_questions",
            description: "Return 3 daily questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: "object",
                    properties: {
                      question_text: { type: "string" },
                      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    },
                    required: ["question_text", "options"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_questions" } },
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
    if (!args) throw new Error("No questions returned from AI");
    const parsed = QGenSchema.parse(JSON.parse(args));

    const questions: QuestionDTO[] = parsed.questions.map((q) => ({
      id: crypto.randomUUID(),
      question_text: q.question_text,
      options: q.options,
    }));

    return { questions, cycleReset: false, region };
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
      ? `\n\nLANGUAGE — DELHI/NORTH INDIA HINGLISH:
Write brutal_truth and cosmic_prediction in natural Delhi Hinglish — code-switch mid-sentence the way people actually talk. Sprinkle "yaar", "bhai", "matlab", "seedha bol", "sach mein", "chal", "bas", "scene", "literally" organically. Never translate — code-switch. For cosmic_prediction, weave in desi life context when it fits (chai, late-night Zomato, family WhatsApp, "log kya kahenge", metro, situationship, 2AM overthinking). Other fields stay English.`
      : `\n\nLANGUAGE: English with Gen Z tone — sharp, dry, terminally online. No boomer phrasing.`;

    const prompt = `You are EraOS — the user's most honest friend, the one who catches them in their own lie with love. You decode their CURRENT ERA from 3 answers. Every output should make them put their phone down for a second before screenshotting.
${nameLine}${zodiacLine}${langInstruction}

THEIR ANSWERS TODAY:
${data.answers.map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`).join("\n")}

OUTPUT RULES — LESS IS MORE. Every word earns its place. No emojis inside text fields. No hashtags. No "the universe wants you to" clichés.

- vibe_word: ONE word. Uppercase. Punchy.
- current_era: 3-4 words MAX. Evocative, weirdly specific, never generic.
- energy_match: ONE hyper-specific funny comparison (e.g. "a voice note you recorded but never sent").
- brutal_truth: EXACTLY ONE sentence. MUST reference something SPECIFIC from their actual answers above — quote a detail, name the situation they described. It must be the thing they haven't admitted to themselves yet. Tone: best friend catching them in a lie, with love. NEVER generic advice.
   BAD: "You overthink things and need to relax."
   GOOD: "You've rewritten that one text 6 times and still haven't sent it because you already know what they'll say back."
- aura_color_name: 2-3 words, invented, creative (e.g. "Burnt Cassette Pink", "3AM Static Blue"). Never just "Hot Pink".
- aura_color_hex: matching hex starting with #
- todays_warning: 1 punchy line. Specific. Funny-dark.
- todays_power_move: 1 line. Specific action, not vague affirmation.
- emojis: exactly 3 emoji characters that match the vibe.
- character_type: pick EXACTLY ONE from: ${CHARACTERS.join(", ")}
- cosmic_prediction: MAX 2 short lines. Reference their ${profile?.zodiac || "zodiac"} sign energy by name. Specific enough to feel written for TODAY, mysterious enough to feel cosmic.${isIndia ? " Weave in desi life context naturally." : ""} NOT a paragraph. NOT a horoscope cliché.`;

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
