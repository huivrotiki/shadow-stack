import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json());
app.get("/health", (req, res) => res.json({ status: "ok", service: "shadow-stack", timestamp: new Date().toISOString() }));

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
