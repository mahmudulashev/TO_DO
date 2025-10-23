const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("focusFlowAPI", {
  getState: () => ipcRenderer.invoke("store:get"),
  saveState: state => ipcRenderer.invoke("store:set", state),
  toggleWidget: () => ipcRenderer.invoke("widget:toggle"),
  notify: payload => ipcRenderer.invoke("notify", payload),
  generateSummary: () => ipcRenderer.invoke("summary:generate"),
  resetWeek: () => ipcRenderer.invoke("week:reset"),
  on: (channel, listener) => {
    ipcRenderer.on(channel, listener);
  },
  off: (channel, listener) => {
    ipcRenderer.removeListener(channel, listener);
  }
});
