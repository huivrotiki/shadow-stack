const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runCommand: (command) => ipcRenderer.invoke("execute-bash", command),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke("set-always-on-top", flag),
  setFullscreen: (flag) => ipcRenderer.invoke("set-fullscreen", flag),
  sendErrorToComet: (payload) =>
    ipcRenderer.invoke("comet-report-error", payload),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
});
