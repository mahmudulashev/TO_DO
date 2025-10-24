export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type TaskDifficulty = "light" | "moderate" | "deep" | "boss";

export interface FocusTask {
  id: string;
  title: string;
  description?: string;
  weekday: Weekday; // 0 = Monday
  hour: number;
  minute?: number;
  durationMinutes: number;
  difficulty: TaskDifficulty;
  category: "deep_work" | "shallow" | "health" | "learning" | "admin" | "rest";
  coinReward: number;
  color?: string;
  icon?: string;
  notes?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "pending" | "completed" | "skipped" | "in_progress";

export interface TaskLog {
  taskId: string;
  status: TaskStatus;
  startedAt?: string;
  completedAt?: string;
  note?: string;
  overrideTitle?: string;
  overrideCoinReward?: number;
  penaltyCoins?: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  tasks: TaskLog[];
  reflection?: string;
  energyLevel?: "low" | "medium" | "high";
  focusScore?: number;
  createdAt: string;
  updatedAt: string;
}

export type LedgerType = "earn" | "spend" | "penalty" | "bonus";

export interface CoinLedgerEntry {
  id: string;
  type: LedgerType;
  label: string;
  amount: number;
  date: string; // ISO datetime
  relatedTaskId?: string;
  meta?: Record<string, string | number | boolean>;
}

export interface RewardItem {
  id: string;
  title: string;
  cost: number;
  description?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  rewardPerCheck: number;
  streak: number;
  bestStreak: number;
  lastCheckDate?: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

export interface HabitLog {
  habitId: string;
  date: string;
  reward: number;
  note?: string;
}

export interface WeekMeta {
  weekNumber: number;
  year: number;
  editsUsed: number;
  lastReset: string;
}

export interface FocusData {
  weeklyPlan: FocusTask[];
  dailyLogs: Record<string, DailyLog>;
  habits: Habit[];
  habitLogs: HabitLog[];
  coinBank: number;
  coinLedger: CoinLedgerEntry[];
  rewards: RewardItem[];
  weekMeta: WeekMeta;
  quickNotes: string[];
  focusStatements: string[];
  priorities: { id: string; title: string; dueDate?: string; completed?: boolean }[];
  notificationsEnabled: boolean;
  widgetPinned: boolean;
  lastHydratedAt?: string;
}

export interface FocusState extends FocusData {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  resetWeekMeta: () => Promise<void>;
  resetAllData: () => Promise<void>;
  upsertTask: (
    task: Omit<FocusTask, "createdAt" | "updatedAt" | "id"> & { id?: string }
  ) => Promise<{ success: boolean; reason?: string }>;
  deleteTask: (taskId: string) => Promise<void>;
  markTaskStatus: (date: string, payload: { taskId: string; status: TaskStatus; note?: string }) => Promise<void>;
  spendCoins: (amount: number, label: string) => Promise<boolean>;
  earnCoins: (amount: number, label: string, relatedTaskId?: string) => Promise<void>;
  registerHabitCheck: (habitId: string, date: string) => Promise<void>;
  upsertHabit: (habit: Partial<Habit> & { title: string; rewardPerCheck: number; id?: string }) => Promise<void>;
  addReward: (reward: { title: string; cost: number; description?: string }) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleNotification: (value: boolean) => Promise<{ success: boolean; reason?: string }>;
  toggleWidgetPinned: (value: boolean) => void;
  addQuickNote: (note: string) => Promise<void>;
  removeQuickNote: (note: string) => Promise<void>;
}
