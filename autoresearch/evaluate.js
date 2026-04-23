// evaluate.js — через free-models-proxy :20129
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const PROXY_URL = 'http://localhost:20129/v1/chat/completions';
const PROXY_KEY = 'shadow-free-proxy-local-dev-key-1775352488';
const MODEL = 'gr-llama8b'; // 261ms, самая быстрая

const QUESTION = 'Как лучше всего настроить omnirouter, чтобы он обновлялся, не падал, считал метрики, и переключал модели учитывая их дневные лимиты и не упирался в них?';

const REQUIRED_TOPICS = [
  { name: 'pm2/autostart',   keywords: ['pm2', 'restart', 'автозапуск', 'autostart', 'daemon'] },
  { name: 'rate-limit',      keywords: ['limit', 'лимит', 'quota', 'квота', 'rate', 'дневной'] },
  { name: 'fallback',        keywords: ['fallback', 'переключ', 'switch', 'резерв', 'backup', 'cascade'] },
  { name: 'metrics',         keywords: ['metric', 'метрик', 'score', 'latency', 'health', 'мониторинг', 'monitor'] },
  { name: 'update/reload',   keywords: ['reload', 'update', 'обновл', 'hot', 'graceful', 'zero-downtime'] },
];

async function evaluate() {
  let systemPrompt;
  try {
    const trainCode = readFileSync('autoresearch/train.py', 'utf-8');
    const match = trainCode.match(/SYSTEM_PROMPT\s*=\s*"""([\s\S]*?)"""/);
    systemPrompt = match ? match[1].trim() : 'You are a helpful assistant.';
  } catch {
    systemPrompt = 'You are a helpful assistant.';
  }

  const scores = [];
  for (let run = 0; run < 3; run++) {
    const response = await callProxy(systemPrompt, QUESTION);
    const lower = response.toLowerCase();
    const covered = REQUIRED_TOPICS.filter(t => t.keywords.some(k => lower.includes(k)));
    const score = covered.length / REQUIRED_TOPICS.length;
    scores.push({ score, covered: covered.map(t => t.name), response: response.slice(0, 120) });
    process.stdout.write(`  run${run+1}: ${covered.length}/${REQUIRED_TOPICS.length} topics [${covered.map(t=>t.name).join(',')}]\n`);
  }

  const best = scores.reduce((a, b) => a.score > b.score ? a : b);
  const metric = best.score;

  console.log(`METRIC: ${metric.toFixed(4)}`);
  console.log(`Best: ${best.covered.join(', ')} | "${best.response}..."`);
  return metric;
}

async function callProxy(systemPrompt, userMessage) {
  try {
    const body = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 800,
      temperature: 0.7,
      stream: false
    });

    const res = execSync(
      `curl -s -m 30 ${PROXY_URL} ` +
      `-H "Content-Type: application/json" ` +
      `-H "Authorization: Bearer ${PROXY_KEY}" ` +
      `-d @-`,
      { input: body, encoding: 'utf-8', timeout: 35000 }
    );

    const data = JSON.parse(res);
    if (data.error) {
      console.error(`  [Proxy] Error: ${JSON.stringify(data.error)}`);
      return '';
    }
    return data?.choices?.[0]?.message?.content || '';
  } catch (e) {
    console.error(`  [Proxy] Error: ${e.message}`);
    return '';
  }
}

evaluate().catch(console.error);
