if (process.env.ELECTRON_RUN_AS_NODE) {
  delete process.env.ELECTRON_RUN_AS_NODE;
}

const { app, BrowserWindow, ipcMain, nativeImage, Notification, Tray, Menu, systemPreferences } = require("electron");
const path = require("path");
const fs = require("fs");
const ElectronStore = require("electron-store");
const Store = ElectronStore.default ?? ElectronStore;

const isDev = process.env.VITE_DEV_SERVER === "true";
let store;

let mainWindow;
let widgetWindow;
let tray;
let scheduleTimer;
const notifiedTaskIds = new Set();
let notifiedDateKey = null;

const toIsoWeekday = value => {
  // JS: 0=Sunday,6=Saturday => map to Monday=0
  return (value + 6) % 7;
};

const getPreloadPath = () =>
  path.join(__dirname, "preload.js");

const getRendererUrl = () =>
  isDev ? "http://localhost:5173" : `file://${path.join(__dirname, "..", "dist", "index.html")}`;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: "#0b0b12",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
    vibrancy: "under-window",
    visualEffectState: "active",
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true
    }
  });

  const url = getRendererUrl();
  mainWindow.loadURL(url);

  if (!isDev) {
    mainWindow.removeMenu();
  }
}

function createWidgetWindow() {
  widgetWindow = new BrowserWindow({
    width: 380,
    height: 420,
    show: false,
    resizable: false,
    movable: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    vibrancy: "sidebar",
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const baseUrl = getRendererUrl();
  widgetWindow.loadURL(`${baseUrl}#/widget`);

  widgetWindow.on("blur", () => {
    widgetWindow?.hide();
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "assets", "trayTemplate.png");
  let trayIcon = null;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Focus Flow ochish",
      click: () => mainWindow?.show()
    },
    {
      label: "Widget",
      click: toggleWidget
    },
    { type: "separator" },
    {
      label: "Chiqish",
      click: () => app.quit()
    }
  ]);
  tray.setToolTip("Focus Flow – Keyingi vazifa va rejalaringiz");
  tray.setContextMenu(contextMenu);
  tray.on("click", toggleWidget);
}

function toggleWidget() {
  if (!widgetWindow) return;
  if (widgetWindow.isVisible()) {
    widgetWindow.hide();
  } else {
    widgetWindow.show();
  }
}

function getPersistedState() {
  if (!store) {
    return null;
  }
  return store.get("state");
}

function setPersistedState(newState) {
  if (!store) return newState;
  store.set("state", newState);
  return newState;
}

function getTodayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function isSameLocalDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function summariseDay(state) {
  if (!state) return { report: "", stats: null };
  const todayKey = getTodayKey();
  const today = new Date();
  const isoDay = toIsoWeekday(today.getDay());
  const templateTasks = Array.isArray(state.weeklyPlan)
    ? state.weeklyPlan.filter(task => task.weekday === isoDay)
    : [];
  const dailyLog = state.dailyLogs?.[todayKey];

  const logTasks = Array.isArray(dailyLog?.tasks) ? dailyLog.tasks : [];
  const tasksForToday = templateTasks
    .map(task => {
      const start = new Date();
      start.setHours(task.hour ?? 0, task.minute ?? 0, 0, 0);
      const end = new Date(start.getTime() + (task.durationMinutes || 60) * 60000);
      const entry = logTasks.find(item => item.taskId === task.id);
      const status = entry?.status ?? "pending";
      return {
        id: task.id,
        title: task.title,
        reward: task.coinReward ?? 0,
        difficulty: task.difficulty,
        status,
        start,
        end
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const completedTasks = tasksForToday.filter(task => task.status === "completed");
  const skippedTasks = tasksForToday.filter(task => task.status === "skipped");
  const inProgress = tasksForToday.filter(task => task.status === "in_progress");
  const total = tasksForToday.length;
  const completed = completedTasks.length;
  const skipped = skippedTasks.length;
  const pending = Math.max(total - completed - skipped, 0);
  const overdueTasks = tasksForToday.filter(task => task.status !== "completed" && task.end < today);
  const upcomingTasks = tasksForToday.filter(task => task.status !== "completed" && task.start > today);
  const progressRatio = total ? completed / total : 0;

  const todayLedger = Array.isArray(state.coinLedger)
    ? state.coinLedger.filter(entry => {
        if (!entry?.date) return false;
        const entryDate = new Date(entry.date);
        return isSameLocalDay(entryDate, today);
      })
    : [];
  const earned = todayLedger.filter(entry => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
  const spent = todayLedger.filter(entry => entry.amount < 0).reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

  const coinDelta = earned - spent;

  const habitLogs = Array.isArray(state.habitLogs)
    ? state.habitLogs.filter(log => log.date === todayKey)
    : [];
  const habitIdsToday = new Set(habitLogs.map(log => log.habitId));
  const habits = Array.isArray(state.habits) ? state.habits : [];
  const habitHighlights = habits
    .filter(habit => habitIdsToday.has(habit.id))
    .map(habit => habit.title)
    .slice(0, 3);
  const topStreakHabit = habits.reduce((best, habit) => {
    if (!best || (habit.bestStreak ?? 0) > (best.bestStreak ?? 0)) {
      return habit;
    }
    return best;
  }, null);

  const completedHighlights = completedTasks
    .sort((a, b) => b.reward - a.reward)
    .slice(0, 3)
    .map(task => `${task.title} (+${task.reward} coin)`);

  const nextAction =
    inProgress[0] ??
    overdueTasks.sort((a, b) => a.end.getTime() - b.end.getTime())[0] ??
    upcomingTasks.sort((a, b) => a.start.getTime() - b.start.getTime())[0] ??
    null;

  let coachAdvice;
  if (!total) {
    coachAdvice =
      habitLogs.length > 0
        ? "Odatlar bo'yicha zo'r start! Endi Planner sahifasida ertangi kun uchun kamida bitta blok qo'shing."
        : "Planner hozircha bo'sh. Eng muhim 3 vazifani yozib, vaqtini bloklab oling.";
  } else if (progressRatio >= 0.95) {
    coachAdvice = "Legend darajasi! Bugungi sprint yakunlandi, endi o'zingizni mukofotlashni unutmang.";
  } else if (progressRatio >= 0.6) {
    coachAdvice =
      overdueTasks.length > 0
        ? "Progress yaxshi, lekin kechikayotgan blokni yopib, kunni yakunlab qo'ying."
        : "Ritm yaxshi ketdi. Shu ruhda oxirgi blok(lar)ni ham yakunlab qo'ying.";
  } else if (skipped >= Math.max(1, Math.ceil(total / 2))) {
    coachAdvice =
      "Bugun ko'p vazifa o'tkazildi. Sabablarini yozib chiqing va ertaga muhimlari uchun to'siqlarni yo'q qiling.";
  } else if (inProgress.length > 0) {
    coachAdvice = `Fokusni tugating: "${inProgress[0].title}" blokini 25 daqiqa ichida yakunlashga harakat qiling.`;
  } else if (overdueTasks.length > 0) {
    coachAdvice = `Avval kechikayotgan "${overdueTasks[0].title}" blokini yopib, keyin boshqa ishlarni boshlang.`;
  } else {
    coachAdvice = "Bugun hali ham vaqt bor. Eng katta qiymat olib keladigan blokni tanlab, fokusni yoqing.";
  }

  const lines = [];
  lines.push("📈 Bugungi natija");
  lines.push(`• Vazifalar: ${completed}/${total} (${Math.round(progressRatio * 100)}%)`);
  lines.push(`• Coinlar: +${earned} / -${spent} (${coinDelta >= 0 ? "+" : ""}${coinDelta} balans o'zgarishi)`);
  lines.push(`• Odatlar: ${habitLogs.length} ta check-in`);
  if (topStreakHabit?.bestStreak) {
    lines.push(`• Eng uzun streak: ${topStreakHabit.title} (${topStreakHabit.bestStreak} kun)`);
  }

  lines.push("");
  lines.push("✅ G'alabalar");
  if (completedHighlights.length > 0) {
    completedHighlights.forEach(item => {
      lines.push(`• ${item}`);
    });
  } else {
    lines.push("• Bugun hali vazifa yakunlanmadi. Bir soatni deep work uchun ajrating.");
  }
  if (habitHighlights.length > 0) {
    lines.push(`• Habitlar: ${habitHighlights.join(", ")}`);
  }

  lines.push("");
  lines.push("🎯 Keyingi qadam");
  lines.push(`• ${coachAdvice}`);
  if (nextAction) {
    const nextTime = nextAction.start.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
    lines.push(`• Keyingi blok: ${nextTime} — ${nextAction.title}`);
  } else if (!total) {
    lines.push("• Plannerga kamida bitta strategik blok qo'shing.");
  }
  if (coinDelta < 0) {
    lines.push("• Coin sarfi daromaddan ko'p bo'ldi, ertaga bonus olish uchun yuqori qiymatli blokni bajaring.");
  }

  const report = lines.join("\n");

  return {
    report,
    stats: {
      completed,
      pending,
      skipped,
      earned,
      spent,
      habitsChecked: habitLogs.length,
      progress: progressRatio
    }
  };
}

function scheduleWatcher() {
  clearInterval(scheduleTimer);
  scheduleTimer = setInterval(() => {
    try {
      const state = getPersistedState();
      if (!state || !Array.isArray(state.weeklyPlan)) return;

      if (widgetWindow) {
        const pinned = state.widgetPinned !== false;
        widgetWindow.setAlwaysOnTop(Boolean(pinned), "screen-saver");
        widgetWindow.setVisibleOnAllWorkspaces(Boolean(pinned));
      }

      if (state.notificationsEnabled === false) return;
      const now = new Date();
      const todayKey = getTodayKey();
      if (notifiedDateKey !== todayKey) {
        notifiedTaskIds.clear();
        notifiedDateKey = todayKey;
      }

      const isoDay = toIsoWeekday(now.getDay());
      state.weeklyPlan
        .filter(task => task.weekday === isoDay)
        .forEach(task => {
          if (notifiedTaskIds.has(task.id)) return;
          const hour = typeof task.hour === "number" ? task.hour : parseInt(task.hour, 10) || 0;
          const minute = typeof task.minute === "number" ? task.minute : 0;
          const taskDate = new Date();
          taskDate.setHours(hour, minute, 0, 0);
          const diffMinutes = (taskDate.getTime() - now.getTime()) / 60000;

          if (diffMinutes <= 5 && diffMinutes >= -10) {
            new Notification({
              title: "Keyingi vazifa vaqti",
              body: `${task.title} (${hour.toString().padStart(2, "0")}:${minute
                .toString()
                .padStart(2, "0")})`
            }).show();
            notifiedTaskIds.add(task.id);
          }
        });
    } catch (error) {
      console.error("[FocusFlow] schedule watcher error", error);
    }
  }, 60 * 1000);
}

function registerIpcHandlers() {
  if (!ipcMain) return;
  ipcMain.handle("store:get", () => getPersistedState());
  ipcMain.handle("store:set", (_event, data) => setPersistedState(data));
  ipcMain.handle("notify", (_event, payload) => {
    new Notification(payload).show();
  });
  ipcMain.handle("widget:toggle", () => {
    toggleWidget();
    return true;
  });
  ipcMain.handle("summary:generate", () => summariseDay(getPersistedState()));
  ipcMain.handle("week:reset", () => {
    const state = getPersistedState() || {};
    const updated = {
      ...state,
      weekMeta: {
        ...(state.weekMeta || {}),
        editsUsed: 0,
        lastReset: new Date().toISOString()
      }
    };
    setPersistedState(updated);
    return updated.weekMeta;
  });
}

app.whenReady().then(() => {
  if (process.platform === "darwin") {
    const iconPath = path.join(__dirname, "..", "assets", "dockIcon.png");
    if (fs.existsSync(iconPath)) {
      app.dock.setIcon(iconPath);
    }
  }

  if (systemPreferences?.askForMediaAccess) {
    systemPreferences.askForMediaAccess("microphone").catch(() => {});
  }

  const storeOptions = {
    name: "focus-flow",
    projectName: "focus-flow",
    defaults: {
      state: null
    }
  };

  if (!store) {
    store = new Store(storeOptions);
  }

  registerIpcHandlers();
  createMainWindow();
  createWidgetWindow();
  createTray();
  scheduleWatcher();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
