import "dotenv/config";
import express from "express";
import { execSync } from "child_process";
import { router as logsRouter, pushLog } from "./api/logs.js";

const app = express();
app.use(express.json());
app.get("/health", (req, res) => res.json({ status: "ok", service: "shadow-stack", timestamp: new Date().toISOString() }));

// RAM Guard — Mac mini M1 memory check
app.get("/ram", (req, res) => {
  try {
    const vm = execSync("vm_stat").toString();
    const free = parseInt(vm.match(/Pages free:\s+(\d+)/)?.[1] || 0);
    const inactive = parseInt(vm.match(/Pages inactive:\s+(\d+)/)?.[1] || 0);
    const freeMB = Math.round(((free + inactive) * 4096) / 1024 / 1024);
    res.json({
      free_mb: freeMB,
      safe: freeMB > 400,
      critical: freeMB < 200,
      total_mb: 8192,
      recommendation: freeMB < 200 ? "🔴 ABORT — RAM critical"
        : freeMB < 400 ? "🟡 ollama-3b only, skip browser"
        : freeMB < 2000 ? "🟡 ollama-7b ok, skip browser"
        : "🟢 all providers available"
    });
  } catch (e) {
    res.json({ free_mb: -1, safe: true, error: e.message });
  }
});

// SSE logs + stats
app.use(logsRouter);

// Expose pushLog for other modules
export { pushLog };

// All services status
app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    services: [
      { name: "Express API", port: 3001, status: "online" },
      { name: "Shadow Router", port: 3002, status: "checking" },
      { name: "Ollama", port: 11434, status: "checking" },
      { name: "OpenClaw", port: 18789, status: "checking" },
      { name: "Telegram Bot", port: 4000, status: "checking" }
    ]
  });
});

const GITHUB_API = "https://api.github.com";

function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function createIssue({ title, body = "", labels = [] }) {
  const token = getEnv("GITHUB_TOKEN");
  const owner = getEnv("GITHUB_REPO_OWNER");
  const repo = getEnv("GITHUB_REPO_NAME");

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ title, body, labels }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub createIssue failed: ${res.status} ${text}`);
  }

  return res.json();
}

app.get("/api/gitops", (req, res) => {
  res.json({
    ok: true,
    actions: ["createIssue"],
    repo: {
      owner: process.env.GITHUB_REPO_OWNER,
      name: process.env.GITHUB_REPO_NAME,
    },
  });
});

app.post("/api/gitops", async (req, res) => {
  try {
    const { action, params } = req.body;

    if (action !== "createIssue") {
      return res.status(400).json({
        error: "Unsupported action",
        supported: ["createIssue"],
      });
    }

    const issue = await createIssue({
      title: params?.title,
      body: params?.body,
      labels: params?.labels,
    });

    res.json({ ok: true, issue });
  } catch (error) {
    console.error("GitOps error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`GitOps API running on http://localhost:${PORT}`);
});

// Auto-router endpoint → Ollama or OpenRouter
app.post("/api/route", async (req, res) => {
  const { prompt, model } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }
  
  // Try Ollama first (local)
  const t0 = Date.now();
  try {
    const fetch = (await import('node-fetch')).default;
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "qwen2.5:3b",
        prompt,
        stream: false
      })
    });
    
    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      pushLog({ ts: Date.now(), route: 'ollama', model: model || 'qwen2.5:3b', latency_ms: Date.now() - t0, status: 'ok', preview: prompt.slice(0, 80) });
      return res.json({
        ok: true,
        provider: "ollama",
        model: model || "qwen2.5:3b",
        response: data.response
      });
    }
    pushLog({ ts: Date.now(), route: 'ollama', model: model || 'qwen2.5:3b', latency_ms: Date.now() - t0, status: 'retry', preview: `ollama ${ollamaRes.status}` });
  } catch (e) {
    pushLog({ ts: Date.now(), route: 'ollama', model: model || 'qwen2.5:3b', latency_ms: Date.now() - t0, status: 'error', preview: e.message });
    console.log("Ollama failed, trying OpenRouter:", e.message);
  }
  
  // Fallback to OpenRouter
  const t1 = Date.now();
  try {
    const fetch = (await import('node-fetch')).default;
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "Shadow Stack"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    if (orRes.ok) {
      const data = await orRes.json();
      pushLog({ ts: Date.now(), route: 'openrouter', model: 'claude-3-haiku', latency_ms: Date.now() - t1, status: 'ok', preview: prompt.slice(0, 80) });
      return res.json({
        ok: true,
        provider: "openrouter",
        model: "claude-3-haiku",
        response: data.choices?.[0]?.message?.content
      });
    }
  } catch (e) {
    pushLog({ ts: Date.now(), route: 'openrouter', model: 'claude-3-haiku', latency_ms: Date.now() - t1, status: 'error', preview: e.message });
    return res.status(500).json({ error: "All providers failed", details: e.message });
  }
  
  res.status(500).json({ error: "No providers available" });
});

// OpenAI-compatible chat proxy → OpenRouter
app.post("/api/chat", async (req, res) => {
  const fetch = (await import('node-fetch')).default;
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3001",
      "X-Title": "Shadow Stack"
    },
    body: JSON.stringify(req.body)
  });
  const data = await response.json();
  res.json(data);
});

// Full cascade endpoint
app.post("/api/cascade", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const { shadowGenerate } = await import("../server/lib/ai-sdk.cjs");
    const result = await shadowGenerate(prompt);
    res.json({ ok: true, ...result });
  } catch (error) {
    pushLog({ ts: Date.now(), route: 'cascade', model: '-', status: 'error', preview: error.message });
    res.status(500).json({ ok: false, error: error.message });
  }
});
