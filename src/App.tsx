import { useEffect, useMemo, useState } from "react";
import {
  Aperture,
  CalendarRange,
  Coins,
  LayoutDashboard,
  Settings2,
  Sparkles,
  AppWindow
} from "lucide-react";
import { useHydratedFocusStore, useFocusStore } from "@/state/useFocusStore";
import DashboardView from "@/features/dashboard/DashboardView";
import PlannerView from "@/features/planner/PlannerView";
import HabitsView from "@/features/habits/HabitsView";
import CoinsView from "@/features/coins/CoinsView";
import WidgetView from "@/features/dashboard/WidgetView";
import { getTodayKey } from "@/utils/date";
import logoImage from "../assets/appIcon128.png";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "planner", label: "Rejalash", icon: CalendarRange },
  { id: "habits", label: "Odatlar", icon: Aperture },
  { id: "coins", label: "Coinlar", icon: Coins },
  { id: "settings", label: "Sozlamalar", icon: Settings2 }
] as const;

const inferTabFromHash = (): (typeof tabs)[number]["id"] => {
  const hash = window.location.hash.replace("#/", "");
  if (hash === "widget") return "dashboard";
  return (tabs.find(tab => tab.id === hash)?.id ?? "dashboard") as (typeof tabs)[number]["id"];
};

const AppShell = () => {
  const weekMeta = useFocusStore(state => state.weekMeta);
  const coinBank = useFocusStore(state => state.coinBank);
  const notificationsEnabled = useFocusStore(state => state.notificationsEnabled);
  const pendingLogs = useFocusStore(state => state.dailyLogs[getTodayKey()]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>(inferTabFromHash);

  useEffect(() => {
    const handler = () => {
      setActiveTab(inferTabFromHash());
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const handleTabChange = (tabId: (typeof tabs)[number]["id"]) => {
    setActiveTab(tabId);
    window.location.hash = `#/${tabId}`;
  };

  const editsLeft = useMemo(() => Math.max(0, 3 - (weekMeta?.editsUsed ?? 0)), [weekMeta]);
  const isEvening = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 19;
  }, [pendingLogs?.updatedAt]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#05050a] text-white">
      <div className="pointer-events-none absolute inset-0 blur-3xl" aria-hidden>
        <div className="absolute left-[-10%] top-[-20%] h-96 w-96 rounded-full bg-primary-500/20" />
        <div className="absolute right-[-15%] top-1/4 h-[420px] w-[420px] rounded-full bg-[#ff6b6b]/20" />
        <div className="absolute bottom-[-30%] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#22d3ee]/10" />
      </div>

      <aside className="relative z-10 flex w-72 flex-col border-r border-white/10 bg-surface/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-6 py-8">
          <img src={logoImage} alt="Focus Flow" className="h-12 w-12 rounded-2xl shadow-glow" />
          <div>
            <h1 className="text-lg font-semibold tracking-wide">Focus Flow</h1>
            <p className="text-xs text-white/60">Ultra fokus haftalik ritual</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2 px-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                  active
                    ? "bg-primary-500/20 text-white shadow-glow"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-primary-200" : "text-white/50"}`} />
                <div>
                  <div className="text-sm font-medium">{tab.label}</div>
                  {tab.id === "planner" && (
                    <div className="text-xs text-white/50">Qoldi {editsLeft} tahrir</div>
                  )}
                  {tab.id === "settings" && (
                    <div className="text-xs text-white/50">
                      Bildirishnoma {notificationsEnabled ? "yoqilgan" : "o'chirilgan"}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 px-6 pb-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Hozirgi coinlar</div>
            <div className="mt-1 flex items-baseline gap-2 text-3xl font-semibold">
              <span>{coinBank}</span>
              <span className="text-sm text-white/50">Coin</span>
            </div>
            <p className="mt-3 text-xs text-white/50">
              Hamma mukofotlar uchun tayyor turibdi. Ko'proq challenge qo'shing!
            </p>
          </div>
          <button
            onClick={() => {
              window.focusFlowAPI?.toggleWidget?.();
            }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500/80 via-primary-400/70 to-primary-500/80 px-4 py-3 text-sm font-semibold shadow-lg shadow-primary-900/20 transition hover:shadow-primary-500/30"
          >
            <AppWindow className="h-4 w-4" /> Widgetni ochish
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <HeaderSection onOpenWidget={() => window.focusFlowAPI?.toggleWidget?.()} />
        <section className="flex-1 overflow-y-auto px-8 pb-10 pt-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {activeTab === "dashboard" && <DashboardView onOpenPlanner={() => handleTabChange("planner")} />}
          {activeTab === "planner" && <PlannerView editsLeft={editsLeft} />}
          {activeTab === "habits" && <HabitsView isEvening={isEvening} />}
          {activeTab === "coins" && <CoinsView />}
          {activeTab === "settings" && <SettingsView />}
        </section>
      </main>
    </div>
  );
};

const HeaderSection = ({ onOpenWidget }: { onOpenWidget: () => void }) => {
  const [clock, setClock] = useState(() => new Date());
  const weekMeta = useFocusStore(state => state.weekMeta);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("uz-UZ", {
        weekday: "long",
        day: "numeric",
        month: "long"
      }),
    []
  );

  return (
    <header className="flex items-center justify-between border-b border-white/10 px-8 py-5 backdrop-blur-xl">
      <div>
        <div className="text-sm uppercase tracking-[0.4em] text-white/40">Current Focus</div>
        <div className="flex items-baseline gap-6">
          <div className="text-4xl font-semibold leading-tight">
            {clock.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-white/60">{dayFormatter.format(clock)}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
          <div className="text-xs text-white/50">Haftalik tahrir limiti</div>
          <div className="text-sm font-semibold text-white">
            {Math.max(0, 3 - (weekMeta?.editsUsed ?? 0))} / 3 qoldi
          </div>
        </div>
        <button
          onClick={onOpenWidget}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          Widget
        </button>
      </div>
    </header>
  );
};

const SettingsView = () => {
  const notificationsEnabled = useFocusStore(state => state.notificationsEnabled);
  const toggleNotification = useFocusStore(state => state.toggleNotification);
  const widgetPinned = useFocusStore(state => state.widgetPinned);
  const toggleWidgetPinned = useFocusStore(state => state.toggleWidgetPinned);
  const resetWeekMeta = useFocusStore(state => state.resetWeekMeta);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold">Bildirishnomalar</h2>
        <p className="mt-1 text-sm text-white/60">
          Vazifa boshlanishidan 5 daqiqa oldin eslatma olasiz.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/30 p-4">
          <div>
            <div className="text-sm font-semibold">Bildirishnomani {notificationsEnabled ? "o'chirish" : "yoqish"}</div>
            <p className="text-xs text-white/50">
              {notificationsEnabled
                ? "AI coach sizga zarur paytda push yuborib turadi."
                : "Bildirishnomalar hozircha o'chirilgan."}
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3">
            <span className="text-sm text-white/50">{notificationsEnabled ? "On" : "Off"}</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={event => {
                void toggleNotification(event.target.checked);
              }}
              className="h-5 w-10 appearance-none rounded-full bg-white/10 transition checked:bg-primary-500"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold">Widget sozlamalari</h2>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/30 p-4">
          <div>
            <div className="text-sm font-semibold">Doimo ustida turishi</div>
            <p className="text-xs text-white/50">
              Widget ekranda boshqa oynalar ustida turishi uchun.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3">
            <span className="text-sm text-white/50">{widgetPinned ? "Pinned" : "Free"}</span>
            <input
              type="checkbox"
              checked={widgetPinned}
              onChange={event => toggleWidgetPinned(event.target.checked)}
              className="h-5 w-10 appearance-none rounded-full bg-white/10 transition checked:bg-primary-500"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold">Haftalik reset</h2>
        <p className="mt-1 text-sm text-white/60">
          Agar yangi haftaga o'tgan bo'lsangiz limitni yangilash uchun reset qiling.
        </p>
        <button
          onClick={() => {
            void resetWeekMeta();
          }}
          className="mt-4 rounded-2xl border border-primary-500/40 bg-primary-500/20 px-5 py-3 text-sm font-semibold text-primary-100 transition hover:bg-primary-500/30"
        >
          Limitni yangilash
        </button>
      </section>
    </div>
  );
};

const App = () => {
  const { hydrated, hydrate } = useHydratedFocusStore();
  const isWidget = typeof window !== "undefined" && window.location.hash === "#/widget";

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05050a] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/10 px-8 py-6 text-lg font-semibold">
          Focus Flow yuklanmoqda…
        </div>
      </div>
    );
  }

  if (isWidget) {
    return <WidgetView />;
  }

  return <AppShell />;
};

export default App;
