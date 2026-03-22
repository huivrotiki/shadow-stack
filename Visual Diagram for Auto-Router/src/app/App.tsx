import { useState } from "react";
import {
  Send,
  Zap,
  GitBranch,
  Server,
  Globe,
  Code,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Circle,
  Cpu,
  Cloud,
  Monitor,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowDown,
  Activity,
  Database,
  Layers,
  Workflow,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Package,
  Wifi,
  MemoryStick,
  TriangleAlert,
  BookOpen,
  Settings,
  Play,
  ChevronRight,
  Flame,
  Box,
  Lock,
  RefreshCw,
  Radio,
  Bot,
  Braces,
  PlugZap,
  Map,
  ListTodo,
  BarChart3,
} from "lucide-react";

const TABS = [
  { id: "architecture", label: "Архитектура", icon: GitBranch },
  { id: "mindmap", label: "Карта системы", icon: Map },
  { id: "router", label: "Авто-роутер", icon: Zap },
  { id: "phases", label: "Фазы / Задачи", icon: ListTodo },
  { id: "setup", label: "Установка", icon: Terminal },
  {
    id: "statemachine",
    label: "State Machine",
    icon: Activity,
  },
  { id: "ram", label: "RAM & Риски", icon: BarChart3 },
  { id: "integrations", label: "Интеграции", icon: PlugZap },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("architecture");

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Top bar */}
      <div className="border-b border-slate-800 bg-[#0d1424]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  Shadow Stack
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300">
                  v3.2
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/30 border border-green-500/40 text-green-300">
                  Mac M1 · 8GB
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-LLM Auto-Router · Go-live 2026-04-05
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {activeTab === "architecture" && (
          <ArchitectureDiagram />
        )}
        {activeTab === "mindmap" && <MindMapDiagram />}
        {activeTab === "router" && <RouterDiagram />}
        {activeTab === "phases" && <PhasesDiagram />}
        {activeTab === "setup" && <SetupGuide />}
        {activeTab === "statemachine" && (
          <StateMachineDiagram />
        )}
        {activeTab === "ram" && <RamAndRisks />}
        {activeTab === "integrations" && (
          <IntegrationsDiagram />
        )}
      </div>
    </div>
  );
}

/* ─── ARCHITECTURE ──────────────────────────────────────────── */
function ArchitectureDiagram() {
  const planes = [
    {
      name: "Control Plane",
      color: "blue",
      icon: MessageSquare,
      desc: "Команды, аппрув, мониторинг",
      components: ["Telegram Bot", "ZeroClaw", "owpenbot"],
      bg: "from-blue-900/40 to-blue-800/20",
      border: "border-blue-500/40",
      badge: "bg-blue-600/30 text-blue-300 border-blue-500/40",
    },
    {
      name: "Execution Plane",
      color: "green",
      icon: Code,
      desc: "Кодинг, тесты, деплой",
      components: ["Antigravity", "OpenCode", "Vercel CLI"],
      bg: "from-green-900/40 to-green-800/20",
      border: "border-green-500/40",
      badge:
        "bg-green-600/30 text-green-300 border-green-500/40",
    },
    {
      name: "Intelligence Plane",
      color: "purple",
      icon: Cpu,
      desc: "Роутинг, локальный + облачный инференс",
      components: [
        "Ollama",
        "NadirClaw",
        "Claude",
        "OpenRouter",
      ],
      bg: "from-purple-900/40 to-purple-800/20",
      border: "border-purple-500/40",
      badge:
        "bg-purple-600/30 text-purple-300 border-purple-500/40",
    },
    {
      name: "Browser Plane",
      color: "orange",
      icon: Monitor,
      desc: "Обход платных API через браузер",
      components: ["Playwright MCP", "n8n", "Puppeteer"],
      bg: "from-orange-900/40 to-orange-800/20",
      border: "border-orange-500/40",
      badge:
        "bg-orange-600/30 text-orange-300 border-orange-500/40",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero flow */}
      <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-6 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <Server className="w-5 h-5 text-blue-400" />
          Общий поток запроса
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-3 overflow-x-auto pb-2">
          {[
            {
              label: "Пользователь",
              sub: "Telegram / API / UI",
              icon: Send,
              color: "from-blue-600 to-blue-700",
              badge: "/grok /claude /ask",
            },
            {
              label: "ZeroClaw",
              sub: "Dispatcher + Parser",
              icon: Zap,
              color: "from-purple-600 to-purple-700",
              badge: "Command routing",
            },
            {
              label: "Классификатор",
              sub: "Qwen3B · 10ms",
              icon: GitBranch,
              color: "from-cyan-600 to-cyan-700",
              badge: "local/smart/code/browser",
            },
            {
              label: "LLM Provider",
              sub: "Выбранный движок",
              icon: Cpu,
              color: "from-green-600 to-green-700",
              badge: "Ollama / Cloud / Browser",
            },
            {
              label: "Ответ",
              sub: "Vercel AI SDK stream",
              icon: Sparkles,
              color: "from-emerald-600 to-emerald-700",
              badge: "Streaming SSE",
            },
          ].map((node, i, arr) => (
            <div
              key={i}
              className="flex items-center gap-3 flex-shrink-0"
            >
              <div
                className={`bg-gradient-to-br ${node.color} rounded-xl p-4 text-center w-40`}
              >
                <node.icon className="w-6 h-6 mx-auto mb-2" />
                <div className="font-bold text-sm">
                  {node.label}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {node.sub}
                </div>
                <div className="mt-2 text-xs bg-black/20 rounded px-2 py-1 text-white/80">
                  {node.badge}
                </div>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4 Planes */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <Layers className="w-5 h-5 text-cyan-400" />
          Архитектурные слои
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planes.map((plane, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${plane.bg} rounded-xl p-5 border ${plane.border}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center border ${plane.badge}`}
                >
                  <plane.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white">
                    {plane.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {plane.desc}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {plane.components.map((c) => (
                  <span
                    key={c}
                    className={`text-xs px-2.5 py-1 rounded-full border ${plane.badge}`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack pills */}
      <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/60">
        <h3 className="font-bold mb-4 text-slate-300">
          Технологический стек
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Runtime",
              value: "Node 22 ESM",
              color: "text-green-400",
            },
            {
              label: "Validation",
              value: "Zod",
              color: "text-blue-400",
            },
            {
              label: "Streaming",
              value: "Vercel AI SDK",
              color: "text-purple-400",
            },
            {
              label: "Logging",
              value: "Winston + SSE",
              color: "text-cyan-400",
            },
            {
              label: "Secrets",
              value: "Doppler",
              color: "text-yellow-400",
            },
            {
              label: "Proxy",
              value: "LiteLLM / ngrok",
              color: "text-orange-400",
            },
            {
              label: "CI/CD",
              value: "GitHub Actions",
              color: "text-pink-400",
            },
            {
              label: "Deploy",
              value: "Vercel",
              color: "text-indigo-400",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-slate-800/50 rounded-lg p-3"
            >
              <div
                className={`text-xs mb-0.5 ${item.color} font-semibold`}
              >
                {item.label}
              </div>
              <div className="text-sm text-white">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MIND MAP ──────────────────────────────────────────────── */
function MindMapDiagram() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const branches = [
    {
      id: "models",
      label: "Модели и Движки",
      color: "from-blue-600 to-blue-700",
      border: "border-blue-500/50",
      icon: Cpu,
      items: [
        "Ollama qwen2.5-coder:3b — ~2.0 ГБ (код)",
        "Ollama qwen2.5:7b — ~4.7 ГБ (анализ)",
        "Ollama phi3.5:mini — ~2.2 ГБ (резерв)",
        "OpenRouter qwen/qwen3-235b:free",
        "Claude Sonnet 3.5 (платно, /premium)",
        "Gemini через браузер (n8n + Playwright)",
      ],
    },
    {
      id: "tools",
      label: "Инструменты разработки",
      color: "from-purple-600 to-purple-700",
      border: "border-purple-500/50",
      icon: Code,
      items: [
        "OpenCode + oh-my-opencode",
        "opencode-vibeguard (скрытие секретов)",
        "opencode-pty (интерактивный shell)",
        "opencode-dynamic-context-pruning",
        "opencode-supermemory",
        "opencode-scheduler (launchd)",
      ],
    },
    {
      id: "browser",
      label: "Браузерная автоматизация",
      color: "from-orange-600 to-orange-700",
      border: "border-orange-500/50",
      icon: Monitor,
      items: [
        "Playwright MCP",
        "n8n workflows (localhost:5678)",
        "Puppeteer fallback",
        "gemini.google.com (залогинен)",
        "claude.ai (браузер)",
        "Webhook POST /webhook/llm",
      ],
    },
    {
      id: "security",
      label: "Безопасность и Доверие",
      color: "from-red-600 to-red-700",
      border: "border-red-500/50",
      icon: Lock,
      items: [
        "Doppler → Vercel secrets",
        "scripts/secrets-scanner.sh",
        "Только прямые API-ключи (не OAuth)",
        ".env validation при старте",
        "allow_from = [@your_username]",
        "try/on error + retry 3×",
      ],
    },
    {
      id: "macos",
      label: "Практическая реализация",
      color: "from-green-600 to-green-700",
      border: "border-green-500/50",
      icon: Settings,
      items: [
        "shadow-start.sh — мастер-запуск",
        'Apple Shortcut "Shadow Start" → Dock',
        "Automator shadow-deploy.workflow",
        "macos-automator-mcp → ZeroClaw",
        "ngrok → Cloudflare Tunnel",
        "Supabase логи задач + статусы",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
          <Map className="w-5 h-5 text-cyan-400" />
          Экосистема Shadow Stack v3.2 (2025–2026)
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          Кликни на ветку чтобы раскрыть детали
        </p>

        {/* Central node */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-4 text-center shadow-xl mb-8">
            <Flame className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
            <div className="font-bold text-lg text-white">
              Shadow Stack v3.2
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Mac M1 · 8GB · No Docker
            </div>
          </div>

          {/* Branches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {branches.map((branch) => (
              <div key={branch.id}>
                <button
                  onClick={() =>
                    setExpanded(
                      expanded === branch.id ? null : branch.id,
                    )
                  }
                  className={`w-full bg-gradient-to-br ${branch.color} rounded-xl p-4 border ${branch.border} text-left transition-all hover:scale-105 shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <branch.icon className="w-5 h-5" />
                      <span className="font-semibold text-sm">
                        {branch.label}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${expanded === branch.id ? "rotate-90" : ""}`}
                    />
                  </div>
                </button>
                {expanded === branch.id && (
                  <div
                    className={`mt-2 bg-slate-900/80 rounded-xl p-4 border ${branch.border} space-y-1.5`}
                  >
                    {branch.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-300"
                      >
                        <ChevronRight className="w-3 h-3 mt-1 text-slate-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System prompt block */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-cyan-500/30">
        <h3 className="font-bold mb-4 text-cyan-400 flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Системный промт для Claude (скопировать целиком)
        </h3>
        <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-green-300 space-y-1 overflow-x-auto">
          <div className="text-slate-500">
            {"// Ты архитектор Shadow Stack v3.2 на Mac M1 8ГБ"}
          </div>
          <div>
            Репо:{" "}
            <span className="text-cyan-400">
              github.com/huivrotiki/shadow-stack-widget-1
            </span>
          </div>
          <div>
            Go-live:{" "}
            <span className="text-yellow-400">2026-04-05</span>{" "}
            · Priority:{" "}
            <span className="text-red-400">CRITICAL</span>
          </div>
          <div className="mt-2 text-slate-400">
            MCP СЕРВЕРЫ:
          </div>
          {[
            "filesystem",
            "github",
            "vercel",
            "supabase",
            "macos-automator",
          ].map((s) => (
            <div key={s} className="pl-4">
              - <span className="text-purple-400">{s}</span>
            </div>
          ))}
          <div className="mt-2 text-slate-400">
            СКИЛЫ (по порядку):
          </div>
          {[
            "shadow-stack-orchestrator → RALPH Loop",
            "auto-router → routing rules",
            "telegram-webhook → owpenbot",
            "vercel-deploy → zero-code pipeline",
            "observability → SSE logs + retry",
          ].map((s, i) => (
            <div key={i} className="pl-4">
              <span className="text-yellow-400">{i + 1}.</span>{" "}
              {s}
            </div>
          ))}
          <div className="mt-2 text-slate-400">
            ОГРАНИЧЕНИЯ: Без Docker · Free-first · ESM · Node 22
            · Zod
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ROUTER DIAGRAM ────────────────────────────────────────── */
function RouterDiagram() {
  const routes = [
    {
      trigger: "< 80 символов / простой",
      provider: "Ollama qwen2.5-coder:3b",
      model: "local",
      cost: "0$ · локально",
      color: "green",
      latency: "~200ms",
    },
    {
      trigger: "Анализ / длинный контекст",
      provider: "Ollama qwen2.5:7b",
      model: "smart",
      cost: "0$ · локально",
      color: "emerald",
      latency: "~800ms",
    },
    {
      trigger: "Лимит / очень сложный",
      provider: "n8n → Gemini / Claude.ai",
      model: "browser",
      cost: "0$ · браузер",
      color: "orange",
      latency: "~5s",
    },
    {
      trigger: "Облачная обработка",
      provider: "OpenRouter qwen/DeepSeek",
      model: "cloud_free",
      cost: "0$ · cloud free",
      color: "blue",
      latency: "~2s",
    },
    {
      trigger: "/deploy",
      provider: "Vercel CLI",
      model: "deploy",
      cost: "авто",
      color: "purple",
      latency: "~30s",
    },
    {
      trigger: "/premium или /claude",
      provider: "Claude Sonnet 3.5",
      model: "premium",
      cost: "платно · по запросу",
      color: "yellow",
      latency: "~3s",
    },
    {
      trigger: "429 / 5xx ошибка",
      provider: "Fallback cascade",
      model: "fallback",
      cost: "авто",
      color: "red",
      latency: "retry ×3",
    },
  ];

  const colorMap: Record<string, string> = {
    green: "bg-green-900/30 border-green-500/50 text-green-300",
    emerald:
      "bg-emerald-900/30 border-emerald-500/50 text-emerald-300",
    orange:
      "bg-orange-900/30 border-orange-500/50 text-orange-300",
    blue: "bg-blue-900/30 border-blue-500/50 text-blue-300",
    purple:
      "bg-purple-900/30 border-purple-500/50 text-purple-300",
    yellow:
      "bg-yellow-900/30 border-yellow-500/50 text-yellow-300",
    red: "bg-red-900/30 border-red-500/50 text-red-300",
  };

  return (
    <div className="space-y-6">
      {/* Visual scheme */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Схема авто-роутера
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Запрос → ZeroClaw → Классификатор (Qwen3B, 10ms) →
          Провайдер
        </p>

        <div className="bg-slate-950 rounded-xl p-5 font-mono text-sm space-y-2 border border-slate-800">
          <div className="text-slate-400">
            {"// classifyRequest(text: string): Route"}
          </div>
          {[
            [
              'text.startsWith("/deploy")',
              '"deploy"',
              "text-purple-400",
            ],
            [
              'text.startsWith("/premium")',
              '"premium"',
              "text-yellow-400",
            ],
            [
              'text.startsWith("/code")',
              '"code"',
              "text-cyan-400",
            ],
            ["text.length < 80", '"local"', "text-green-400"],
            [
              'LLM eval → "browser"',
              '"browser"',
              "text-orange-400",
            ],
            [
              'LLM eval → "smart"',
              '"smart"',
              "text-emerald-400",
            ],
            ["default", '"local"', "text-green-400"],
          ].map(([cond, result, cls], i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-slate-500 w-4 text-right">
                {i + 1}
              </span>
              <span className="text-blue-300">if</span>
              <span className="text-white">({cond})</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className={cls}>{result}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decision matrix */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h3 className="font-bold mb-4 text-white">
          Decision Matrix
        </h3>
        <div className="space-y-2">
          {routes.map((r, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 border flex flex-col sm:flex-row sm:items-center gap-3 ${colorMap[r.color]}`}
            >
              <div className="flex-1">
                <div className="text-xs text-white/50 mb-0.5">
                  Условие
                </div>
                <div className="font-semibold text-sm text-white">
                  {r.trigger}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-50 hidden sm:block" />
              <div className="flex-1">
                <div className="text-xs text-white/50 mb-0.5">
                  Провайдер
                </div>
                <div className="font-semibold text-sm text-white">
                  {r.provider}
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <div className="text-white/50 mb-0.5">
                    Стоимость
                  </div>
                  <div>{r.cost}</div>
                </div>
                <div>
                  <div className="text-white/50 mb-0.5">
                    Latency
                  </div>
                  <div>{r.latency}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fallback cascade */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h3 className="font-bold mb-5 text-white flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-orange-400" />
          Fallback Cascade (при ошибках)
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {[
            {
              n: "1",
              label: "Ollama local",
              sub: "retry ×3 + backoff",
              color: "bg-green-700",
            },
            {
              n: "2",
              label: "OpenRouter",
              sub: "free tier cloud",
              color: "bg-blue-700",
            },
            {
              n: "3",
              label: "n8n → Browser",
              sub: "Gemini / Claude.ai",
              color: "bg-orange-700",
            },
            {
              n: "4",
              label: "Claude API",
              sub: "платно · последний резерв",
              color: "bg-yellow-700",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 flex-shrink-0"
            >
              <div
                className={`${s.color} rounded-xl p-4 text-center w-36`}
              >
                <div className="text-2xl font-bold">{s.n}</div>
                <div className="font-semibold text-sm mt-1">
                  {s.label}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {s.sub}
                </div>
              </div>
              {i < 3 && (
                <ArrowRight className="w-5 h-5 text-slate-500" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 font-mono">
          429/5xx → fallback cascade автоматически ·
          zeroclaw.toml provider chain
        </div>
      </div>

      {/* auto-router.ts code */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h3 className="font-bold mb-4 text-white flex items-center gap-2">
          <Braces className="w-4 h-4 text-cyan-400" />
          server/router/auto-router.ts
        </h3>
        <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs text-green-300 font-mono leading-relaxed">{`import { generateText } from "ai"
import { createOllama } from "ollama-ai-provider"

const ollama = createOllama({ baseURL: "http://localhost:11434/api" })
type Route = "local" | "smart" | "code" | "browser" | "deploy" | "premium"

export async function classifyRequest(text: string): Promise<Route> {
  if (text.startsWith("/deploy"))  return "deploy"
  if (text.startsWith("/premium")) return "premium"
  if (text.startsWith("/code"))    return "code"
  if (text.length < 80)            return "local"

  const { text: decision } = await generateText({
    model: ollama("qwen2.5-coder:3b"),
    prompt: \`Classify in one word (local/smart/code/browser/deploy):\\n"\${text}"\`,
    maxTokens: 5,
  })
  return (decision.trim().toLowerCase() as Route) || "local"
}

export async function routeRequest(msg: string): Promise<string> {
  const route = await classifyRequest(msg)
  switch (route) {
    case "local":   return callOllama("qwen2.5-coder:3b", msg)
    case "smart":   return callOllama("qwen2.5:7b", msg)
    case "code":    return callOllama("qwen2.5-coder:3b", msg)
    case "browser": return callN8nBrowser(msg)
    case "deploy":  return runVercelDeploy()
    case "premium": return callClaudeAPI(msg)
    default:        return callOllama("qwen2.5-coder:3b", msg)
  }
}`}</pre>
        </div>
      </div>
    </div>
  );
}

/* ─── PHASES ────────────────────────────────────────────────── */
function PhasesDiagram() {
  const [openPhase, setOpenPhase] = useState<number>(1);

  const phases = [
    {
      n: 1,
      title: "Авто-роутер + Telegram",
      time: "~3ч",
      status: "active",
      color: "green",
      tasks: [
        {
          id: "1.1",
          text: "server/router/auto-router.ts (State Machine)",
          done: false,
        },
        {
          id: "1.2",
          text: "SKILL.md — routing_rules",
          done: false,
        },
        {
          id: "1.3",
          text: "app/api/telegram-webhook/route.ts",
          done: false,
        },
        {
          id: "1.4",
          text: "scripts/secrets-scanner.sh",
          done: false,
        },
        { id: "1.5", text: "ngrok + setWebhook", done: false },
        {
          id: "1.6",
          text: 'commit: "feat: Shadow Auto-Router v1.0"',
          done: false,
        },
      ],
    },
    {
      n: 2,
      title: "CI/CD + macOS",
      time: "~2ч",
      status: "pending",
      color: "blue",
      tasks: [
        {
          id: "2.1",
          text: ".github/workflows/deploy.yml",
          done: false,
        },
        {
          id: "2.2",
          text: "Doppler → Vercel secrets",
          done: false,
        },
        {
          id: "2.3",
          text: "shadow-start.sh финальный",
          done: false,
        },
        {
          id: "2.4",
          text: "Automator shadow-deploy.workflow",
          done: false,
        },
        {
          id: "2.5",
          text: 'Apple Shortcut "Shadow Start" → Dock',
          done: false,
        },
        {
          id: "2.6",
          text: "macos-automator-mcp → ZeroClaw",
          done: false,
        },
      ],
    },
    {
      n: 3,
      title: "OpenCode плагины",
      time: "~1ч",
      status: "pending",
      color: "purple",
      tasks: [
        { id: "3.1", text: "oh-my-opencode", done: false },
        {
          id: "3.2",
          text: "opencode-vibeguard (скрытие секретов)",
          done: false,
        },
        {
          id: "3.3",
          text: "opencode-pty (интерактивный shell)",
          done: false,
        },
        {
          id: "3.4",
          text: "opencode-dynamic-context-pruning",
          done: false,
        },
        {
          id: "3.5",
          text: "opencode-supermemory",
          done: false,
        },
        {
          id: "3.6",
          text: "opencode-scheduler (launchd)",
          done: false,
        },
      ],
    },
    {
      n: 4,
      title: "Observability",
      time: "~2ч",
      status: "pending",
      color: "cyan",
      tasks: [
        {
          id: "4.1",
          text: "SSE endpoint /api/logs/stream",
          done: false,
        },
        {
          id: "4.2",
          text: "Retry (exponential backoff × 3)",
          done: false,
        },
        {
          id: "4.3",
          text: "try/on error в каждом AppleScript",
          done: false,
        },
        {
          id: "4.4",
          text: "/tmp/shadow-status.json → Telegram notify",
          done: false,
        },
        { id: "4.5", text: "Supabase логи задач", done: false },
      ],
    },
    {
      n: 5,
      title: "Docs + Lock-in",
      time: "~1ч",
      status: "pending",
      color: "orange",
      tasks: [
        { id: "5.1", text: "RUNBOOK.md", done: false },
        { id: "5.2", text: "AGENTS.md", done: false },
        { id: "5.3", text: "SKILL.md финал", done: false },
        { id: "5.4", text: "todo.md трекинг", done: false },
        { id: "5.5", text: "Extensibility test", done: false },
        {
          id: "5.6",
          text: "Vercel final deploy → production",
          done: false,
        },
      ],
    },
  ];

  const phaseColors: Record<string, Record<string, string>> = {
    green: {
      bg: "from-green-900/40 to-green-800/20",
      border: "border-green-500/50",
      badge: "bg-green-600",
      num: "bg-green-600",
      dot: "text-green-400",
    },
    blue: {
      bg: "from-blue-900/40 to-blue-800/20",
      border: "border-blue-500/50",
      badge: "bg-blue-600",
      num: "bg-blue-600",
      dot: "text-blue-400",
    },
    purple: {
      bg: "from-purple-900/40 to-purple-800/20",
      border: "border-purple-500/50",
      badge: "bg-purple-600",
      num: "bg-purple-600",
      dot: "text-purple-400",
    },
    cyan: {
      bg: "from-cyan-900/40 to-cyan-800/20",
      border: "border-cyan-500/50",
      badge: "bg-cyan-600",
      num: "bg-cyan-600",
      dot: "text-cyan-400",
    },
    orange: {
      bg: "from-orange-900/40 to-orange-800/20",
      border: "border-orange-500/50",
      badge: "bg-orange-600",
      num: "bg-orange-600",
      dot: "text-orange-400",
    },
  };

  return (
    <div className="space-y-4">
      {/* Timeline overview */}
      <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-green-400" />
          Phase 1→5 · Трекинг задач
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {phases.map((p) => {
            const c = phaseColors[p.color];
            return (
              <button
                key={p.n}
                onClick={() => setOpenPhase(p.n)}
                className={`flex-shrink-0 rounded-xl px-4 py-3 border transition-all text-left ${
                  openPhase === p.n
                    ? `bg-gradient-to-br ${c.bg} ${c.border} scale-105 shadow-lg`
                    : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full ${c.num} flex items-center justify-center font-bold text-sm mb-2`}
                >
                  {p.n}
                </div>
                <div className="font-semibold text-sm text-white">
                  {p.title}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {p.time}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active phase tasks */}
      {phases
        .filter((p) => p.n === openPhase)
        .map((phase) => {
          const c = phaseColors[phase.color];
          return (
            <div
              key={phase.n}
              className={`bg-gradient-to-br ${c.bg} rounded-2xl p-6 border ${c.border}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-10 h-10 rounded-full ${c.num} flex items-center justify-center font-bold text-lg`}
                >
                  {phase.n}
                </div>
                <div>
                  <div className="font-bold text-lg text-white">
                    Phase {phase.n}: {phase.title}
                  </div>
                  <div className="text-sm text-slate-400">
                    Оценка времени: {phase.time}
                  </div>
                </div>
                <div
                  className={`ml-auto text-xs px-3 py-1 rounded-full border ${c.border} ${phase.status === "active" ? "text-green-300" : "text-slate-400"}`}
                >
                  {phase.status === "active"
                    ? "🔥 В работе"
                    : "⏳ Pending"}
                </div>
              </div>
              <div className="space-y-2">
                {phase.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 bg-slate-900/40 rounded-lg px-4 py-3"
                  >
                    <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center flex-shrink-0">
                      {task.done ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-500 w-8">
                      {task.id}
                    </span>
                    <span className="text-sm text-slate-200">
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {/* Key files */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h3 className="font-bold mb-4 text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Ключевые файлы проекта
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              file: "server/router/auto-router.ts",
              desc: "Core State Machine",
              color: "border-green-500/40 text-green-400",
            },
            {
              file: "app/api/telegram-webhook/route.ts",
              desc: "Telegram Handler",
              color: "border-blue-500/40 text-blue-400",
            },
            {
              file: ".github/workflows/deploy.yml",
              desc: "CI/CD Pipeline",
              color: "border-purple-500/40 text-purple-400",
            },
            {
              file: "RUNBOOK.md",
              desc: "Operations Guide",
              color: "border-cyan-500/40 text-cyan-400",
            },
            {
              file: "SKILL.md",
              desc: "Routing Rules",
              color: "border-yellow-500/40 text-yellow-400",
            },
            {
              file: "AGENTS.md",
              desc: "Agent Definitions",
              color: "border-orange-500/40 text-orange-400",
            },
            {
              file: "todo.md",
              desc: "Task Tracking",
              color: "border-pink-500/40 text-pink-400",
            },
            {
              file: "shadow-start.sh",
              desc: "Master Start Script",
              color: "border-red-500/40 text-red-400",
            },
            {
              file: "~/.zeroclaw/config.toml",
              desc: "ZeroClaw Config",
              color: "border-indigo-500/40 text-indigo-400",
            },
          ].map((f) => (
            <div
              key={f.file}
              className={`bg-slate-800/40 rounded-lg p-3 border ${f.color.split(" ")[0]}`}
            >
              <div
                className={`text-xs font-mono font-bold mb-1 ${f.color.split(" ")[1]}`}
              >
                {f.file}
              </div>
              <div className="text-xs text-slate-400">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SETUP GUIDE ───────────────────────────────────────────── */
function SetupGuide() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      n: 1,
      title: "Установка базового ПО",
      icon: Package,
      color: "blue",
      code: `# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Rust (для ZeroClaw)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Основные инструменты
brew install ollama jq ngrok node
npm install -g bun vercel

# ZeroClaw
cargo install zeroclaw

# n8n (браузерный роутер)
npm install -g n8n

# LiteLLM
pip install litellm nadirclaw

# macOS Automator MCP
npm install -g @steipete/macos-automator-mcp`,
    },
    {
      n: 2,
      title: "Ollama + модели",
      icon: Cpu,
      color: "green",
      code: `ollama serve &

# Модели под 8ГБ RAM
ollama pull qwen2.5-coder:3b   # ~2.0 ГБ — код
ollama pull qwen2.5:7b         # ~4.7 ГБ — анализ/чат
ollama pull phi3.5:mini        # ~2.2 ГБ — быстрый резерв

# Проверка
curl http://localhost:11434/api/generate \\
  -d '{"model":"qwen2.5-coder:3b","prompt":"hello"}'

# ⚠️ ПРАВИЛО: никогда не грузить 14B+ — уйдёт в своп!`,
    },
    {
      n: 3,
      title: "ZeroClaw + Telegram",
      icon: MessageSquare,
      color: "purple",
      code: `# Onboard мастер
zeroclaw onboard channels-only

# Шаги в мастере:
# 1. Выбрать "telegram" → Enter
# 2. Вставить BOT_TOKEN из @BotFather → /newbot
# 3. Вставить Telegram ID (узнать у @userinfobot)
# 4. Конфиг сохранится в ~/.zeroclaw/config.toml`,
    },
    {
      n: 4,
      title: "zeroclaw config.toml",
      icon: Settings,
      color: "cyan",
      code: `[provider.local]               # БЕСПЛАТНО: Ollama (код)
type = "ollama"
base_url = "http://localhost:11434"
model = "qwen2.5-coder:3b"

[provider.smart]               # БЕСПЛАТНО: Ollama (анализ)
type = "ollama"
base_url = "http://localhost:11434"
model = "qwen2.5:7b"

[provider.cloud_free]          # БЕСПЛАТНО: OpenRouter
type = "openai_compatible"
base_url = "https://openrouter.ai/api/v1"
api_key = "sk-or-..."
model = "qwen/qwen3-235b:free"

[provider.browser]             # БЕСПЛАТНО: n8n → браузер
type = "http"
endpoint = "http://localhost:5678/webhook/llm"

[provider.claude_paid]         # ПЛАТНО: /premium
type = "anthropic"
api_key = "sk-ant-..."
model = "claude-3-5-sonnet-20241022"`,
    },
    {
      n: 5,
      title: "auto-router.ts",
      icon: GitBranch,
      color: "yellow",
      code: `# Создать файл:
# server/router/auto-router.ts

# Логика роутера:
# if /deploy  → Vercel CLI
# if /premium → Claude API
# if /code    → qwen2.5-coder:3b
# if < 80     → local (qwen3b)
# else        → LLM classify → route

# Запустить тесты:
bun test server/router/auto-router.test.ts`,
    },
    {
      n: 6,
      title: "Telegram Webhook",
      icon: Send,
      color: "indigo",
      code: `# app/api/telegram-webhook/route.ts
# POST handler:
# 1. Получить message из body
# 2. Вызвать routeRequest(text)
# 3. Отправить reply через Bot API

# Настроить webhook:
curl -s "https://api.telegram.org/bot\${TOKEN}/setWebhook?url=\${NGROK_URL}/api/telegram-webhook"`,
    },
    {
      n: 7,
      title: "n8n браузерный узел",
      icon: Globe,
      color: "orange",
      code: `# Запуск
n8n start &  # localhost:5678

# Workflow:
# [Webhook POST /webhook/llm]
#       ↓
# [Code: извлечь prompt]
#       ↓
# [Playwright:
#   → открыть gemini.google.com
#   → вставить prompt
#   → дождаться DOM ответа
#   → взять текст]
#       ↓
# [Respond: {"response": "..."}]`,
    },
    {
      n: 8,
      title: "Automator + Shortcuts",
      icon: Monitor,
      color: "pink",
      code: `# Automator pipeline (shadow-deploy.workflow):
# [Shell: git pull + npm build]
#       ↓
# [AppleScript: vercel deploy]
#       ↓
# [Shell: jq → /tmp/shadow-status.json]
#       ↓
# [Shell: Telegram notify]

# Apple Shortcut "Shadow Start":
# Shortcuts → Новый → Run Shell Script
# → bash ~/shadow-start.sh
# → Перетащить на Dock`,
    },
    {
      n: 9,
      title: "shadow-start.sh",
      icon: Play,
      color: "red",
      code: `#!/bin/bash
echo "🚀 Shadow Stack v3.2 starting..."

ollama serve &
sleep 2

litellm --model ollama/qwen2.5-coder:3b --port 4000 &
n8n start &
sleep 3

cd ~/shadow-stack-widget && npm run dev &
sleep 2

NGROK_URL=$(ngrok http 3000 --log=stdout &
  sleep 4
  curl -s localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

curl -s "https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/setWebhook?url=\${NGROK_URL}/api/telegram-webhook"

zeroclaw gateway start &

echo "✅ Стек запущен!"
echo "🌐 $NGROK_URL"`,
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "from-blue-600 to-blue-700",
    green: "from-green-600 to-green-700",
    purple: "from-purple-600 to-purple-700",
    cyan: "from-cyan-600 to-cyan-700",
    yellow: "from-yellow-600 to-yellow-700",
    indigo: "from-indigo-600 to-indigo-700",
    orange: "from-orange-600 to-orange-700",
    pink: "from-pink-600 to-pink-700",
    red: "from-red-600 to-red-700",
  };

  const step = steps.find((s) => s.n === activeStep)!;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-green-400" />
          Пошаговая установка (Шаги 1–9)
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {steps.map((s) => (
            <button
              key={s.n}
              onClick={() => setActiveStep(s.n)}
              className={`rounded-xl p-2 text-center transition-all ${
                activeStep === s.n
                  ? `bg-gradient-to-br ${colorMap[s.color]} scale-105 shadow-lg`
                  : "bg-slate-800/50 hover:bg-slate-700/50"
              }`}
            >
              <div className="font-bold text-sm">{s.n}</div>
              <div className="text-xs text-white/60 mt-0.5 leading-tight">
                {s.title.split(" ")[0]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {step && (
        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
          <div className="flex items-center gap-3 mb-5">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[step.color]} flex items-center justify-center`}
            >
              <step.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white">
                Шаг {step.n}: {step.title}
              </div>
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-5 overflow-x-auto">
            <pre className="text-xs text-green-300 font-mono leading-relaxed whitespace-pre-wrap">
              {step.code}
            </pre>
          </div>
          <div className="flex justify-between mt-4">
            <button
              onClick={() =>
                setActiveStep(Math.max(1, activeStep - 1))
              }
              disabled={activeStep === 1}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-sm transition-all"
            >
              ← Назад
            </button>
            <button
              onClick={() =>
                setActiveStep(Math.min(9, activeStep + 1))
              }
              disabled={activeStep === 9}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r ${colorMap[step.color]} hover:opacity-90 disabled:opacity-30 text-sm transition-all`}
            >
              Далее →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── STATE MACHINE ─────────────────────────────────────────── */
function StateMachineDiagram() {
  const [activeState, setActiveState] = useState("idle");

  const states: Record<
    string,
    {
      color: string;
      label: string;
      desc: string;
      next: string[];
    }
  > = {
    idle: {
      color: "slate",
      label: "Idle",
      desc: "Ожидание запроса",
      next: ["receiving"],
    },
    receiving: {
      color: "blue",
      label: "Receiving",
      desc: "Принятие ввода",
      next: ["validating"],
    },
    validating: {
      color: "purple",
      label: "Validating",
      desc: "Schema · Zod check",
      next: ["routing", "error"],
    },
    routing: {
      color: "cyan",
      label: "Routing",
      desc: "Выбор LLM провайдера",
      next: ["processing"],
    },
    processing: {
      color: "green",
      label: "Processing",
      desc: "LLM инференс",
      next: ["streaming", "error"],
    },
    streaming: {
      color: "emerald",
      label: "Streaming",
      desc: "Vercel AI SDK stream",
      next: ["completed"],
    },
    completed: {
      color: "teal",
      label: "Completed",
      desc: "Успех · лог в Supabase",
      next: ["idle"],
    },
    error: {
      color: "red",
      label: "Error",
      desc: "Retry × 3 → fallback",
      next: ["routing", "idle"],
    },
  };

  const colorMap: Record<
    string,
    { bg: string; border: string; text: string }
  > = {
    slate: {
      bg: "from-slate-600 to-slate-700",
      border: "border-slate-500",
      text: "text-slate-300",
    },
    blue: {
      bg: "from-blue-600 to-blue-700",
      border: "border-blue-500",
      text: "text-blue-300",
    },
    purple: {
      bg: "from-purple-600 to-purple-700",
      border: "border-purple-500",
      text: "text-purple-300",
    },
    cyan: {
      bg: "from-cyan-600 to-cyan-700",
      border: "border-cyan-500",
      text: "text-cyan-300",
    },
    green: {
      bg: "from-green-600 to-green-700",
      border: "border-green-500",
      text: "text-green-300",
    },
    emerald: {
      bg: "from-emerald-600 to-emerald-700",
      border: "border-emerald-500",
      text: "text-emerald-300",
    },
    teal: {
      bg: "from-teal-600 to-teal-700",
      border: "border-teal-500",
      text: "text-teal-300",
    },
    red: {
      bg: "from-red-600 to-red-700",
      border: "border-red-500",
      text: "text-red-300",
    },
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Auto-Router State Machine
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(states).map(([key, state]) => (
            <button
              key={key}
              onClick={() => setActiveState(key)}
              className={`bg-gradient-to-r ${colorMap[state.color].bg} rounded-xl p-4 border-2 transition-all ${
                activeState === key
                  ? `${colorMap[state.color].border} scale-105 shadow-lg`
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <div className="font-bold text-sm mb-1">
                {state.label}
              </div>
              <div className="text-xs text-white/60">
                {state.desc}
              </div>
              {activeState === key && (
                <Activity className="w-4 h-4 animate-pulse mx-auto mt-2" />
              )}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/70 rounded-xl p-4">
          <div className="font-bold mb-2 text-white">
            State:{" "}
            <span
              className={
                colorMap[states[activeState].color].text
              }
            >
              {states[activeState].label}
            </span>
          </div>
          <div className="text-sm text-slate-300 mb-3">
            {states[activeState].desc}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-slate-400">→</span>
            {states[activeState].next.map((ns) => (
              <button
                key={ns}
                onClick={() => setActiveState(ns)}
                className={`px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r ${colorMap[states[ns].color].bg} hover:scale-105 transition-transform`}
              >
                {states[ns].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
          <h3 className="font-bold mb-4 text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            State Data Structure
          </h3>
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs space-y-1 text-green-300">
            <div>{"{"}</div>
            <div className="pl-4">
              currentState:{" "}
              <span className="text-yellow-300">
                "{activeState}"
              </span>
              ,
            </div>
            <div className="pl-4">
              requestId:{" "}
              <span className="text-blue-300">"uuid-v4"</span>,
            </div>
            <div className="pl-4">
              provider:{" "}
              <span className="text-purple-300">
                null | string
              </span>
              ,
            </div>
            <div className="pl-4">
              retryCount:{" "}
              <span className="text-orange-300">number</span>,
            </div>
            <div className="pl-4">
              route:{" "}
              <span className="text-cyan-300">
                "local|smart|code|browser"
              </span>
              ,
            </div>
            <div className="pl-4">
              timestamp:{" "}
              <span className="text-pink-300">Date</span>,
            </div>
            <div className="pl-4">
              supabaseLog:{" "}
              <span className="text-slate-400">boolean</span>
            </div>
            <div>{"}"}</div>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
          <h3 className="font-bold mb-4 text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            State Lifecycle Actions
          </h3>
          <div className="space-y-2 text-sm">
            {[
              {
                name: "onEnter()",
                desc: "Initialize state resources",
                color: "text-blue-300",
              },
              {
                name: "onClassify()",
                desc: "Qwen3B → route decision (10ms)",
                color: "text-cyan-300",
              },
              {
                name: "onTransition()",
                desc: "Validate + emit stateChange",
                color: "text-purple-300",
              },
              {
                name: "onStream()",
                desc: "Vercel AI SDK streamText",
                color: "text-green-300",
              },
              {
                name: "onExit()",
                desc: "Cleanup + Supabase log",
                color: "text-emerald-300",
              },
              {
                name: "onError()",
                desc: "Retry × 3 → fallback cascade",
                color: "text-red-300",
              },
            ].map((a) => (
              <div
                key={a.name}
                className="bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-3"
              >
                <span
                  className={`font-mono font-semibold text-xs ${a.color}`}
                >
                  {a.name}
                </span>
                <span className="text-xs text-slate-400">
                  {a.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── RAM & RISKS ───────────────────────────────────────────── */
function RamAndRisks() {
  const ramItems = [
    {
      process: "ZeroClaw gateway",
      ram: "~5 МБ",
      pct: 0.06,
      color: "bg-blue-500",
    },
    {
      process: "Ollama + Qwen3B",
      ram: "~2.0 ГБ",
      pct: 25,
      color: "bg-green-500",
    },
    {
      process: "n8n",
      ram: "~150 МБ",
      pct: 1.9,
      color: "bg-orange-500",
    },
    {
      process: "Next.js owpenbot",
      ram: "~200 МБ",
      pct: 2.5,
      color: "bg-purple-500",
    },
    {
      process: "macOS + Safari",
      ram: "~2.5 ГБ",
      pct: 31,
      color: "bg-cyan-500",
    },
    {
      process: "Свободно",
      ram: "~3.0 ГБ",
      pct: 37.5,
      color: "bg-slate-600",
    },
  ];

  const risks = [
    {
      risk: "Antigravity OAuth → бан Gmail",
      fix: "Только прямые API-ключи или браузер-автоматизация",
      severity: "high",
    },
    {
      risk: "M1 8ГБ → SWAP при 14B моделях",
      fix: "Только 3B/7B, лимит контекста 8192 токенов",
      severity: "high",
    },
    {
      risk: "ngrok нестабилен",
      fix: "Cloudflare Tunnel (cloudflared tunnel)",
      severity: "medium",
    },
    {
      risk: "Telegram SIP /home/node",
      fix: "Редиректить в ~/.zeroclaw/telegram/",
      severity: "medium",
    },
    {
      risk: "Pipeline рвётся в Automator",
      fix: '"return input" в каждом AppleScript блоке',
      severity: "medium",
    },
    {
      risk: "Один файл роняет workflow",
      fix: "try/on error + retry 3× в каждом блоке",
      severity: "low",
    },
  ];

  const sevColor: Record<string, string> = {
    high: "bg-red-900/30 border-red-500/50 text-red-300",
    medium:
      "bg-yellow-900/30 border-yellow-500/50 text-yellow-300",
    low: "bg-slate-800/50 border-slate-600 text-slate-400",
  };

  const usedPct = ramItems
    .slice(0, 5)
    .reduce((a, b) => a + b.pct, 0);

  return (
    <div className="space-y-6">
      {/* RAM */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
          <MemoryStick className="w-5 h-5 text-green-400" />
          RAM на Mac M1 8ГБ
        </h2>

        {/* Bar chart */}
        <div className="flex h-8 rounded-full overflow-hidden mb-5 gap-0.5">
          {ramItems.slice(0, 5).map((item) => (
            <div
              key={item.process}
              className={`${item.color} transition-all`}
              style={{ width: `${item.pct}%` }}
              title={`${item.process}: ${item.ram}`}
            />
          ))}
          <div
            className="bg-slate-700 flex-1"
            title="Свободно"
          />
        </div>

        <div className="space-y-2">
          {ramItems.map((item) => (
            <div
              key={item.process}
              className="flex items-center gap-3"
            >
              <div
                className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`}
              />
              <div className="flex-1 text-sm text-slate-300">
                {item.process}
              </div>
              <div className="text-sm font-mono text-white">
                {item.ram}
              </div>
              <div className="w-32">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{
                      width: `${Math.min((item.pct / 40) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 bg-green-900/20 border border-green-500/30 rounded-lg px-4 py-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-300">
            Итого используется: ~5 ГБ / 8 ГБ ✅ Без своп
          </span>
        </div>
      </div>

      {/* Risks */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
          <TriangleAlert className="w-5 h-5 text-yellow-400" />
          Риски и фиксы
        </h2>
        <div className="space-y-3">
          {risks.map((r, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border ${sevColor[r.severity]}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`text-xs px-2 py-0.5 rounded-full border mt-0.5 flex-shrink-0 ${sevColor[r.severity]}`}
                >
                  {r.severity === "high"
                    ? "🔴 HIGH"
                    : r.severity === "medium"
                      ? "🟡 MED"
                      : "🟢 LOW"}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-white mb-1">
                    {r.risk}
                  </div>
                  <div className="text-xs text-slate-300">
                    → {r.fix}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/60">
        <h3 className="font-bold mb-4 text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Правила для M1
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: "🚫",
              title: "Запрещено",
              items: [
                "Модели 14B+",
                "Docker Desktop",
                "OAuth автоматизация",
                "Одновременно 7B + 3B",
              ],
            },
            {
              icon: "✅",
              title: "Разрешено",
              items: [
                "qwen2.5-coder:3b",
                "qwen2.5:7b",
                "phi3.5:mini",
                "Контекст ≤ 8192 токенов",
              ],
            },
            {
              icon: "⚡",
              title: "Оптимизация",
              items: [
                "Free-first routing",
                "Fallback cascade",
                "Browser вместо платных API",
                "Cloudflare вместо ngrok",
              ],
            },
          ].map((block) => (
            <div
              key={block.title}
              className="bg-slate-800/40 rounded-xl p-4"
            >
              <div className="font-semibold mb-3 text-white">
                {block.icon} {block.title}
              </div>
              {block.items.map((item) => (
                <div
                  key={item}
                  className="text-xs text-slate-300 flex items-center gap-2 mb-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── INTEGRATIONS ──────────────────────────────────────────── */
function IntegrationsDiagram() {
  return (
    <div className="space-y-6">
      {/* MCP Servers */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
          <PlugZap className="w-5 h-5 text-cyan-400" />
          MCP Серверы (подключить все)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: "filesystem",
              desc: "читай/пиши ~/shadow-stack-widget",
              icon: Database,
              color:
                "from-blue-900/50 to-blue-800/30 border-blue-500/40 text-blue-400",
            },
            {
              name: "github",
              desc: "PR, issues, commits",
              icon: GitBranch,
              color:
                "from-purple-900/50 to-purple-800/30 border-purple-500/40 text-purple-400",
            },
            {
              name: "vercel",
              desc: "preview deploy после каждой фичи",
              icon: Globe,
              color:
                "from-slate-800/50 to-slate-700/30 border-slate-500/40 text-slate-300",
            },
            {
              name: "supabase",
              desc: "логи задач, статусы фаз",
              icon: Database,
              color:
                "from-green-900/50 to-green-800/30 border-green-500/40 text-green-400",
            },
            {
              name: "macos-automator",
              desc: "AppleScript/Shell автоматизация",
              icon: Monitor,
              color:
                "from-orange-900/50 to-orange-800/30 border-orange-500/40 text-orange-400",
            },
          ].map((mcp) => (
            <div
              key={mcp.name}
              className={`bg-gradient-to-br ${mcp.color} rounded-xl p-4 border`}
            >
              <div className="flex items-center gap-2 mb-2">
                <mcp.icon
                  className={`w-5 h-5 ${mcp.color.split(" ")[3]}`}
                />
                <span className="font-bold font-mono text-white text-sm">
                  {mcp.name}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                {mcp.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          SKILL.md — Скилы (вызывать по порядку)
        </h2>
        <div className="space-y-3">
          {[
            {
              n: 1,
              skill: "shadow-stack-orchestrator",
              action: "RALPH Loop",
              desc: "Главный оркестратор: Run → Analyze → Learn → Plan → Harvest",
            },
            {
              n: 2,
              skill: "auto-router",
              action: "routing rules",
              desc: "Классификация запросов: local / smart / code / browser / deploy / premium",
            },
            {
              n: 3,
              skill: "telegram-webhook",
              action: "owpenbot handlers",
              desc: "POST /api/telegram-webhook → routeRequest → sendMessage",
            },
            {
              n: 4,
              skill: "vercel-deploy",
              action: "zero-code pipeline",
              desc: "CI/CD: push → GitHub Actions → Vercel preview → production",
            },
            {
              n: 5,
              skill: "observability",
              action: "SSE logs + retry",
              desc: "GET /api/logs/stream · exponential backoff × 3 · Supabase",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="flex items-start gap-4 bg-slate-800/40 rounded-xl px-4 py-3"
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {s.n}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-sm text-yellow-400">
                    SKILL: {s.skill}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-sm text-slate-300">
                    {s.action}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observability */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60">
        <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-400" />
          Observability Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: "SSE Logs Stream",
              desc: "GET /api/logs/stream\nServer-Sent Events\nReal-time в браузере",
              icon: Radio,
              color: "text-red-400",
            },
            {
              title: "Retry Mechanism",
              desc: "Exponential backoff × 3\nОтдельно для каждого провайдера\nFallback cascade при исчерпании",
              icon: RefreshCw,
              color: "text-orange-400",
            },
            {
              title: "Status JSON",
              desc: "/tmp/shadow-status.json\nПубликуется после каждого деплоя\nTelegram notify при изменении",
              icon: FileText,
              color: "text-yellow-400",
            },
            {
              title: "Supabase Logs",
              desc: "Логи задач + статусы фаз\nПерсистентная история запросов\nDashboard analytics",
              icon: Database,
              color: "text-green-400",
            },
          ].map((o) => (
            <div
              key={o.title}
              className="bg-slate-800/40 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <o.icon className={`w-5 h-5 ${o.color}`} />
                <span className="font-bold text-white">
                  {o.title}
                </span>
              </div>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {o.desc}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}