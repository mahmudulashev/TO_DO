import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { v4 as uuid } from "uuid";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { createDefaultState } from "@/state/defaultData";
import type {
  CoinLedgerEntry,
  DailyLog,
  FocusData,
  FocusState,
  FocusTask,
  Habit,
  RewardItem,
  TaskStatus
} from "@/state/types";
import { ensureWeekMeta, getCurrentWeekMeta, getTodayKey } from "@/utils/date";

const STORAGE_KEY = "focus-flow-state";

const readPersistedState = async (): Promise<unknown> => {
  try {
    if (window.focusFlowAPI?.getState) {
      return await window.focusFlowAPI.getState();
    }
    const fallback = localStorage.getItem(STORAGE_KEY);
    return fallback ? JSON.parse(fallback) : null;
  } catch (error) {
    console.error("[FocusFlow] readPersistedState error", error);
    return null;
  }
};

const writePersistedState = async (data: FocusData) => {
  try {
    if (window.focusFlowAPI?.saveState) {
      await window.focusFlowAPI.saveState(data);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error("[FocusFlow] writePersistedState error", error);
  }
};

const sendNotification = async (payload: { title: string; body: string }) => {
  try {
    if (window.focusFlowAPI?.notify) {
      await window.focusFlowAPI.notify(payload);
    } else if ("Notification" in window && Notification.permission === "granted") {
      new Notification(payload.title, { body: payload.body });
    }
  } catch (error) {
    console.error("[FocusFlow] sendNotification error", error);
  }
};

const MAX_WEEKLY_EDITS = 3;
const SKIP_PENALTY = 10;
const REWARD_MAP = {
  light: 10,
  moderate: 20,
  deep: 30,
  boss: 40
} as const;

const pickData = (state: FocusState): FocusData => ({
  weeklyPlan: state.weeklyPlan,
  dailyLogs: state.dailyLogs,
  habits: state.habits,
  habitLogs: state.habitLogs,
  coinBank: state.coinBank,
  coinLedger: state.coinLedger,
  rewards: state.rewards,
  weekMeta: state.weekMeta,
  quickNotes: state.quickNotes,
  focusStatements: state.focusStatements,
  priorities: state.priorities,
  notificationsEnabled: state.notificationsEnabled,
  widgetPinned: state.widgetPinned,
  lastHydratedAt: state.lastHydratedAt
});

const ensureTaskReward = (task: FocusTask): FocusTask => {
  const reward = REWARD_MAP[task.difficulty] ?? task.coinReward ?? 20;
  return {
    ...task,
    coinReward: reward
  };
};

const ensureTaskSchema = (task: FocusTask): FocusTask => {
  const minute = typeof task.minute === "number" ? task.minute : 0;
  return ensureTaskReward({
    ...task,
    minute,
    durationMinutes: task.durationMinutes || 60,
    updatedAt: task.updatedAt ?? new Date().toISOString()
  });
};

const ensureHabitSchema = (habit: Habit): Habit => ({
  ...habit,
  streak: habit.streak ?? 0,
  bestStreak: habit.bestStreak ?? habit.streak ?? 0,
  rewardPerCheck: habit.rewardPerCheck ?? 10,
  archived: habit.archived ?? false,
  createdAt: habit.createdAt ?? new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const ensureRewardSchema = (reward: RewardItem): RewardItem => ({
  ...reward,
  id: reward.id ?? uuid(),
  title: reward.title ?? "",
  cost: Number.isFinite(reward.cost) ? reward.cost : Number(reward.cost ?? 0),
  description: reward.description,
  createdAt: reward.createdAt ?? new Date().toISOString()
});

const ensureDataSchema = (raw?: unknown): FocusData => {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const data = raw as Partial<FocusData>;
  return {
    ...base,
    ...data,
    weeklyPlan: (data.weeklyPlan || base.weeklyPlan).map(ensureTaskSchema),
    habits: (data.habits || base.habits).map(ensureHabitSchema),
    habitLogs: data.habitLogs || base.habitLogs,
    dailyLogs: data.dailyLogs || base.dailyLogs,
    coinBank: data.coinBank ?? base.coinBank,
    coinLedger: data.coinLedger || base.coinLedger,
    rewards: (data.rewards || base.rewards).map(ensureRewardSchema),
    weekMeta: ensureWeekMeta(data.weekMeta),
    quickNotes: data.quickNotes || base.quickNotes,
    focusStatements: data.focusStatements || base.focusStatements,
    priorities: data.priorities || base.priorities,
    notificationsEnabled: data.notificationsEnabled ?? base.notificationsEnabled,
    widgetPinned: data.widgetPinned ?? base.widgetPinned,
    lastHydratedAt: new Date().toISOString()
  };
};

const updateDailyLog = (
  dailyLogs: Record<string, DailyLog>,
  dateKey: string,
  updater: (draft: DailyLog) => void
): Record<string, DailyLog> => {
  const existing = dailyLogs[dateKey];
  const now = new Date().toISOString();
  const base: DailyLog = existing ?? {
    date: dateKey,
    tasks: [],
    createdAt: now,
    updatedAt: now
  };
  const updated = produce(base, draft => {
    updater(draft);
    draft.updatedAt = now;
  });
  return {
    ...dailyLogs,
    [dateKey]: updated
  };
};

const adjustCoinBank = (
  coinBank: number,
  delta: number
): { bank: number; applied: number } => {
  const next = Math.max(0, coinBank + delta);
  const applied = next - coinBank;
  return { bank: next, applied };
};

export const useFocusStore = create<FocusState>()(
  immer((set, get) => ({
    ...createDefaultState(),
    hydrated: false,
    hydrate: async () => {
      const raw = await readPersistedState();
      const schema = ensureDataSchema(raw);
      set({
        ...schema,
        hydrated: true
      });
      await get().persist();
    },
    persist: async () => {
      const payload = pickData(get());
      await writePersistedState(payload);
    },
    resetWeekMeta: async () => {
      const fresh = getCurrentWeekMeta();
      set(state => {
        state.weekMeta = fresh;
      });
      await get().persist();
    },
    resetAllData: async () => {
      const fresh = createDefaultState();
      set(() => ({
        ...fresh,
        hydrated: true
      }));
      await get().persist();
    },
    upsertTask: async input => {
      const now = new Date().toISOString();
      let success = true;
      let reason: string | undefined;
      set(state => {
        state.weekMeta = ensureWeekMeta(state.weekMeta);
        const isNew = !input.id;
        if (isNew) {
          const task: FocusTask = ensureTaskSchema({
            ...input,
            id: uuid(),
            createdAt: now,
            updatedAt: now,
            coinReward: input.coinReward ?? REWARD_MAP[input.difficulty]
          } as FocusTask);
          state.weeklyPlan.push(task);
          return;
        }

        const index = state.weeklyPlan.findIndex(task => task.id === input.id);
        if (index === -1) {
          success = false;
          reason = "Vazifa topilmadi";
          return;
        }
        const previous = state.weeklyPlan[index];
        const countsAsEdit =
          previous.weekday !== input.weekday ||
          previous.hour !== input.hour ||
          (previous.minute ?? 0) !== (input.minute ?? previous.minute ?? 0);
        if (countsAsEdit && state.weekMeta.editsUsed >= MAX_WEEKLY_EDITS) {
          success = false;
          reason = "Haftalik 3 ta tahrir limitidan oshib ketdi";
          return;
        }
        if (countsAsEdit) {
          state.weekMeta.editsUsed += 1;
        }
        state.weeklyPlan[index] = ensureTaskSchema({
          ...previous,
          ...input,
          updatedAt: now
        } as FocusTask);
      });
      if (success) {
        await get().persist();
      }
      return { success, reason };
    },
    deleteTask: async taskId => {
      set(state => {
        state.weeklyPlan = state.weeklyPlan.filter(task => task.id !== taskId);
        Object.keys(state.dailyLogs).forEach(key => {
          const log = state.dailyLogs[key];
          if (!log) return;
          log.tasks = log.tasks.filter(entry => entry.taskId !== taskId);
        });
      });
      await get().persist();
    },
    markTaskStatus: async (date, payload) => {
      const { taskId, status, note } = payload;
      const { weeklyPlan, coinBank } = get();
      const task = weeklyPlan.find(t => t.id === taskId);
      if (!task) return;

      const reward = task.coinReward ?? REWARD_MAP[task.difficulty];
      const now = new Date().toISOString();
      let delta = 0;

      set(state => {
        state.dailyLogs = updateDailyLog(state.dailyLogs, date, draft => {
          const idx = draft.tasks.findIndex(entry => entry.taskId === taskId);
          const existingStatus = idx === -1 ? "pending" : draft.tasks[idx].status;
          if (existingStatus === status) return;

          if (existingStatus === "completed" && status !== "completed") {
            delta -= reward;
          }
          if (existingStatus === "skipped" && status !== "skipped") {
            delta += SKIP_PENALTY;
          }
          if (status === "completed" && existingStatus !== "completed") {
            delta += reward;
          }
          if (status === "skipped" && existingStatus !== "skipped") {
            delta -= SKIP_PENALTY;
          }

          const entry = idx === -1 ? undefined : draft.tasks[idx];
          const nextEntry = {
            taskId,
            status,
            note,
            startedAt: entry?.startedAt ?? (status === "in_progress" ? now : entry?.startedAt),
            completedAt: status === "completed" ? now : entry?.completedAt,
            overrideCoinReward: entry?.overrideCoinReward,
            penaltyCoins: entry?.penaltyCoins
          };
          if (idx === -1) {
            draft.tasks.push(nextEntry);
          } else {
            draft.tasks[idx] = nextEntry;
          }
        });

        if (delta !== 0) {
          const { bank, applied } = adjustCoinBank(state.coinBank, delta);
          state.coinBank = bank;
          const entry: CoinLedgerEntry = {
            id: uuid(),
            type: applied >= 0 ? "earn" : "penalty",
            label: `${task.title} — ${status === "completed" ? "bajarildi" : status === "skipped" ? "o'tkazildi" : "yangilandi"}`,
            amount: applied,
            date: now,
            relatedTaskId: task.id,
            meta: {
              date,
              status
            }
          };
          state.coinLedger.unshift(entry);
        }
      });

      await get().persist();
    },
    spendCoins: async (amount, label) => {
      if (amount <= 0) return false;
      const { coinBank } = get();
      if (coinBank < amount) return false;
      const now = new Date().toISOString();
      set(state => {
        state.coinBank -= amount;
        const entry: CoinLedgerEntry = {
          id: uuid(),
          type: "spend",
          label,
          amount: -amount,
          date: now
        };
        state.coinLedger.unshift(entry);
      });
      await get().persist();
      return true;
    },
    earnCoins: async (amount, label, relatedTaskId) => {
      if (amount === 0) return;
      const now = new Date().toISOString();
      set(state => {
        const { bank, applied } = adjustCoinBank(state.coinBank, amount);
        state.coinBank = bank;
        const entry: CoinLedgerEntry = {
          id: uuid(),
          type: applied >= 0 ? "earn" : "penalty",
          label,
          amount: applied,
          date: now,
          relatedTaskId
        };
        state.coinLedger.unshift(entry);
      });
      await get().persist();
    },
    registerHabitCheck: async (habitId, date) => {
      const targetDate = date || getTodayKey();
      const now = new Date().toISOString();
      set(state => {
        const habit = state.habits.find(h => h.id === habitId);
        if (!habit) return;
        const alreadyLogged = state.habitLogs.some(log => log.habitId === habitId && log.date === targetDate);
        if (alreadyLogged) return;

        const currentDate = parseISO(targetDate);
        const lastLoggedDate = habit.lastCheckDate ? parseISO(habit.lastCheckDate) : null;

        if (!habit.streak || habit.streak < 1 || !lastLoggedDate) {
          habit.streak = 1;
        } else {
          const gap = differenceInCalendarDays(currentDate, lastLoggedDate);
          if (gap === 1) {
            habit.streak += 1;
          } else if (gap > 1) {
            habit.streak = 1;
          } // gap <= 0 => logging past day, keep streak as-is but ensure minimum 1
        }

        habit.bestStreak = Math.max(habit.bestStreak, habit.streak);
        habit.lastCheckDate = targetDate;
        habit.updatedAt = now;

        state.habitLogs.push({
          habitId,
          date: targetDate,
          reward: habit.rewardPerCheck
        });

        const { bank, applied } = adjustCoinBank(state.coinBank, habit.rewardPerCheck);
        state.coinBank = bank;
        const entry: CoinLedgerEntry = {
          id: uuid(),
          type: "bonus",
          label: `${habit.title} — seriya davom etmoqda`,
          amount: applied,
          date: now,
          meta: {
            habitId
          }
        };
        state.coinLedger.unshift(entry);
      });
      await get().persist();
    },
    upsertHabit: async habit => {
      const now = new Date().toISOString();
      set(state => {
        if (habit.id) {
          const index = state.habits.findIndex(h => h.id === habit.id);
          if (index !== -1) {
            state.habits[index] = ensureHabitSchema({
              ...state.habits[index],
              ...habit,
              updatedAt: now
            } as Habit);
            return;
          }
        }
        const created: Habit = ensureHabitSchema({
          id: habit.id ?? uuid(),
          title: habit.title,
          description: habit.description,
          icon: habit.icon,
          color: habit.color,
          rewardPerCheck: habit.rewardPerCheck,
          streak: habit.streak ?? 0,
          bestStreak: habit.bestStreak ?? 0,
          createdAt: now,
          updatedAt: now
        });
        state.habits.push(created);
      });
      await get().persist();
    },
    toggleNotification: async value => {
      const hasWindow = typeof window !== "undefined";
      const electronNotify = hasWindow ? window.focusFlowAPI?.notify : undefined;
      const notificationSupported = hasWindow && "Notification" in window;

      if (!value) {
        set(state => {
          state.notificationsEnabled = false;
        });
        await get().persist();
        return { success: true };
      }

      let success = true;
      let reason: string | undefined;

      if (!electronNotify) {
        if (!notificationSupported) {
          success = false;
          reason = "Brauzer bildirishnoma yuborolmaydi.";
        } else {
          let permission = Notification.permission;
          if (permission === "default" && typeof Notification.requestPermission === "function") {
            try {
              permission = await Notification.requestPermission();
            } catch {
              permission = "denied";
            }
          }
          success = permission === "granted";
          if (!success) {
            reason = "Bildirishnomalar uchun ruxsat berilmadi.";
          }
        }
      }

      set(state => {
        state.notificationsEnabled = success;
      });

      if (success) {
        await sendNotification({
          title: "Bildirishnomalar yoqildi",
          body: "Rejalaringiz bo'yicha eslatmalar yuboriladi"
        });
      }
      await get().persist();
      return { success, reason };
    },
    toggleWidgetPinned: value => {
      set(state => {
        state.widgetPinned = value;
      });
      void get().persist();
    },
    addQuickNote: async note => {
      if (!note.trim()) return;
      set(state => {
        state.quickNotes.unshift(note.trim());
      });
      await get().persist();
    },
    removeQuickNote: async note => {
      set(state => {
        state.quickNotes = state.quickNotes.filter(item => item !== note);
      });
      await get().persist();
    },
    addReward: async reward => {
      const title = reward.title.trim();
      if (!title) return;
      const cost = Math.max(10, Math.round(reward.cost));
      const now = new Date().toISOString();
      set(state => {
        const newReward: RewardItem = ensureRewardSchema({
          id: uuid(),
          title,
          cost,
          description: reward.description?.trim(),
          createdAt: now
        });
        state.rewards.unshift(newReward);
      });
      await get().persist();
    },
    deleteReward: async rewardId => {
      set(state => {
        state.rewards = state.rewards.filter(reward => reward.id !== rewardId);
      });
      await get().persist();
    },
    deleteHabit: async habitId => {
      set(state => {
        state.habits = state.habits.filter(habit => habit.id !== habitId);
        state.habitLogs = state.habitLogs.filter(log => log.habitId !== habitId);
      });
      await get().persist();
    }
  }))
);

export const useHydratedFocusStore = () => {
  const hydrated = useFocusStore(state => state.hydrated);
  const hydrate = useFocusStore(state => state.hydrate);
  return { hydrated, hydrate };
};
