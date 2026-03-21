const { app, BrowserWindow, ipcMain, nativeImage } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");

// Debug logging
const DEBUG = process.argv.includes("--debug") || process.argv.includes("-d");
const LOG_FILE = process.env.SHADOW_LOG || "/tmp/shadow-widget.log";

function log(...args) {
  const timestamp = new Date().toISOString();
  const msg = `[${timestamp}] ${args.join(" ")}`;
  console.log(msg);
  try {
    fs.appendFileSync(LOG_FILE, msg + "\n");
  } catch {}
}

function debug(...args) {
  if (DEBUG) log("[DEBUG]", ...args);
}

log("Shadow Stack Widget starting...", process.argv);

let mainWindow;

// Headless mode
const args = process.argv.slice(2);
const headlessStep = args.find((a) => a.startsWith("--step="));
const headlessAll = args.includes("--all");
const isHeadless = headlessStep || headlessAll;

debug("Args:", args);
debug("Headless:", isHeadless, "Step:", headlessStep);

if (isHeadless) {
  const stepId = headlessStep ? parseInt(headlessStep.split("=")[1]) : null;
  log(`Headless mode: running step ${stepId !== null ? stepId : "all"}`);
  runHeadless(stepId);
  return;
}

async function runHeadless(stepId) {
  const { execSync } = require("child_process");

  const steps = [
    {
      id: 0,
      title: "Разведка и аудит",
      code: `which brew node python3 ollama git && echo "✅ All tools found" || echo "❌ Missing tools"\ndf -h ~\nvm_stat | grep "Pages free"\nlaunchctl list | grep -E "(ollama|openclaw|nemo|langfuse)" || echo "No agents running"\nlsof -iTCP -sTCP:LISTEN -P | grep -v grep\ntailscale status 2>/dev/null || echo "Tailscale not running"`,
    },
    {
      id: 0.5,
      title: "Провайдеры и MCP скиллы",
      code: `echo "=== Ollama Models ==="\nollama list\necho "\n=== Ollama API ==="\ncurl -s http://localhost:11434/v1/models 2>/dev/null | grep -o '"name":"[^"]*"' | head -10 || echo "Ollama API not responding"\necho "\n=== Comet/Opik ==="\ncurl -s http://localhost:8080/v1/models 2>/dev/null | head -5 || echo "Comet not running"\necho "\n=== API Keys in .env ==="\ngrep -E "(API_KEY|ENDPOINT)" ~/shadow-stack-widget/.env 2>/dev/null | sed 's/=.*/=***/' || echo "No .env or no keys"\necho "\n=== MCP Skills ==="\nls ~/AI-Workspace/02-Skills/ 2>/dev/null | wc -l && echo "skills installed"\nls ~/AI-Workspace/02-Skills/ 2>/dev/null | head -20`,
    },
    {
      id: 1,
      title: "Homebrew, Node.js, Python",
      code: 'brew update && brew install node@22 python@3.12 && brew link node@22 --force && echo "Node: $(node -v)" && echo "Python: $(python3 -V)"',
    },
    {
      id: 2,
      title: "Ollama + модели",
      code: "brew install ollama && brew services start ollama && sleep 3 && ollama pull llama3.2 && ollama pull phi3 && ollama pull mistral && ollama pull qwen2.5:3b && ollama list",
    },
    {
      id: 3,
      title: "OpenClaw Agent",
      code: 'npm install -g opencode-ai && opencode --version || echo "OpenClaw CLI installed"',
    },
    {
      id: 4,
      title: "NeMo Agent Toolkit",
      code: 'pip3 install nemotoolkit --quiet 2>/dev/null || echo "Installing NeMo..."',
    },
    {
      id: 5,
      title: "OpenCode SDK",
      code: 'npm install @opencode-ai/sdk && mkdir -p ~/.opencode && echo "OpenCode SDK configured"',
    },
    {
      id: 6,
      title: "Vercel AI SDK v4+",
      code: "npm install ai @ai-sdk/openai && node -e \"require('ai'); console.log('✅ ai SDK ok')\"",
    },
    {
      id: 7,
      title: "Playwright MCP",
      code: 'npm install -g @playwright/mcp@latest && npx playwright install chromium && echo "✅ Playwright MCP ready"',
    },
  ];

  const toRun = stepId !== null ? steps.filter((s) => s.id === stepId) : steps;

  console.log(`\n🔮 Shadow Stack Widget - Headless Mode\n${"=".repeat(40)}`);

  for (const step of toRun) {
    console.log(`\n[Step ${step.id}] ${step.title}`);
    console.log("-".repeat(40));
    try {
      const result = execSync(step.code, {
        cwd: process.env.HOME,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
        shell: "/bin/bash",
      });
      console.log(result.toString());
      console.log(`✅ [Step ${step.id}] completed`);
    } catch (err) {
      console.error(`❌ [Step ${step.id}] ERROR: ${err.message}`);
    }
  }

  console.log(`\n${"=".repeat(40)}\n✅ Headless execution complete\n`);
  process.exit(0);
}

function createWindow() {
  try {
    debug("Creating window...");
    log("Platform:", process.platform, "Arch:", process.arch);

    if (process.platform === "darwin") {
      const iconPath = path.join(__dirname, "build", "icon.icns");
      if (fs.existsSync(iconPath)) {
        const image = nativeImage.createFromPath(iconPath);
        if (!image.isEmpty()) {
          app.dock.setIcon(image);
        }
      }
    }

    const isDev = !app.isPackaged;

    mainWindow = new BrowserWindow({
      width: 450,
      height: 700,
      minWidth: 320,
      minHeight: 400,
      resizable: true,
      fullscreenable: true,
      movable: true,
      frame: false,
      transparent: true,
      titleBarStyle: "hiddenInset",
      backgroundColor: "#00000000",
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        devTools: isDev,
      },
    });

    mainWindow.on("ready-to-show", () => {
      debug("Window ready-to-show");
      mainWindow.show();
      mainWindow.focus();
    });

    mainWindow.webContents.on("did-fail-load", (e, code, desc) => {
      console.error("[main] did-fail-load:", code, desc);
    });

    mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    if (isDev) {
      const devUrl = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5175";
      debug("Loading:", devUrl);
      mainWindow.loadURL(devUrl);
      mainWindow.webContents.openDevTools({ mode: "detach" });
    } else {
      debug("Loading: dist/index.html");
      mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
    }
  } catch (err) {
    console.error("[main] createWindow error:", err);
  }
}

const gotLock = app.requestSingleInstanceLock();
const isDev = !app.isPackaged;
console.log("[main] gotLock:", gotLock, "isDev:", isDev);

if (!gotLock) {
  app.quit();
  return;
}

app.on("second-instance", () => {
  const [w] = BrowserWindow.getAllWindows();
  if (w) {
    if (w.isMinimized()) w.restore();
    w.show();
    w.focus();
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) createWindow();
});

// IPC: execute bash
ipcMain.handle("execute-bash", async (event, command) => {
  debug("execute-bash called, command length:", command?.length);
  log("[IPC] execute-bash:", command?.substring(0, 100) + "...");

  return new Promise((resolve) => {
    exec(
      command,
      {
        cwd: app.getPath("home"),
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60_000,
      },
      (error, stdout, stderr) => {
        if (error) {
          debug("execute-bash ERROR:", error.message);
          let msg = "ОШИБКА:\n";
          msg += error.message ? `${error.message}\n` : "";
          msg +=
            typeof error.code !== "undefined" ? `code: ${error.code}\n` : "";
          if (stderr) msg += `stderr:\n${stderr}`;
          msg =
            msg.length > 50_000
              ? msg.slice(0, 50_000) + "\n...[truncated]"
              : msg;
          resolve(msg);
        } else {
          debug("execute-bash OK, output length:", stdout?.length);
          let out = stdout || "Выполнено успешно (нет вывода)";
          out =
            out.length > 50_000
              ? out.slice(0, 50_000) + "\n...[truncated]"
              : out;
          resolve(out);
        }
      },
    );
  });
});

// IPC: toggle always-on-top
ipcMain.handle("set-always-on-top", (event, flag) => {
  debug("set-always-on-top:", flag);
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.setAlwaysOnTop(Boolean(flag), "screen-saver", 1);
});

// IPC: toggle fullscreen
ipcMain.handle("set-fullscreen", (event, flag) => {
  debug("set-fullscreen:", flag);
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.setFullScreen(Boolean(flag));
});

// IPC: get platform info
ipcMain.handle("get-platform", () => {
  debug("get-platform called");
  return {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    electron: process.versions.electron,
  };
});

// Helper: make HTTP request
function httpRequest(options, postData, timeout = 15000) {
  return new Promise((resolve) => {
    const transport = options.port === 443 ? https : http;
    const req = transport.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", () => resolve(null));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve(null);
    });
    if (postData) req.write(postData);
    req.end();
  });
}

// IPC: comet-report-error — tries Comet first, then Ollama
ipcMain.handle("comet-report-error", async (event, payload) => {
  const { title, code, log } = payload;
  debug("comet-report-error:", title);

  // 1. Try Comet/Opik server (if configured via COMET_ENDPOINT)
  const cometEndpoint =
    process.env.COMET_ENDPOINT || "http://localhost:8080/api/fix";
  const cometApiKey = process.env.COMET_API_KEY || "";

  debug("Trying Comet:", cometEndpoint);

  try {
    const cometData = JSON.stringify({
      step_title: title,
      command: code,
      error_log: log,
    });

    const cometUrl = new URL(cometEndpoint);
    const cometOptions = {
      hostname: cometUrl.hostname,
      port: cometUrl.port || (cometUrl.protocol === "https:" ? 443 : 80),
      path: cometUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(cometData),
        ...(cometApiKey && { Authorization: `Bearer ${cometApiKey}` }),
      },
    };

    const cometResult = await httpRequest(cometOptions, cometData);
    if (cometResult && cometResult.status >= 200 && cometResult.status < 300) {
      debug("Comet response:", cometResult.status);
      try {
        const parsed = JSON.parse(cometResult.data);
        return (
          parsed.fix ||
          parsed.solution ||
          parsed.recommendation ||
          parsed.response ||
          cometResult.data
        );
      } catch {
        return cometResult.data;
      }
    }
  } catch (e) {
    debug("Comet error:", e.message);
  }

  // 2. Fallback: Try Ollama locally
  debug("Trying Ollama...");
  try {
    const ollamaPrompt = `Ты — эксперт по macOS и Homebrew. Шаг "${title}" завершился с ошибкой.

Команда:
${code}

Лог ошибки:
${log}

Предложи краткое решение (2-3 предложения) как исправить эту ошибку на macOS M1.`;

    const ollamaData = JSON.stringify({
      model: "llama3.2",
      prompt: ollamaPrompt,
      stream: false,
    });

    const ollamaOptions = {
      hostname: "localhost",
      port: 11434,
      path: "/api/generate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(ollamaData),
      },
    };

    const ollamaResult = await httpRequest(ollamaOptions, ollamaData, 20000);
    if (ollamaResult && ollamaResult.status === 200) {
      debug("Ollama response OK");
      const parsed = JSON.parse(ollamaResult.data);
      if (parsed.response) {
        return parsed.response;
      }
    }
  } catch (e) {
    debug("Ollama error:", e.message);
  }

  // 3. Final fallback
  debug("Using fallback message");
  return "Comet и Ollama недоступны. Проверьте Step 2 (Ollama) и нажмите 'Повторить'.";
});
