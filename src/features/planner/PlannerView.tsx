import { useMemo, useState } from "react";
import {
  AlarmClockCheck,
  CalendarRange,
  Clock4,
  PenLine,
  Plus,
  Settings2,
  Trash2
} from "lucide-react";
import { useFocusStore } from "@/state/useFocusStore";
import type { FocusTask, TaskDifficulty, Weekday } from "@/state/types";

const weekdays: { value: Weekday; label: string }[] = [
  { value: 0, label: "Dushanba" },
  { value: 1, label: "Seshanba" },
  { value: 2, label: "Chorshanba" },
  { value: 3, label: "Payshanba" },
  { value: 4, label: "Juma" },
  { value: 5, label: "Shanba" },
  { value: 6, label: "Yakshanba" }
];

const difficultyOptions: { value: TaskDifficulty; label: string; coins: number; tone: string }[] = [
  { value: "light", label: "Yengil – 10 coin", coins: 10, tone: "bg-emerald-500/20 text-emerald-200" },
  { value: "moderate", label: "Standart – 20 coin", coins: 20, tone: "bg-primary-500/20 text-primary-100" },
  { value: "deep", label: "Deep focus – 30 coin", coins: 30, tone: "bg-purple-500/20 text-purple-100" },
  { value: "boss", label: "Boss fight – 40 coin", coins: 40, tone: "bg-amber-500/20 text-amber-200" }
];

const hourOptions = Array.from({ length: 24 }, (_, idx) => idx);

interface PlannerViewProps {
  editsLeft: number;
}

interface EditorState {
  id?: string;
  title: string;
  weekday: Weekday;
  selectedWeekdays: Weekday[];
  hour: number;
  minute: number;
  durationMinutes: number;
  difficulty: TaskDifficulty;
  category: FocusTask["category"];
  description?: string;
  coinReward: number;
}

const createEditorState = (task?: FocusTask): EditorState => {
  if (!task) {
    return {
      title: "",
      weekday: 0,
      selectedWeekdays: [0],
      hour: 8,
      minute: 0,
      durationMinutes: 60,
      difficulty: "moderate",
      category: "deep_work",
      description: "",
      coinReward: 20
    };
  }
  return {
    id: task.id,
    title: task.title,
    weekday: task.weekday,
    selectedWeekdays: [task.weekday],
    hour: task.hour,
    minute: task.minute ?? 0,
    durationMinutes: task.durationMinutes,
    difficulty: task.difficulty,
    category: task.category,
    description: task.description,
    coinReward: task.coinReward
  };
};

const PlannerView = ({ editsLeft }: PlannerViewProps) => {
  const weeklyPlan = useFocusStore(state => state.weeklyPlan);
  const upsertTask = useFocusStore(state => state.upsertTask);
  const deleteTask = useFocusStore(state => state.deleteTask);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorState, setEditorState] = useState<EditorState>(createEditorState());
  const [feedback, setFeedback] = useState<string | null>(null);

  const tasksByDay = useMemo(() => {
    const map = new Map<Weekday, FocusTask[]>();
    weekdays.forEach(day => map.set(day.value, []));
    weeklyPlan.forEach(task => {
      const list = map.get(task.weekday);
      if (list) {
        list.push(task);
      }
    });
    map.forEach((tasks, key) => {
      tasks.sort((a, b) => a.hour - b.hour || (a.minute ?? 0) - (b.minute ?? 0));
      map.set(key, tasks);
    });
    return map;
  }, [weeklyPlan]);

  const openEditor = (task?: FocusTask) => {
    setEditorState(createEditorState(task));
    setEditorOpen(true);
    setFeedback(null);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setFeedback(null);
  };

  const handleSubmit = async () => {
    if (!editorState.title.trim()) {
      setFeedback("Vazifa nomi bo'sh bo'lmasin");
      return;
    }
    const targetWeekdays = editorState.id ? [editorState.weekday] : editorState.selectedWeekdays;
    if (targetWeekdays.length === 0) {
      setFeedback("Kamida bitta kunni tanlang");
      return;
    }

    const basePayload = {
      title: editorState.title.trim(),
      hour: editorState.hour,
      minute: editorState.minute,
      durationMinutes: editorState.durationMinutes,
      difficulty: editorState.difficulty,
      description: editorState.description,
      category: editorState.category,
      coinReward: editorState.coinReward
    };

    for (const day of targetWeekdays) {
      const payload = editorState.id
        ? { ...basePayload, id: editorState.id, weekday: editorState.weekday }
        : { ...basePayload, weekday: day };
      const result = await upsertTask(payload);
      if (!result.success) {
        setFeedback(result.reason ?? "Xatolik yuz berdi");
        return;
      }
    }
    closeEditor();
  };

  const handleDelete = async () => {
    if (!editorState.id) return;
    await deleteTask(editorState.id);
    closeEditor();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3 text-sm text-white/60">
            <CalendarRange className="h-5 w-5 text-primary-300" /> Haftalik ritm
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Bloklashgan jadval</h2>
          <p className="text-sm text-white/50">
            Har bir slot uchun vazifa belgilang. Haftaning 3 ta reschedule limiti mavjud.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
            Qoldi {editsLeft} tahrir
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 rounded-2xl bg-primary-500/70 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition hover:bg-primary-500"
          >
            <Plus className="h-4 w-4" /> Yangi blok
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {weekdays.map(day => {
          const tasks = tasksByDay.get(day.value) ?? [];
          return (
            <div
              key={day.value}
              className="flex min-h-[260px] flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between text-sm text-white/50">
                <span className="font-semibold text-white">{day.label}</span>
                <span>{tasks.length} ta blok</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {tasks.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-4 text-xs text-white/40">
                    Vazifa qo'shish uchun yuqoridagi tugmani bosing.
                  </div>
                )}
                {tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => openEditor(task)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left text-sm text-white/70 transition hover:border-primary-500/40 hover:bg-primary-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white/90">{task.title}</span>
                      <span className="text-xs text-white/40">
                        {String(task.hour).padStart(2, "0")}:{String(task.minute ?? 0).padStart(2, "0")}
                      </span>
                    </div>
                    {task.description && <p className="mt-1 text-xs text-white/50">{task.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/40">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                        <Clock4 className="h-3 w-3" /> {task.durationMinutes} min
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                        <AlarmClockCheck className="h-3 w-3" /> {task.coinReward} coin
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                        <Settings2 className="h-3 w-3" /> {task.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {editorOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#12121d] p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {editorState.id ? "Blokni tahrirlash" : "Yangi blok"}
              </h3>
              <button onClick={closeEditor} className="text-sm text-white/50 hover:text-white">
                yopish
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-white/60">
                Vazifa nomi
                <input
                  value={editorState.title}
                  onChange={event => setEditorState(prev => ({ ...prev, title: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                  placeholder="Masalan, Deep work"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-white/60">
                Kategoriya
                <select
                  value={editorState.category}
                  onChange={event => setEditorState(prev => ({ ...prev, category: event.target.value as FocusTask["category"] }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                >
                  <option value="deep_work">Deep work</option>
                  <option value="learning">Learning</option>
                  <option value="health">Health</option>
                  <option value="admin">Admin</option>
                  <option value="rest">Rest</option>
                  <option value="shallow">Surface tasks</option>
                </select>
              </label>
              <div className="flex flex-col gap-2 text-sm text-white/60">
                Kunlar
                <div className="flex flex-wrap gap-2">
                  {weekdays.map(day => {
                    const active = editorState.selectedWeekdays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          setEditorState(prev => {
                            if (prev.id) {
                              return {
                                ...prev,
                                weekday: day.value,
                                selectedWeekdays: [day.value]
                              };
                            }
                            const exists = prev.selectedWeekdays.includes(day.value);
                            const next = exists
                              ? prev.selectedWeekdays.filter(item => item !== day.value)
                              : [...prev.selectedWeekdays, day.value];
                            return {
                              ...prev,
                              weekday: next[0] ?? day.value,
                              selectedWeekdays: next.length ? next : [day.value]
                            };
                          });
                        }}
                        className={`rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                          active
                            ? "border-primary-500/50 bg-primary-500/20 text-primary-100"
                            : "border-white/10 bg-black/30 text-white/60 hover:border-primary-400/40 hover:text-white"
                        }`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                {!editorState.id && (
                  <p className="text-xs text-white/40">Bir nechta kunni tanlab, shu blokni haftada qayta takrorlang.</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex flex-1 flex-col gap-2 text-sm text-white/60">
                  Soat
                  <select
                    value={editorState.hour}
                    onChange={event => setEditorState(prev => ({ ...prev, hour: Number(event.target.value) }))}
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                  >
                    {hourOptions.map(hour => (
                      <option key={hour} value={hour}>
                        {String(hour).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-2 text-sm text-white/60">
                  Daqiqa
                  <select
                    value={editorState.minute}
                    onChange={event => setEditorState(prev => ({ ...prev, minute: Number(event.target.value) }))}
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                  >
                    {[0, 15, 30, 45].map(minute => (
                      <option key={minute} value={minute}>
                        {String(minute).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm text-white/60">
                Davomiyligi (minut)
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={editorState.durationMinutes}
                  onChange={event => setEditorState(prev => ({ ...prev, durationMinutes: Number(event.target.value) }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-white/60 md:col-span-2">
                Izoh
                <textarea
                  rows={3}
                  value={editorState.description ?? ""}
                  onChange={event => setEditorState(prev => ({ ...prev, description: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-primary-400 focus:outline-none"
                  placeholder="Bu blokda nima qilasiz?"
                />
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-sm font-semibold text-white/70">Qiyinlik va coin mukofot</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {difficultyOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setEditorState(prev => ({
                        ...prev,
                        difficulty: option.value,
                        coinReward: option.coins
                      }))
                    }
                    className={`flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-left text-sm transition ${
                      editorState.difficulty === option.value ? option.tone + " border-transparent" : "text-white/60"
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="text-xs">+{option.coins}</span>
                  </button>
                ))}
              </div>
            </div>

            {feedback && <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{feedback}</div>}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={closeEditor}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10"
              >
                Bekor qilish
              </button>
              <div className="flex items-center gap-3">
                {editorState.id && (
                <button
                  onClick={() => {
                    void handleDelete();
                  }}
                    className="rounded-2xl border border-danger/40 bg-danger/10 px-5 py-3 text-sm font-semibold text-danger transition hover:bg-danger/20"
                  >
                    <Trash2 className="mr-1 inline-block h-4 w-4" /> O'chirish
                  </button>
                )}
                <button
                  onClick={() => {
                    void handleSubmit();
                  }}
                  className="rounded-2xl bg-primary-500/80 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition hover:bg-primary-500"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerView;
