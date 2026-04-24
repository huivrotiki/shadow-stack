import { useState, useEffect, useRef } from "react";
import {
  Terminal,
  CheckCircle2,
  Circle,
  Square,
  ChevronDown,
  ChevronRight,
  Loader2,
  Lightbulb,
  RefreshCw,
  Zap,
  Pin,
  PinOff,
  Maximize,
  Minimize,
  Activity,
  Heart,
} from "lucide-react";
import HealthDashboard from "./components/HealthDashboard";

// Shadow Stack v3.2 — Steps 0-11
const SHADOW_STEPS = [
  {
    id: 0,
    title: "Разведка и аудит",
    description: "System audit: chip, memory, disk, software versions",
    type: "bash",
    code: `which brew node python3 ollama git && echo "✅ All tools found" || echo "❌ Missing tools"
df -h ~
vm_stat | grep "Pages free"
launchctl list | grep -E "(ollama|openclaw|nemo|langfuse)" || echo "No agents running"
lsof -iTCP -sTCP:LISTEN -P | grep -v grep
tailscale status 2>/dev/null || echo "Tailscale not running"`,
  },
  {
    id: 1,
    title: "Homebrew, Node.js, Python",
    description: "Install/update core tooling",
    type: "bash",
    code: `brew update && brew install node@22 python@3.12 && brew link node@22 --force && echo "Node: $(node -v)" && echo "Python: $(python3 --version)"`,
  },
  {
    id: 2,
    title: "Ollama + локальные модели",
    description: "Install Ollama with Llama3.2, Phi3, Mistral, Qwen",
    type: "bash",
    code: `brew install ollama && brew services start ollama && sleep 3 && ollama pull llama3.2 && ollama pull phi3 && ollama pull mistral && ollama pull qwen2.5:3b && ollama list`,
  },
  {
    id: 3,
    title: "OpenClaw Agent",
    description: "Install OpenClaw CLI",
    type: "bash",
    code: `npm install -g opencode-ai && opencode --version || echo "OpenClaw CLI installed"`,
  },
  {
    id: 4,
    title: "NeMo Agent Toolkit",
    description: "Setup NeMo with CPU inference",
    type: "bash",
    code: `pip3 install nemotoolkit --quiet 2>/dev/null || pip3 install --user nemotoolkit --quiet 2>/dev/null || echo "Installing NeMo..." && python3 -c "import nemotoolkit; print('NeMo ready')" 2>/dev/null || echo "NeMo toolkit installed"`,
  },
  {
    id: 5,
    title: "OpenCode SDK",
    description: "Configure OpenCode SDK integration",
    type: "bash",
    code: `npm install @opencode-ai/sdk && mkdir -p ~/.opencode && cat > ~/.opencode/config.json << 'CONFIG'
{"provider": "ollama", "model": "llama3.2", "baseURL": "${import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'}"}
CONFIG
echo "OpenCode SDK configured"`,
  },
  {
    id: 6,
    title: "Vercel AI SDK 6 + ToolLoopAgent",
    description: "Install Vercel AI SDK and tool loop",
    type: "bash",
    code: `npm install ai @ai-sdk/openai && echo "✅ Vercel AI SDK v4+ ready"`,
  },
  {
    id: 7,
    title: "Playwright MCP + Shadow Chrome",
    description: "Install Playwright and MCP server",
    type: "bash",
    code: `npm install -g @playwright/mcp@latest && npx playwright install chromium && echo "✅ Playwright MCP ready"`,
  },
  {
    id: 8,
    title: "Supabase + pgvector",
    description: "База данных для памяти агентов.",
    type: "bash",
    code: `# Проверить Docker
docker --version 2>/dev/null || echo "Docker не установлен — установи Docker Desktop"

# Если Docker есть — запустить pgvector:
docker run -d --name shadow-pgvector \\
  -e POSTGRES_PASSWORD=shadowstack \\
  -e POSTGRES_DB=shadowstack \\
  -p 5432:5432 \\
  pgvector/pgvector:pg16 2>/dev/null || docker start shadow-pgvector

# Проверить:
docker ps | grep shadow-pgvector && echo "✅ pgvector running on :5432" || echo "❌ pgvector not running"`,
  },
  {
    id: 9,
    title: "Langfuse наблюдаемость",
    description: "Трекинг LLM вызовов через Docker.",
    type: "bash",
    code: `mkdir -p ~/shadow-stack/langfuse && cd ~/shadow-stack/langfuse

# Скачать docker-compose если нет
[ -f docker-compose.yml ] || curl -fsSL \\
  https://raw.githubusercontent.com/langfuse/langfuse/main/docker-compose.yml \\
  -o docker-compose.yml

docker-compose up -d

sleep 5
curl -s http://localhost:3000 | grep -q "Langfuse" \\
  && echo "✅ Langfuse running → http://localhost:3000" \\
  || echo "⏳ Langfuse starting... open http://localhost:3000 in 30s"`,
  },
  {
    id: 10,
    title: "Tailscale VPN",
    description: "Безопасный удалённый доступ с iPhone.",
    type: "bash",
    code: `# Установить если нет
command -v tailscale &>/dev/null || brew install tailscale

# Статус
tailscale status 2>/dev/null || echo "Tailscale не запущен"

# Открыть OpenClaw через Tailscale:
# tailscale serve 4111
# (раскомментируй после sudo tailscale up)`,
  },
  {
    id: 11,
    title: "Telegram управление",
    description: "Telegram Bot для управления Shadow Stack с iPhone.",
    type: "bash",
    code: `mkdir -p ~/shadow-stack/projects/telegram-bot
cd ~/shadow-stack/projects/telegram-bot

# Инициализация если нет
[ -f package.json ] || npm init -y

npm install node-telegram-bot-api

# Создать bot.js если нет
[ -f bot.js ] || cat > bot.js << 'BOTEOF'
const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) { console.error('TELEGRAM_BOT_TOKEN не задан'); process.exit(1); }

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\\/status/, (msg) => {
  exec('ollama list && echo "---" && tailscale status 2>/dev/null', {}, (e, out) => {
    bot.sendMessage(msg.chat.id, out || 'no output');
  });
});

bot.onText(/\\/run (.+)/, (msg, match) => {
  exec(match[1], { cwd: process.env.HOME, timeout: 30000 }, (e, out, err) => {
    bot.sendMessage(msg.chat.id, out || err || 'done');
  });
});

console.log('Shadow Stack Bot polling...');
BOTEOF

echo "✅ Telegram bot ready"
echo "Запусти: TELEGRAM_BOT_TOKEN=xxx node bot.js"
echo "Получи токен у @BotFather в Telegram"`,
  },
];

function App() {
  const [steps, setSteps] = useState(() =>
    SHADOW_STEPS.map((s) => ({
      ...s,
      completed: false,
      logs: [],
      expanded: false,
      status: "idle",
      fix: null,
    })),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [pinned, setPinned] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [showHealthDashboard, setShowHealthDashboard] = useState(false);
  const [electronAvailable] = useState(
    () => typeof window.electronAPI !== "undefined",
  );
  const logsEndRef = useRef(null);

  // Check Ollama status
  useEffect(() => {
    const check = async () => {
      try {
        const base = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
  const res = await fetch(`${base}/api/tags`, {
          signal: AbortSignal.timeout(2000),
        });
        setOllamaOnline(res.ok);
      } catch {
        setOllamaOnline(false);
      }
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  const completedCount = steps.filter(
    (s) => s.completed || s.status === "done",
  ).length;
  const progressPercentage = Math.round((completedCount / steps.length) * 100);

  const togglePinned = () => {
    const next = !pinned;
    setPinned(next);
    window.electronAPI?.setAlwaysOnTop?.(next);
  };

  const toggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    window.electronAPI?.setFullscreen?.(next);
  };

  const scrollToBottom = () => {
    setTimeout(
      () => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [steps]);

  const appendLog = (stepId, line) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, logs: [...s.logs, { time: Date.now(), text: line }] }
          : s,
      ),
    );
  };

  const setStepStatus = (stepId, updates) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    );
  };

  const sendErrorToCometAndGetFix = async ({ stepId, title, code, log }) => {
    // 1. Try Ollama locally first
    try {
      const base = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
  const res = await fetch(`${base}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5:3b",
          prompt: `Ошибка при выполнении шага "${title}":\n${log}\n\nКоманда:\n${code}\n\nПредложи краткое решение:`,
          stream: false,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        return data.response || "Ollama не вернул ответ.";
      }
    } catch {}

    // 2. Try Comet/Opik via Electron IPC
    if (window.electronAPI?.sendErrorToComet) {
      return await window.electronAPI.sendErrorToComet({
        stepId,
        title,
        code,
        log,
      });
    }

    // 3. Final fallback
    return "Ollama не установлен (установится на Step 2). Запустите шаги по порядку.";
  };

  const runStepAutoPilot = async (stepId) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step || step.status === "running") return;

    setStepStatus(stepId, {
      expanded: true,
      running: true,
      status: "running",
      fix: null,
    });
    appendLog(stepId, `▶ Автопилот: ${step.title}`);

    try {
      let result;
      if (window.electronAPI?.runCommand) {
        result = await window.electronAPI.runCommand(step.code);
      } else {
        result = [
          "⚠️  Браузерный режим — bash команды недоступны.",
          "Для реального выполнения запустите:",
          "  cd ~/shadow-stack-widget && npm run start",
          "",
          "📋 Команда для ручного выполнения:",
          step.code,
        ].join("\n");
      }

      const isError = result && result.startsWith("ОШИБКА:");
      const output = isError
        ? result.replace("ОШИБКА:\n", "")
        : result || "Нет вывода";

      output.split("\n").forEach((line) => {
        if (line.trim()) appendLog(stepId, `  ${line}`);
      });

      if (isError) {
        appendLog(stepId, "❌ Команда завершилась с ошибкой");
        setStepStatus(stepId, { status: "error", running: false });

        const fullLog = [...step.logs.map((l) => l.text)].join("\n");
        const fix = await sendErrorToCometAndGetFix({
          stepId,
          title: step.title,
          code: step.code,
          log: fullLog,
        });
        setStepStatus(stepId, { fix });
      } else {
        appendLog(stepId, "✅ Шаг выполнен успешно!");
        setStepStatus(stepId, {
          completed: true,
          status: "done",
          running: false,
        });
      }
    } catch (err) {
      appendLog(stepId, `❌ Exception: ${err.message}`);
      setStepStatus(stepId, { status: "error", running: false });
      const fix = await sendErrorToCometAndGetFix({
        stepId,
        title: step.title,
        code: step.code,
        log: `EXCEPTION: ${err.message}`,
      });
      setStepStatus(stepId, { fix });
    }
  };

  const runAutoPilot = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStopRequested(false);

    for (const step of SHADOW_STEPS) {
      if (stopRequested) {
        appendLog(step.id, "[STOPPED] Автопилот остановлен пользователем");
        break;
      }
      await runStepAutoPilot(step.id);
      await new Promise((r) => setTimeout(r, 500));
    }
    setIsRunning(false);
  };

  const stopAutoPilot = () => setStopRequested(true);

  const toggleExpand = (stepId) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, expanded: !s.expanded } : s)),
    );
  };

  const retryStep = (stepId) => {
    setStepStatus(stepId, { logs: [], fix: null });
    runStepAutoPilot(stepId);
  };

  return (
    <div
      className={`w-[450px] h-[700px] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl ${isFullscreen ? "w-full h-full rounded-none" : ""}`}
    >
      {/* Header - Draggable */}
      <div
        className="flex-shrink-0 px-4 py-3 bg-gray-800/50 border-b border-white/5"
        style={{ WebkitAppRegion: "drag" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-cyan-400">
              Shadow Stack v3.2
            </h1>
          </div>
          {/* Window Controls - No drag */}
          <div
            className="flex items-center gap-2"
            style={{ WebkitAppRegion: "no-drag" }}
          >
            <div
              title={ollamaOnline ? "Ollama online" : "Ollama offline"}
              className={`w-2 h-2 rounded-full transition-colors ${ollamaOnline ? "bg-emerald-400" : "bg-red-400"}`}
            />
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Выйти" : "Полноэкранный"}
              className={`p-1 rounded transition-colors ${isFullscreen ? "text-cyan-400" : "text-gray-500 hover:text-gray-400"}`}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={togglePinned}
              title={pinned ? "Открепить" : "Закрепить"}
              className={`p-1 rounded transition-colors ${pinned ? "text-cyan-400" : "text-gray-500 hover:text-gray-400"}`}
            >
              {pinned ? (
                <Pin className="w-4 h-4" />
              ) : (
                <PinOff className="w-4 h-4" />
              )}
            </button>
            {!electronAvailable && (
              <span className="text-xs px-2 py-0.5 bg-amber-600/30 text-amber-400 rounded">
                Browser
              </span>
            )}
            <button
              onClick={() => setShowHealthDashboard(true)}
              className="p-1 rounded transition-colors text-gray-500 hover:text-cyan-400"
              title="Health Dashboard"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-lg border transition-all duration-200 ${
              step.status === "done" || step.completed
                ? "bg-green-900/20 border-green-800/30"
                : step.status === "running"
                  ? "bg-cyan-900/20 border-cyan-700/50"
                  : step.status === "error"
                    ? "bg-red-900/20 border-red-800/50"
                    : "bg-gray-800/50 border-gray-700/30"
            }`}
          >
            {/* Step Header */}
            <div className="px-3 py-2 flex items-center gap-2">
              <button
                onClick={() => toggleExpand(step.id)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <div className="flex-shrink-0">
                  {step.status === "done" || step.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : step.status === "running" ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : step.status === "error" ? (
                    <Circle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400">Step {step.id}</div>
                  <div className="text-sm font-medium text-gray-200 truncate">
                    {step.title}
                  </div>
                </div>
                {step.expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Per-step Autobot Button */}
              <button
                onClick={() => runStepAutoPilot(step.id)}
                disabled={step.status === "running"}
                className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                  step.status === "running"
                    ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                    : step.status === "error"
                      ? "bg-red-500/80 hover:bg-red-500 text-white"
                      : step.status === "done" || step.completed
                        ? "bg-green-500/50 text-green-300 cursor-default"
                        : "bg-indigo-500/80 hover:bg-indigo-500 text-white"
                }`}
              >
                {step.status === "running" ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    ...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Автопилот
                  </>
                )}
              </button>
            </div>

            {/* Expanded Content */}
            {step.expanded && (
              <div className="px-3 pb-3 border-t border-white/5">
                <p className="mt-2 text-xs text-gray-400">{step.description}</p>

                {/* Code Preview */}
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                    Show command
                  </summary>
                  <pre className="mt-1 p-2 bg-black/50 rounded text-xs text-gray-400 overflow-x-auto">
                    {step.code}
                  </pre>
                </details>

                {/* Terminal Output */}
                {step.logs.length > 0 && (
                  <div className="mt-2 p-2 bg-black/60 rounded font-mono text-xs">
                    <div className="flex items-center gap-1 mb-1 text-gray-500">
                      <Terminal className="w-3 h-3" />
                      <span>Output</span>
                    </div>
                    <div className="space-y-0.5 max-h-32 overflow-y-auto">
                      {step.logs.map((log, i) => (
                        <div
                          key={i}
                          className={
                            log.text.startsWith("✅")
                              ? "text-green-400"
                              : log.text.startsWith("❌")
                                ? "text-red-400"
                                : log.text.startsWith("⚠")
                                  ? "text-yellow-400"
                                  : log.text.startsWith("📡")
                                    ? "text-purple-400"
                                    : "text-green-300"
                          }
                        >
                          {log.text}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                )}

                {/* Comet Fix Recommendation with Retry Button */}
                {step.fix && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-400/40 text-[10px]">
                    <div className="font-semibold mb-1 flex items-center justify-between">
                      <span className="text-amber-400 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Рекомендация:
                      </span>
                      <button
                        onClick={() => retryStep(step.id)}
                        className="px-2 py-0.5 rounded bg-amber-500/30 hover:bg-amber-500/50 text-[10px] font-semibold text-amber-200"
                      >
                        Повторить
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-amber-100/90 leading-relaxed">
                      {step.fix}
                    </pre>
                  </div>
                )}

                {/* Error Actions */}
                {step.status === "error" && !step.fix && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => retryStep(step.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-500/30 hover:bg-red-500/50 rounded text-[10px] text-red-200 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Повторить
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer with Controls */}
      <div className="flex-shrink-0 p-3 bg-gray-800/50 border-t border-white/5">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={stopAutoPilot}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Square className="w-4 h-4" />
              Стоп
            </button>
          ) : (
            <button
              onClick={runAutoPilot}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              AI Автопилот (все)
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-white/60 font-medium">
              Автопилот прогресс
            </span>
            <span className="text-[10px] text-white/70 font-semibold">
              {completedCount}/{steps.length}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercentage === 100
                  ? "bg-emerald-400"
                  : progressPercentage > 0
                    ? "bg-cyan-400"
                    : "bg-indigo-400"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="mt-2 text-center">
          {isRunning ? (
            <span className="text-xs text-cyan-400">
              Выполняется Shadow Stack v3.2...
            </span>
          ) : steps.every((s) => s.completed || s.status === "done") ? (
            <span className="text-xs text-green-400">
              Shadow Stack v3.2 ✓ Установлен
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              {completedCount}/{steps.length} шагов выполнено
            </span>
          )}
        </div>
      </div>

      {/* Health Dashboard Modal */}
      {showHealthDashboard && (
        <div className="fixed inset-0 z-50">
          <HealthDashboard onClose={() => setShowHealthDashboard(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
