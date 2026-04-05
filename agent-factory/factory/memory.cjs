'use strict';
// agent-factory/factory/memory.cjs — Notebook LLM memory layer
// No external deps: fs, path only.

const fs = require('fs');
const path = require('path');

const NOTEBOOKS_DIR = path.resolve(__dirname, '../../notebooks');
const SUPERMEMORY_URL = 'https://api.supermemory.ai/mcp';

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function indexPath(project) {
  return path.join(NOTEBOOKS_DIR, project, 'INDEX.md');
}

function updateIndex(project, date, title, tags) {
  const idx = indexPath(project);
  const row = `| ${date} | ${title} | ${tags.join(', ')} |\n`;
  if (!fs.existsSync(idx)) {
    fs.writeFileSync(idx, `# Index — ${project} notebooks\n\n| Date | Title | Tags |\n|------|-------|------|\n`);
  }
  fs.appendFileSync(idx, row);
}

/**
 * Save a session notebook entry.
 * @param {{ project: string, title: string, body: string, tags: string[] }} opts
 * @returns {string} file path
 */
function save({ project, title, body, tags = [] }) {
  const dir = path.join(NOTEBOOKS_DIR, project);
  ensureDir(dir);
  const date = new Date().toISOString().slice(0, 10);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const file = path.join(dir, `${date}-${slug}.md`);
  const content = `# ${title}\n**Date:** ${date} · **Project:** ${project} · **Tags:** ${tags.join(', ')}\n\n${body}\n`;
  fs.writeFileSync(file, content);
  updateIndex(project, date, title, tags);
  return file;
}

/**
 * Query notebooks by project/tag/since.
 * @param {{ project?: string, tag?: string, since?: string, limit?: number }} opts
 * @returns {{ file: string, title: string, snippet: string }[]}
 */
function query({ project, tag, since, limit = 5 } = {}) {
  const results = [];
  const projects = project ? [project] : fs.readdirSync(NOTEBOOKS_DIR).filter(f => !f.startsWith('_') && !f.endsWith('.md'));

  for (const proj of projects) {
    const dir = path.join(NOTEBOOKS_DIR, proj);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'INDEX.md').sort().reverse();
    for (const f of files) {
      if (since && f < since) continue;
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      if (tag && !content.includes(tag)) continue;
      const titleMatch = content.match(/^# (.+)/m);
      results.push({ file: path.join(dir, f), title: titleMatch?.[1] || f, snippet: content.slice(0, 300) });
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }
  return results;
}

/**
 * Sync last N notebook entries to Supermemory with namespace routing.
 * Reads .agent/supermemory.config.json for namespace→tag mapping.
 * @param {{ limit?: number, apiKey?: string, project?: string }} opts
 */
async function syncToSupermemory({ limit = 10, apiKey, project } = {}) {
  const key = apiKey || process.env.SUPERMEMORY_API_KEY;
  if (!key) { console.warn('[memory] SUPERMEMORY_API_KEY not set, skipping sync'); return; }

  // Load namespace config
  let namespaces = {};
  try {
    const cfgPath = path.resolve(__dirname, '../../.agent/supermemory.config.json');
    namespaces = JSON.parse(fs.readFileSync(cfgPath, 'utf8')).namespaces || {};
  } catch { /* use empty namespaces */ }

  const tagToNamespace = Object.fromEntries(
    Object.entries(namespaces).map(([ns, { tag }]) => [tag, ns])
  );

  const entries = query({ project, limit });
  for (const entry of entries) {
    try {
      const content = fs.readFileSync(entry.file, 'utf8');
      const tagsMatch = content.match(/\*\*Tags:\*\* ([^\n]+)/);
      const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];
      const namespace = tags.map(t => tagToNamespace[t]).find(Boolean) || 'sessions';

      await fetch(SUPERMEMORY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          content: content.slice(0, 2000),
          metadata: { source: entry.file, title: entry.title, namespace, tags },
        }),
        signal: AbortSignal.timeout(10000),
      });
      console.log(`[memory] Synced: ${entry.title} → namespace:${namespace}`);
    } catch (e) {
      console.warn(`[memory] Sync failed for ${entry.title}: ${e.message}`);
    }
  }
}

module.exports = { save, query, syncToSupermemory };
