import { v4 as uuid } from "uuid";
import type { FocusData, FocusTask, Habit, RewardItem } from "@/state/types";
import { getCurrentWeekMeta } from "@/utils/date";

const baseTask = (overrides: Partial<FocusTask>): FocusTask => {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title: "", 
    weekday: 0,
    hour: 8,
    durationMinutes: 60,
    difficulty: "moderate",
    category: "deep_work",
    coinReward: 20,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
};

const defaultTasks: FocusTask[] = [
  baseTask({
    title: "05:00 Wake & Align",
    description: "Yengil meditatsiya va ertalabki reja.",
    weekday: 0,
    hour: 5,
    difficulty: "light",
    category: "health",
    coinReward: 10,
    color: "#38bdf8",
    icon: "sun"
  }),
  baseTask({
    title: "08:00 Deep Work Sprint",
    description: "Eng muhim proyekt ustida 90 daqiqa.",
    weekday: 0,
    hour: 8,
    durationMinutes: 90,
    difficulty: "deep",
    category: "deep_work",
    coinReward: 40,
    color: "#647eff",
    icon: "rocket"
  }),
  baseTask({
    title: "14:00 Learning Hour",
    description: "Onlayn kurs yoki kitobdan bitta bob.",
    weekday: 2,
    hour: 14,
    difficulty: "moderate",
    category: "learning",
    coinReward: 20,
    color: "#a855f7",
    icon: "book-open"
  }),
  baseTask({
    title: "18:30 Strength & Cardio",
    description: "Sport zalida mashg'ulot yoki yugurish.",
    weekday: 4,
    hour: 18,
    durationMinutes: 75,
    difficulty: "boss",
    category: "health",
    coinReward: 40,
    color: "#10b981",
    icon: "dumbbell"
  }),
  baseTask({
    title: "21:30 Digital Sunset",
    description: "Ekransiz 30 daqiqa, kundalik yozish.",
    weekday: 6,
    hour: 21,
    difficulty: "light",
    category: "rest",
    coinReward: 10,
    color: "#f97316",
    icon: "moon"
  })
];

const defaultHabits: Habit[] = [
  {
    id: uuid(),
    title: "Shakar yo'q kunim",
    description: "Kun davomida shakarli taomlardan saqlanish.",
    icon: "donut",
    color: "#f472b6",
    rewardPerCheck: 20,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuid(),
    title: "Erta uyg'onish (5:30)",
    icon: "alarm",
    color: "#60a5fa",
    rewardPerCheck: 15,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const defaultRewards: RewardItem[] = [
  {
    id: uuid(),
    title: "Steam o'yini",
    cost: 200,
    description: "Yangi o'yin bilan dam oling.",
    createdAt: new Date().toISOString()
  },
  {
    id: uuid(),
    title: "SPA / Masaj kuni",
    cost: 120,
    description: "To'liq reset va bo'shashish.",
    createdAt: new Date().toISOString()
  },
  {
    id: uuid(),
    title: "Premium kitob",
    cost: 80,
    description: "Bilimga kichik sarmoya.",
    createdAt: new Date().toISOString()
  },
  {
    id: uuid(),
    title: "Gadget upgrade",
    cost: 320,
    description: "Kerakli texno aksessuar.",
    createdAt: new Date().toISOString()
  }
];

export const createDefaultState = (): FocusData => {
  const now = new Date().toISOString();
  return {
    weeklyPlan: defaultTasks,
    dailyLogs: {},
    habits: defaultHabits,
    habitLogs: [],
    coinBank: 120,
    coinLedger: [
      {
        id: uuid(),
        type: "bonus",
        label: "Focus Flowga xush kelibsiz",
        amount: 120,
        date: now
      }
    ],
    rewards: defaultRewards,
    weekMeta: getCurrentWeekMeta(),
    quickNotes: ["Ma'lumot: 3 marta jadvalni o'zgartirish limit"],
    focusStatements: ["Bugun qiladigan eng katta vazifa — Deep Work Sprint"],
    priorities: [
      { id: uuid(), title: "SaaS MVP 0.3 relizi", dueDate: undefined },
      { id: uuid(), title: "Shakar detoks challenge", dueDate: undefined }
    ],
    notificationsEnabled: true,
    widgetPinned: true,
    lastHydratedAt: now
  };
};
