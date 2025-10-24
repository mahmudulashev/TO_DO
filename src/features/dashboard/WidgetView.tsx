import { useMemo } from "react";
import { CalendarCheck2, Clock3, Sparkles, Zap } from "lucide-react";
import { format } from "date-fns";
import { useFocusStore } from "@/state/useFocusStore";
import type { TaskStatus } from "@/state/types";
import { getTodayKey } from "@/utils/date";

const jsDayToIso = (day: number) => (day + 6) % 7;

const WidgetView = () => {
  const weeklyPlan = useFocusStore(state => state.weeklyPlan);
  const dailyLogs = useFocusStore(state => state.dailyLogs);
  const coinBank = useFocusStore(state => state.coinBank);
  const markTaskStatus = useFocusStore(state => state.markTaskStatus);

  const todayKey = getTodayKey();

  const { nextTask, preview } = useMemo(() => {
    const now = new Date();
    const isoDay = jsDayToIso(now.getDay());
    const template = weeklyPlan
      .filter(task => task.weekday === isoDay)
      .map(task => {
        const start = new Date();
        start.setHours(task.hour, task.minute ?? 0, 0, 0);
        const end = new Date(start.getTime() + task.durationMinutes * 60 * 1000);
        const logEntry = dailyLogs[todayKey]?.tasks.find(entry => entry.taskId === task.id);
        const status = logEntry?.status ?? "pending";
        const isFuture = start >= now && status !== "completed";
        const isCurrent = now >= start && now <= end && status !== "completed";
        return {
          id: task.id,
          title: task.title,
          reward: task.coinReward,
          start,
          status,
          isCurrent,
          isFuture
        };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const next = template.find(entry => entry.isCurrent || entry.isFuture);
    return {
      nextTask: next,
      preview: template.slice(0, 4)
    };
  }, [weeklyPlan, dailyLogs, todayKey]);

  const handleAction = async (taskId: string, status: TaskStatus) => {
    await markTaskStatus(todayKey, { taskId, status });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e1e2a,_#0b0b14)] p-6 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">Focus Flow</div>
            <h2 className="mt-2 text-lg font-semibold">
              {nextTask ? nextTask.title : "Bugun vazifa kiritilmagan"}
            </h2>
            <p className="text-xs text-white/50">
              {nextTask
                ? `${format(nextTask.start, "HH:mm")} · Mukofot ${nextTask.reward} coin`
                : "Plannerga o'tib yangi blok qo'shing."}
            </p>
          </div>
          <div className="rounded-full bg-primary-500/20 px-4 py-2 text-xs text-primary-100">
            Coin: {coinBank}
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            disabled={!nextTask || nextTask.status === "in_progress"}
            onClick={() => {
              if (nextTask) {
                void handleAction(nextTask.id, "in_progress");
              }
            }}
            className="flex-1 rounded-2xl border border-primary-500/40 bg-primary-500/15 px-4 py-2 text-xs font-semibold text-primary-100 transition hover:bg-primary-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {nextTask?.status === "in_progress" ? "Fokus davom etmoqda" : "Boshlash"}
          </button>
          <button
            disabled={!nextTask}
            onClick={() => {
              if (nextTask) {
                void handleAction(nextTask.id, "completed");
              }
            }}
            className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Yakunlandi
          </button>
          <button
            disabled={!nextTask}
            onClick={() => {
              if (nextTask) {
                void handleAction(nextTask.id, "skipped");
              }
            }}
            className="flex-1 rounded-2xl border border-danger/30 bg-danger/20 px-4 py-2 text-xs font-semibold text-danger transition hover:bg-danger/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            O'tkazish
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {preview.map(task => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                {task.isCurrent ? <Zap className="h-4 w-4 text-accent" /> : <Clock3 className="h-4 w-4 text-white/40" />}
              </div>
              <div>
                <div className="font-medium text-white/80">{task.title}</div>
                <div className="text-xs text-white/40">{format(task.start, "HH:mm")} · {task.reward} coin</div>
              </div>
              </div>
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">
              {task.status === "completed"
                ? "DONE"
                : task.status === "skipped"
                ? "SKIPPED"
                : task.status === "in_progress"
                ? "FOCUS"
                : task.isCurrent
                ? "NOW"
                : task.isFuture
                ? "NEXT"
                : "PENDING"}
            </span>
          </div>
        ))}
      </div>

      <footer className="mt-6 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-4 w-4" /> Haftalik jadvalni ilovada yangilang · <Sparkles className="h-4 w-4 text-primary-200" />
        </div>
      </footer>
    </div>
  );
};

export default WidgetView;
