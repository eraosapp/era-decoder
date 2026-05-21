export type Question = {
  id: string;
  prompt: string;
  options: string[];
};

export type Region = "IN" | "GLOBAL";

export const QUESTION_SETS: Record<Region, Question[]> = {
  GLOBAL: [
    {
      id: "q1",
      prompt: "Pick the unhinged ritual that feels most like you right now.",
      options: [
        "Replying to texts at 3am like a war general",
        "Romanticizing oat milk in a sad mug",
        "Plotting revenge through silent excellence",
        "Buying things I cannot afford to feel something",
      ],
    },
    {
      id: "q2",
      prompt: "What's secretly running your operating system this week?",
      options: [
        "One unread voicemail I refuse to open",
        "A playlist that's emotionally illegal",
        "Pure delusion and a green juice",
        "Spite. Just spite, beautifully wrapped.",
      ],
    },
    {
      id: "q3",
      prompt: "If your aura had a vibe-check this morning, it would say:",
      options: [
        "Hot, unbothered, slightly cursed",
        "Soft, scheming, dangerously online",
        "Tired but the lighting is cinematic",
        "Healing, but make it theatrical",
      ],
    },
  ],
  IN: [
    {
      id: "q1",
      prompt: "Sach bata — what's your current main character moment?",
      options: [
        "3am chai aur overthinking, full Delhi winter energy",
        "Ignoring family WhatsApp group like a CEO",
        "Jugaad-ing my entire personality together",
        "Soft launching a situationship I haven't confirmed",
      ],
    },
    {
      id: "q2",
      prompt: "What's secretly running your OS this hafta?",
      options: [
        "Shaadi season anxiety and ek unread rishta",
        "Mumbai local energy — chaos but make it cute",
        "Bangalore traffic patience with Goa weekend dreams",
        "Pure log kya kahenge, beautifully ignored",
      ],
    },
    {
      id: "q3",
      prompt: "Aaj subah your aura did a vibe-check and said:",
      options: [
        "Hot, unbothered, thoda cursed",
        "Soft, scheming, dangerously online on Insta",
        "Thaki hui but lighting is straight up Karan Johar",
        "Healing, but make it a Bollywood montage",
      ],
    },
  ],
};

// Backward compat default export
export const QUESTIONS: Question[] = QUESTION_SETS.GLOBAL;
