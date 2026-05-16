export type Question = {
  id: string;
  prompt: string;
  options: string[];
};

export const QUESTIONS: Question[] = [
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
];
