import { format, getISOWeek, getISOWeekYear, isSameWeek, parseISO, startOfWeek } from "date-fns";
import type { WeekMeta } from "@/state/types";

export const getTodayKey = (date = new Date()) => format(date, "yyyy-MM-dd");

export const getCurrentWeekMeta = (date = new Date()): WeekMeta => {
  return {
    weekNumber: getISOWeek(date),
    year: getISOWeekYear(date),
    editsUsed: 0,
    lastReset: startOfWeek(date, { weekStartsOn: 1 }).toISOString()
  };
};

export const hasSameWeek = (meta: WeekMeta, date = new Date()) => {
  const reference = parseISO(meta.lastReset);
  return isSameWeek(reference, date, { weekStartsOn: 1 });
};

export const ensureWeekMeta = (meta?: WeekMeta): WeekMeta => {
  if (!meta) {
    return getCurrentWeekMeta();
  }
  if (!hasSameWeek(meta)) {
    const fresh = getCurrentWeekMeta();
    return {
      ...fresh,
      editsUsed: 0
    };
  }
  return meta;
};
