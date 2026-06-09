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
  song_name: z.string(),
  song_artist: z.string(),
  song_reason: z.string(),
});

export type EraCard = z.infer<typeof CardSchema>;

export type QuestionDTO = {
  id: string;
  question_text: string;
  subtitle: string;
  options: string[];
};


function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function ageBucketFor(age: number | null): string {
  if (age == null) return "general adult";
  if (age <= 18) return "16-18";
  if (age <= 21) return "18-21";
  if (age <= 24) return "21-24";
  if (age <= 27) return "24-27";
  if (age <= 32) return "27-32";
  return `${age}`;
}

function moonPhase(): string {
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

function regionalLangLine(region: string, city?: string | null): string {
  const isIndia = region === "IN";
  if (!isIndia) return `LANGUAGE: English with Gen Z tone — sharp, dry, terminally online.`;
  const c = (city || "").toLowerCase();
  if (c.includes("mumbai") || c.includes("bombay") || c.includes("pune")) {
    return `LANGUAGE: Mumbai vibe Hinglish — code-switch naturally, "boss", "tu", "scene kya hai", "bhidu" energy. Never translate, code-switch mid-sentence.`;
  }
  if (c.includes("bangalore") || c.includes("bengaluru") || c.includes("chennai") || c.includes("hyderabad") || c.includes("kochi")) {
    return `LANGUAGE: South India Hinglish — chill, English-leaning with natural Hindi/Tamil/Telugu words ("macha", "da", "anna", "scene", "literally"). Reference local cultural cues (filter coffee, IT park, traffic) when they fit. Never translate, code-switch.`;
  }
  return `LANGUAGE: Natural Delhi/North-India Hinglish — code-switch mid-sentence the way people actually talk. Sprinkle "yaar", "bhai", "matlab", "sach mein", "seedha bol", "scene", "literally", "bas", "chal" organically. Never translate; code-switch.`;
}

const QGenSchema = z.object({
  questions: z.array(z.object({
    question_text: z.string().min(4).max(220),
    subtitle: z.string().min(2).max(180),
    options: z.array(z.string().min(1).max(140)).length(4),
  })).length(3),
});


const QInputSchema = z.object({
  city: z.string().max(80).optional(),
  country: z.string().max(8).optional(),
}).optional();

export const getDailyQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => QInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ questions: QuestionDTO[]; cycleReset: boolean; region: "GLOBAL" | "IN" }> => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { data: profile } = await supabase
      .from("profiles").select("region, dob, zodiac, name, living_situation").eq("id", userId).maybeSingle();
    const region = (profile?.region as "GLOBAL" | "IN") || "GLOBAL";
    const age = ageFromDob(profile?.dob);
    const city = data?.city?.trim() || null;
    const country = data?.country?.trim() || (region === "IN" ? "IN" : null);
    const living = (profile?.living_situation as string | null) || null;

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = now.toISOString().slice(0, 10);
    const moon = moonPhase();
    const trending = await fetchTrending(city);

    const isIndia = region === "IN";
    let ageThemes = "general life check-ins";
    if (age != null) {
      if (age <= 18) ageThemes = "exams, curfew, first crush, parents, friend groups";
      else if (age <= 21) ageThemes = "college, hostel, heartbreak, placements, hometown vs city";
      else if (age <= 24) ageThemes = "first job, quarter-life crisis, salary vs passion, hostel-to-PG";
      else if (age <= 27) ageThemes = isIndia
        ? "marriage pressure, log kya kahenge, career vs family, settle down talk, money anxiety, cousin comparison"
        : "career grind, relationship doubt, friend drift, comparison spirals";
      else if (age <= 32) ageThemes = "therapy talk, career pivot, 'where did time go', friends drifting, family expectations";
      else ageThemes = "life check-ins, what matters now, late-life pivots";
    }

    let livingLine = "";
    if (living === "home") livingLine = "LIVING SITUATION: At home with family. Questions can touch on family dynamics, parents in the next room, ghar wali politics, log kya kahenge. NEVER ask about hostel life, roommates, mess food, or 'alone in a new city' loneliness.";
    else if (living === "hostel") livingLine = "LIVING SITUATION: Hostel / college campus. Roommates, mess, warden, late-night chai, campus crushes are fair game. NEVER ask about family at home, ghar pe pressure, or 'alone in a new city' isolation.";
    else if (living === "alone") livingLine = "LIVING SITUATION: Alone / PG in a new city. Independence, loneliness, missing home, cooking for one, swiggy at 2am, city isolation are fair game. NEVER assume family or roommates are present.";
    else if (living === "other") livingLine = "LIVING SITUATION: Unconventional setup. Keep questions universal — don't assume family, hostel, or solo city life.";

    const langLine = regionalLangLine(region, city);
    const trendingLine = trending.length
      ? `Trending in ${city} this week:\n${trending.map((t) => `- ${t}`).join("\n")}`
      : "";

    const prompt = `You are EraOS — generate 3 hyper-personalised daily questions for this user.

USER CONTEXT:
- Name: ${profile?.name || "friend"}
- Age: ${age ?? "unknown"} (themes: ${ageThemes})
- Region: ${region}${country ? ` (${country})` : ""}
- City: ${city || "unknown"}
- Zodiac: ${profile?.zodiac || "unknown"}
- Date: ${dateStr} (${dayOfWeek})
- Moon phase: ${moon}
${trendingLine}

${livingLine}

${langLine}

RULES:
- Exactly 3 questions, each with exactly 4 options AND a subtitle.
- SUBTITLE: one short clarifying line in plain words, written like a knowing friend whispering the real meaning. Lowercase, casual, often in parentheses-style. Max 14 words. Mix Hinglish if Indian.
  - GOOD: "(basically — what's living rent free in your head rn)"
  - GOOD: "(the thing you keep doing even though you know you shouldn't)"
  - GOOD: "(yaar sach mein — koi bhi judgement nahi)"
  - BAD: "Pick the option that best describes you" (too formal, too generic)
- At least ONE question must reference something REAL happening in ${city || "their city"} this week or the current day/moon/weekend energy.
- Questions feel like the user's best friend texting them — casual, specific, knowing.
- Options must be embarrassingly accurate — "stop reading my mind" energy.
- Match the age themes AND living situation above. Never ask about situations the user isn't in.
- Keep questions under 18 words. Options under 14 words. Subtitle under 14 words.
- No emojis inside questions, subtitles, or options.
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
                  minItems: 3, maxItems: 3,
                  items: {
                    type: "object",
                    properties: {
                      question_text: { type: "string" },
                      subtitle: { type: "string" },
                      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    },
                    required: ["question_text", "subtitle", "options"],
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
      subtitle: q.subtitle,
      options: q.options,
    }));


    return { questions, cycleReset: false, region };
  });

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
  force: z.boolean().optional(),
  city: z.string().max(80).optional(),
});

async function generateCard(opts: {
  apiKey: string;
  name?: string | null;
  zodiac?: string | null;
  region: string;
  city?: string | null;
  answers: { question: string; answer: string }[];
}): Promise<EraCard> {
  const { apiKey, name, zodiac, region, city, answers } = opts;
  const isIndia = region === "IN";
  const langLine = regionalLangLine(region, city);

  const prompt = `You are the unapologetic mirror of era os.
Your job: make the user feel SEEN in a way that is slightly uncomfortable.
Like their most perceptive friend just caught them in their performance — with love.
${name ? `Name: ${name}\n` : ""}${zodiac ? `Zodiac: ${zodiac}\n` : ""}${city ? `City: ${city}\n` : ""}
${langLine}

THEIR ANSWERS TODAY:
${answers.map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`).join("\n")}

BRUTAL TRUTH — non-negotiable:
- EXACTLY ONE sentence. Never more.
- Reference something SPECIFIC from their actual answers above.
- Say what they have not admitted to themselves yet.
- BAD: "You overthink and need to relax."
- GOOD: "You have been replaying one specific conversation from 4 days ago and have written 6 different versions of what you should have said."

LESS IS MORE — every word earns its place. No hashtags. No "the universe wants you to" clichés. No emojis inside text fields.

- vibe_word: ONE word. Uppercase. Punchy.
- current_era: 3-4 words MAX. Evocative, weirdly specific.
- energy_match: ONE hyper-specific comparison.
- aura_color_name: 2-3 invented words ("Burnt Cassette Pink", "3AM Static Blue"). Never just "Hot Pink".
- aura_color_hex: matching #hex.
- todays_warning: 1 punchy line.
- todays_power_move: 1 specific actionable line.
- emojis: exactly 3 emoji characters that match the vibe.
- character_type: pick EXACTLY ONE from: ${CHARACTERS.join(", ")}
- cosmic_prediction: MAX 2 short lines. Reference their ${zodiac || "zodiac"} sign by name.${isIndia ? " Weave in desi life context (chai, family WhatsApp, situationship, metro, log kya kahenge) when it fits." : ""}
- song_name: pick ONE real song that matches this era + their zodiac + age + mood. ${isIndia ? "For Delhi/North-India: Hindi or Punjabi songs that match the vibe (Arijit/AP Dhillon/Karan Aujla/Prateek Kuhad/Anuv Jain energy depending on era). Use real song titles." : "English songs. Use real titles."} For haunted/sad: melancholic. Villain: power anthems. Soft/romantic: indie/lo-fi. Chaotic: hype.
- song_artist: the artist of that song.
- song_reason: ONE specific line — why THIS song for THEIR era today. Reference a lyric or vibe detail, not generic.

Every output should make the user put their phone down for a second before screenshotting.`;

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
              song_name: { type: "string" },
              song_artist: { type: "string" },
              song_reason: { type: "string" },
            },
            required: ["current_era", "energy_match", "brutal_truth", "aura_color_name", "aura_color_hex", "todays_warning", "todays_power_move", "emojis", "character_type", "vibe_word", "cosmic_prediction", "song_name", "song_artist", "song_reason"],
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
  return CardSchema.parse(JSON.parse(args));
}

export const submitDailyAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ card: EraCard; regenerations_used: number }> => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const today = todayUTC();
    const { data: profile } = await supabase
      .from("profiles").select("name, zodiac, dob, is_premium, region").eq("id", userId).maybeSingle();

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

    const card = await generateCard({
      apiKey,
      name: profile?.name,
      zodiac: profile?.zodiac,
      region: profile?.region || "GLOBAL",
      city: data.city || null,
      answers: data.answers,
    });

    if (existing) {
      const newCount = existing.regenerations_used + 1;
      await supabase.from("daily_decodes").update({ card, regenerations_used: newCount }).eq("id", existing.id);
    } else {
      await supabase.from("daily_decodes").insert({ user_id: userId, decode_date: today, card, regenerations_used: 0 });
    }

    // Also persist into era_cards archive (idempotent per user/date)
    const age = ageFromDob(profile?.dob);
    await supabase.from("era_cards").upsert({
      user_id: userId,
      decode_date: today,
      vibe_word: card.vibe_word,
      era_name: card.current_era,
      brutal_truth: card.brutal_truth,
      aura_color_name: card.aura_color_name,
      aura_color_hex: card.aura_color_hex,
      warning: card.todays_warning,
      power_move: card.todays_power_move,
      cosmic_prediction: card.cosmic_prediction,
      song_name: card.song_name,
      song_artist: card.song_artist,
      song_reason: card.song_reason,
      city: data.city || null,
      age_group: ageBucketFor(age),
      zodiac: profile?.zodiac || null,
    }, { onConflict: "user_id,decode_date" } as any).then(() => {}, () => {});

    return { card, regenerations_used: existing ? existing.regenerations_used + 1 : 0 };
  });

const ProfileSchema = z.object({
  name: z.string().min(1).max(80),
  dob: z.string().min(4).max(20),
  zodiac: z.string().max(40),
  symbol: z.string().max(8),
  region: z.enum(["GLOBAL", "IN"]),
  living_situation: z.enum(["home", "hostel", "alone", "other"]).optional(),
  gender: z.enum(["female", "male", "nonbinary", "prefer_not"]).optional(),
  city: z.string().max(80).optional(),
});

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").upsert({
      id: userId, name: data.name, dob: data.dob, zodiac: data.zodiac, symbol: data.symbol, region: data.region,
      ...(data.living_situation ? { living_situation: data.living_situation } : {}),
      ...(data.gender ? { gender: data.gender } : {}),
      ...(data.city ? { city: data.city } : {}),
    } as any);
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

/* ============ STATS ============ */
export const getUsageStats = createServerFn({ method: "POST" })
  .handler(async (): Promise<{ today: number; total: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = todayUTC();
    const [{ count: todayCount }, { count: total }] = await Promise.all([
      supabaseAdmin.from("era_cards").select("*", { count: "exact", head: true }).eq("decode_date", today),
      supabaseAdmin.from("era_cards").select("*", { count: "exact", head: true }),
    ]);
    return { today: todayCount ?? 0, total: total ?? 0 };
  });

/* ============ STREAK ============ */
export const getStreak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ streak: number; broken: boolean }> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("daily_decodes")
      .select("decode_date")
      .eq("user_id", userId)
      .order("decode_date", { ascending: false })
      .limit(60);
    if (!data || data.length === 0) return { streak: 0, broken: false };

    const dates = data.map((d) => d.decode_date as string);
    const today = todayUTC();
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let streak = 0;
    let cursor: string;
    if (dates[0] === today) { streak = 1; cursor = today; }
    else if (dates[0] === yest) { streak = 1; cursor = yest; }
    else return { streak: 0, broken: true };

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(cursor + "T00:00:00Z");
      prev.setUTCDate(prev.getUTCDate() - 1);
      const expected = prev.toISOString().slice(0, 10);
      if (dates[i] === expected) { streak++; cursor = expected; }
      else break;
    }
    return { streak, broken: dates[0] !== today && dates[0] !== yest };
  });

/* ============ YESTERDAY FOR FEEDBACK ============ */
export const getYesterdayForFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ id: string; warning: string; era_name: string; brutal_truth: string } | null> => {
    const { supabase, userId } = context;
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const { data } = await supabase
      .from("era_cards")
      .select("id, warning, era_name, brutal_truth, accuracy_rating")
      .eq("user_id", userId)
      .eq("decode_date", yest)
      .maybeSingle();
    if (!data || data.accuracy_rating != null) return null;
    return { id: data.id, warning: data.warning || "", era_name: data.era_name || "", brutal_truth: data.brutal_truth || "" };
  });

/* ============ SUBMIT FEEDBACK ============ */
const FeedbackSchema = z.object({
  era_card_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
});
export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FeedbackSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: card } = await supabase.from("era_cards").select("*").eq("id", data.era_card_id).eq("user_id", userId).maybeSingle();
    if (!card) throw new Error("Card not found");
    await supabase.from("era_cards").update({ accuracy_rating: data.rating }).eq("id", data.era_card_id);
    await supabase.from("feedback").insert({
      user_id: userId,
      era_name: card.era_name,
      brutal_truth: card.brutal_truth,
      accuracy_rating: data.rating,
      city: card.city,
      zodiac: card.zodiac,
    });
    return { ok: true };
  });

/* ============ BATTLE ============ */
function randToken() {
  const a = new Uint8Array(9);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}

export const createBattle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ token: string }> => {
    const { supabase, userId } = context;
    const today = todayUTC();
    const [{ data: profile }, { data: decode }] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", userId).maybeSingle(),
      supabase.from("daily_decodes").select("card").eq("user_id", userId).eq("decode_date", today).maybeSingle(),
    ]);
    if (!decode?.card) throw new Error("Decode your era first.");

    // Reuse the 3 question texts the creator answered today (seen this session)
    // Fallback: 3 simple battle questions if we don't have stored ones
    const battleQs = [
      { id: crypto.randomUUID(), question_text: "What's your energy today, brutally honest?", options: ["feral", "soft launch", "main character", "ghosting everyone"] },
      { id: crypto.randomUUID(), question_text: "Last text you reread 5 times", options: ["a crush", "your group chat", "your ex", "your boss"] },
      { id: crypto.randomUUID(), question_text: "Real plan for tonight", options: ["overthink in bed", "go out and regret it", "delete an app", "send risky text"] },
    ];

    const token = randToken();
    const { error } = await supabase.from("battles").insert({
      share_token: token,
      creator_user_id: userId,
      creator_name: profile?.name || "Player 1",
      creator_card: decode.card,
      questions: battleQs,
    });
    if (error) throw new Error(error.message);
    return { token };
  });

const TokenSchema = z.object({ token: z.string().min(4).max(64) });

export const getBattle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: battle } = await supabaseAdmin
      .from("battles")
      .select("share_token, creator_name, creator_card, questions, opponent_name, opponent_card, verdict")
      .eq("share_token", data.token)
      .maybeSingle();
    if (!battle) throw new Error("Battle not found");
    return battle;
  });

const PlayBattleSchema = z.object({
  token: z.string().min(4).max(64),
  name: z.string().min(1).max(40),
  zodiac: z.string().max(40).optional(),
  answers: z.array(z.object({
    question_id: z.string(),
    question: z.string(),
    answer: z.string(),
  })).length(3),
});

export const playBattle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlayBattleSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: battle } = await supabaseAdmin
      .from("battles").select("*").eq("share_token", data.token).maybeSingle();
    if (!battle) throw new Error("Battle not found");
    if (battle.opponent_card) throw new Error("Battle already played");

    const opponentCard = await generateCard({
      apiKey,
      name: data.name,
      zodiac: data.zodiac || null,
      region: "GLOBAL",
      city: null,
      answers: data.answers,
    });

    // Verdict
    const verdictPrompt = `Two friends just decoded their eras. Pick a winner today — funny, specific, savage but loving. MAX 2 lines.

PLAYER 1 (${battle.creator_name}):
- Era: ${(battle.creator_card as any).current_era}
- Vibe: ${(battle.creator_card as any).vibe_word}
- Brutal truth: ${(battle.creator_card as any).brutal_truth}

PLAYER 2 (${data.name}):
- Era: ${opponentCard.current_era}
- Vibe: ${opponentCard.vibe_word}
- Brutal truth: ${opponentCard.brutal_truth}

Return JSON: { "winner": "${battle.creator_name}" or "${data.name}", "verdict": "max 2 short lines, savage but loving" }`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: verdictPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_verdict",
            parameters: {
              type: "object",
              properties: {
                winner: { type: "string" },
                verdict: { type: "string" },
              },
              required: ["winner", "verdict"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_verdict" } },
      }),
    });
    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const verdictParsed = args ? JSON.parse(args) : { winner: data.name, verdict: "Both eras hit. Tie today." };
    const verdictText = `${verdictParsed.winner} wins today. ${verdictParsed.verdict}`;

    await supabaseAdmin.from("battles").update({
      opponent_name: data.name,
      opponent_zodiac: data.zodiac || null,
      opponent_card: opponentCard,
      verdict: verdictText,
    }).eq("share_token", data.token);

    return { opponent_card: opponentCard, verdict: verdictText, creator_card: battle.creator_card, creator_name: battle.creator_name };
  });
