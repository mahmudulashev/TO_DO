import { useMemo, useState, type ReactNode } from "react";
import { Flame, Medal, PlusCircle, Repeat, Sparkles, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useFocusStore } from "@/state/useFocusStore";
import type { Habit } from "@/state/types";
import { getTodayKey } from "@/utils/date";

interface HabitsViewProps {
  isEvening: boolean;
}

const HabitsView = ({ isEvening }: HabitsViewProps) => {
  const habits = useFocusStore(state => state.habits);
  const habitLogs = useFocusStore(state => state.habitLogs);
  const registerHabitCheck = useFocusStore(state => state.registerHabitCheck);
  const upsertHabit = useFocusStore(state => state.upsertHabit);
  const coinBank = useFocusStore(state => state.coinBank);
  const deleteHabit = useFocusStore(state => state.deleteHabit);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", reward: 20, description: "" });

  const todayKey = getTodayKey();

  const stats = useMemo(() => {
    const active = habits.filter(habit => !habit.archived);
    const totalChecks = habitLogs.filter(log => log.date === todayKey).length;
    const totalRewards = habitLogs.reduce((sum, log) => sum + log.reward, 0);
    const longestStreak = active.reduce((max, habit) => Math.max(max, habit.bestStreak), 0);
    return {
      totalHabits: active.length,
      totalChecks,
      totalRewards,
      longestStreak
    };
  }, [habits, habitLogs, todayKey]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    await upsertHabit({
      title: form.title.trim(),
      rewardPerCheck: form.reward,
      description: form.description,
      color: "#38bdf8"
    });
    setForm({ title: "", reward: 20, description: "" });
    setFormOpen(false);
  };

  const markToday = async (habit: Habit) => {
    await registerHabitCheck(habit.id, todayKey);
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Faol odatlar"
          value={`${stats.totalHabits}`}
          hint="Ritual soni"
        />
        <InfoCard
          icon={<Repeat className="h-5 w-5" />}
          title="Bugungi check-in"
          value={`${stats.totalChecks}`}
          hint="Necha odat bajarildi"
        />
        <InfoCard
          icon={<Medal className="h-5 w-5" />}
          title="Uzun streak"
          value={`${stats.longestStreak} kun`}
          hint="Rekord"
        />
        <InfoCard
          icon={<Flame className="h-5 w-5" />}
          title="Habit coinlari"
          value={`${stats.totalRewards}`}
          hint={`Balans: ${coinBank}`}
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Kunlik ritual</h2>
            <p className="text-sm text-white/50">
              {isEvening
                ? "Kecha bilan ruhiy xulosa qiling va streakni uzmang."
                : "Bugun qaysi challenge bajarildi? Maqsad sari kichik qadamlar."}
            </p>
          </div>
          <button
            onClick={() => setFormOpen(prev => !prev)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-500/70 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition hover:bg-primary-500"
          >
            <PlusCircle className="h-4 w-4" /> {formOpen ? "Bekor qilish" : "Odat qo'shish"}
          </button>
        </div>

        {formOpen && (
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/60">
              Odat nomi
              <input
                value={form.title}
                onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                placeholder="Shakarsiz kun"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/60">
              Mukofot (coin)
              <input
                type="number"
                min={5}
                value={form.reward}
                onChange={event => setForm(prev => ({ ...prev, reward: Number(event.target.value) }))}
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm text-white/60">
              Qisqa ta'rif
              <textarea
                rows={2}
                value={form.description}
                onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                placeholder="Qoidani yozib qo'ying"
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-primary-500/80 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition hover:bg-primary-500"
              >
                Saqlash
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {habits.map(habit => (
            <div
              key={habit.id}
              className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 p-5 text-sm text-white/70"
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <div className="text-base font-semibold">{habit.title}</div>
                  <p className="text-xs text-white/50">Mukofot: +{habit.rewardPerCheck} coin</p>
                </div>
                <div className="rounded-full bg-white/10 px-4 py-1 text-xs text-white/50">
                  Streak: {habit.streak}
                </div>
              </div>
              {habit.description && <p className="text-xs text-white/50">{habit.description}</p>}
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>
                  Oxirgi check: {habit.lastCheckDate ? format(new Date(habit.lastCheckDate), "dd MMM") : "-"}
                </span>
                <span>Rekord: {habit.bestStreak}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    void markToday(habit);
                  }}
                  className="flex-1 rounded-2xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
                >
                  Bugun bajarildi
                </button>
                <button
                  onClick={() => {
                    void deleteHabit(habit.id);
                  }}
                  className="rounded-2xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger transition hover:bg-danger/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {habits.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/30 p-5 text-sm text-white/50">
              Hozircha odatlar yo'q. Yangi challenge qo'shing.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const InfoCard = ({
  icon,
  title,
  value,
  hint
}: {
  icon: ReactNode;
  title: string;
  value: string;
  hint: string;
}) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60 backdrop-blur-xl">
    <div className="flex items-center gap-3 text-white">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-primary-200">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">{title}</div>
        <div className="text-xl font-semibold text-white">{value}</div>
      </div>
    </div>
    <div className="mt-3 text-xs text-white/40">{hint}</div>
  </div>
);

export default HabitsView;
