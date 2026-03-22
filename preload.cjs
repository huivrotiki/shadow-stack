const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runCommand: (cmd) => ipcRenderer.invoke("execute-bash", cmd),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke("set-always-on-top", flag),
  setFullscreen: (flag) => ipcRenderer.invoke("set-fullscreen", flag),
  sendErrorToComet: (payload) =>
    ipcRenderer.invoke("comet-report-error", payload),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  listPhases: () => ipcRenderer.invoke("phases:list"),
  runTask: (phaseId, taskId) => ipcRenderer.invoke("orchestrator:runTask", { phaseId, taskId }),
  onLog: (callback) => ipcRenderer.on("orchestrator:log", (event, data) => callback(data)),
});
