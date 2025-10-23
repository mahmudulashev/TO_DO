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

function summariseDay(state) {
  if (!state) return { report: "", stats: null };
  const todayKey = getTodayKey();
  const today = new Date(todayKey);
  const isoDay = toIsoWeekday(today.getDay());
  const templateTasks = Array.isArray(state.weeklyPlan)
    ? state.weeklyPlan.filter(task => task.weekday === isoDay)
    : [];
  const dailyLog = state.dailyLogs?.[todayKey];

  const completed = dailyLog?.tasks?.filter(t => t.status === "completed").length ?? 0;
  const skipped = dailyLog?.tasks?.filter(t => t.status === "skipped").length ?? 0;
  const total = templateTasks.length;
  const pending = Math.max(total - completed - skipped, 0);

  const todayLedger = Array.isArray(state.coinLedger)
    ? state.coinLedger.filter(entry => entry.date?.startsWith(todayKey))
    : [];
  const earned = todayLedger.filter(entry => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
  const spent = todayLedger.filter(entry => entry.amount < 0).reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

  const mood =
    completed === 0 && pending > 0
      ? "Bugun reja biroz chetga chiqdi. Nimalar halaqit berganini yozib chiqing, ertaga unga qarshi strategiya tuzamiz."
      : skipped > completed
      ? "Ko'p ishlar hozircha tugallanmagan. Eng katta to'siq nimada? Uni ertangi jadvalingizda hal qilamiz."
      : "Zo'r ish! Endi mukofotlaringizni rejalashtiring va ijodiy dam oling.";

  const report = `• Tugallangan: ${completed}\n• Qoldi: ${pending}\n• O'tkazib yuborildi: ${skipped}\n• Coinlar: +${earned} / -${spent}\n\nAI Coach: ${mood}`;

  return { report, stats: { completed, pending, skipped, earned, spent } };
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
