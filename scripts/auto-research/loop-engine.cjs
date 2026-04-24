#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// ─── CONFIG ─────────────────────────────────────────────
const CONFIG = {
  shadowApi: 'http://localhost:20129',
  resultsDir: path.join(__dirname, '../../data/research-results'),
  stateFile: path.join(__dirname, '../../.state/research-loop.json'),
  telegramScript: path.join(__dirname, '../send-tg.sh'),
  maxRounds: parseInt(process.env.MAX_ROUNDS) || 3,
  delayMs: parseInt(process.env.DELAY_MS) || 2000,
  scoreThreshold: parseFloat(process.env.SCORE_THRESHOLD) || 0.75,
  dryRun: process.env.DRY_RUN === '1',
  models: [
    'shadow/gr-llama70b',
    'shadow/ms-codestral',
    'shadow/ds-v3',
    'shadow/gr-llama8b',
    'shadow/ms-large'
  ]
};

// ─── LOAD TOPICS ───────────────────────────────────────────
function loadTopics() {
  const topicsFile = path.join(__dirname, '../../.agent/skills/auto-research-loop/topics.json');
  if (fs.existsSync(topicsFile)) {
    try {
      return JSON.parse(fs.readFileSync(topicsFile, 'utf8'));
    } catch (e) {
      console.error('⚠️ Error parsing topics.json:', e.message);
    }
  }
  // Дефолтные темы (если файл отсутствует)
  return [
    {
      id: 'cascade-optimization',
      query: 'Как улучшить Cascade Router в Shadow Stack? Какие модели самые быстрые в 2026?',
      target_file: 'docs/CASCADE-ROUTER.md',
      apply_if_score: 0.8
    },
    {
      id: 'memory-layer',
      query: 'Лучшие практики для ChromaDB v2 + vector memory в Node.js агентах 2026',
      target_file: '.agent/knowledge/memory-best-practices.md',
      apply_if_score: 0.75
    },
    {
      id: 'pinokio-integration',
      query: 'Как создать Pinokio script.json для запуска Shadow Stack сервисов одним кликом?',
      target_file: '.pinokio/shadow-stack.json',
      apply_if_score: 0.85
    }
  ];
}

// ─── HTTP REQUEST TO SHADOW API ─────────────────────────
function queryModel(model, prompt, context = '') {
  return new Promise((resolve, reject) => {
    const fullPrompt = context ? `${prompt}\n\nПредыдущий контекст (улучши и дополни):\n${context}` : prompt;
    
    const body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 1500,
      temperature: 0.3
    });

    const options = {
      hostname: 'localhost',
      port: 20129,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SHADOW_API_KEY || 'shadow-local'}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return reject(new Error(parsed.error.message || 'API Error'));
          }
          const content = parsed.choices?.[0]?.message?.content || '';
          const latency = parsed._latency_ms || 0;
          const tokens = parsed.usage?.total_tokens || 0;
          resolve({ model, content, latency, tokens });
        } catch (e) {
          reject(new Error(`Parse error for ${model}: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${model}`)); });
    req.write(body);
    req.end();
  });
}

// ─── SCORE RESPONSE ──────────────────────────────────────────
function scoreResponse(response, topic) {
  let score = 0;
  const content = response.content.toLowerCase();

  // Длина (полнота)
  if (response.content.length > 500) score += 0.2;
  if (response.content.length > 1000) score += 0.1;

  // Структура (markdown headers)
  if (content.includes('##') || content.includes('###')) score += 0.2;

  // Код (блоки)
  if (content.includes('```')) score += 0.2;

  // Конкретные рекомендации
  if (content.includes('рекоменд') || content.includes('улучш') || 
      content.includes('оптимиз') || content.includes('implement')) score += 0.2;

  // Скорость (бонус за быстрый ответ)
  if (response.latency < 2000) score += 0.1;

  return Math.min(score, 1.0);
}

// ─── SYNTHESIZE BEST ───────────────────────────────────────
function synthesizeBest(results, topic) {
  const sorted = results
    .filter(r => r.content && r.content.length > 100)
    .map(r => ({ ...r, score: scoreResponse(r, topic) }))
    .sort((a, b) => b.score - a.score);

  if (sorted.length === 0) return null;

  const best = sorted[0];
  
  // Если топ-2 модели дали похожие ответы — мержим
  if (sorted.length >= 2 && sorted[0].score > 0.7) {
    const merged = `# 🔬 Auto-Research: ${topic.id}\n` +
      `> Синтез от ${best.model} + ${sorted[1].model}\n` +
      `> Score: ${best.score.toFixed(2)} | ${new Date().toISOString()}\n\n` +
      `## Основной ответ (${best.model})\n${best.content}\n\n` +
      `## Дополнение (${sorted[1].model})\n${sorted[1].content}`;
    return { ...best, content: merged, score: (best.score + sorted[1].score) / 2, merged: true };
  }

  return best;
}

// ─── APPLY IMPROVEMENT ──────────────────────────────────────
function applyImprovement(result, topic) {
  if (result.score < topic.apply_if_score) {
    console.log(`⏭️  Score ${result.score.toFixed(2)} < ${topic.apply_if_score} → пропускаем ${topic.id}`);
    return false;
  }

  if (CONFIG.dryRun) {
    console.log(`🔍 Dry run: would apply to ${topic.target_file}`);
    return false;
  }

  const targetPath = path.join(__dirname, '../../', topic.target_file);
  const dir = path.dirname(targetPath);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const header = `# 🤖 Auto-Research Result\n` +
    `- **Topic:** ${topic.id}\n` +
    `- **Model:** ${result.model}\n` +
    `- **Score:** ${result.score.toFixed(2)}\n` +
    `- **Generated:** ${new Date().toISOString()}\n` +
    `- **Query:** ${topic.query}\n\n---\n\n`;

  // Если файл существует — аппендим секцию
  if (fs.existsSync(targetPath)) {
    const existing = fs.readFileSync(targetPath, 'utf8');
    fs.writeFileSync(targetPath, existing + '\n\n---\n\n' + header + result.content);
  } else {
    fs.writeFileSync(targetPath, header + result.content);
  }

  console.log(`✅ Применено улучшение → ${topic.target_file}`);
  return true;
}

// ─── SAVE RESULT ────────────────────────────────────────────
function saveResult(topic, results, best) {
  if (!fs.existsSync(CONFIG.resultsDir)) {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${topic.id}-${timestamp}.json`;
  
  fs.writeFileSync(
    path.join(CONFIG.resultsDir, filename),
    JSON.stringify({ topic, results, best, timestamp: Date.now() }, null, 2)
  );
}

// ─── TELEGRAM NOTIFICATION ─────────────────────────────────
function sendTelegram(msg) {
  if (!fs.existsSync(CONFIG.telegramScript)) {
    console.log('TG skip: script not found');
    return;
  }
  const { execSync } = require('child_process');
  try {
    execSync(`bash ${CONFIG.telegramScript} "${msg.replace(/"/g, '\\"')}"`, 
      { timeout: 5000, stdio: 'ignore' });
  } catch (e) {
    console.log(`TG skip: ${e.message}`);
  }
}

// ─── MAIN LOOP ───────────────────────────────────────────────
async function runLoop() {
  const topics = loadTopics();
  const startTime = Date.now();
  
  console.log(`\n🔄 AUTO-RESEARCH-LOOP START — ${new Date().toISOString()}`);
  console.log(`📋 Тем: ${topics.length} | Моделей: ${CONFIG.models.length} | Раундов: ${CONFIG.maxRounds}\n`);

  const summary = [];

  for (const topic of topics) {
    console.log(`\n📌 Тема: ${topic.id}`);
    console.log(`❓ Запрос: ${topic.query.substring(0, 80)}...`);
    
    const results = [];
    let context = '';

    // Round-robin по моделям
    for (let round = 0; round < CONFIG.maxRounds; round++) {
      const model = CONFIG.models[round % CONFIG.models.length];
      console.log(`  [Round ${round + 1}] → ${model}`);
      
      try {
        // Улучшаем запрос на каждом раунде
        const result = await queryModel(model, topic.query, context);
        results.push(result);
        context = result.content.substring(0, 500); // Обрезаем для следующего раунда
        console.log(`    ✅ ${result.content.length} chars, ${result.latency}ms`);
        
        // Пауза между запросами
        if (round < CONFIG.maxRounds - 1) {
          await new Promise(r => setTimeout(r, CONFIG.delayMs));
        }
      } catch (e) {
        console.log(`    ⚠️ ${model}: ${e.message}`);
      }
    }

    // Синтез лучшего
    const best = synthesizeBest(results, topic);
    if (!best) {
      console.log(`⚠️ Нет валидных ответов для ${topic.id}`);
      continue;
    }

    console.log(`\n🏆 Победитель: ${best.model} (score: ${best.score.toFixed(2)})`);

    // Сохранение
    saveResult(topic, results, best);

    // Применение улучшений
    const applied = applyImprovement(best, topic);
    
    summary.push({
      topic: topic.id,
      model: best.model,
      score: best.score.toFixed(2),
      applied
    });
  }

  // Итог
  const duration = ((Date.now() - startTime) / 1000).toFixed(0);
  const appliedCount = summary.filter(s => s.applied).length;
  
  const report = [
    `🔬 AUTO-RESEARCH LOOP COMPLETE`,
    `⏱ ${duration}s | 📋 ${topics.length} тем | ✅ ${appliedCount} улучшений применено`,
    summary.map(s => `${s.applied ? '✅' : '⏭️'} ${s.topic} → ${s.model} (${s.score})`).join('\n'),
    `📁 data/research-results/ обновлён`
  ].join('\n');

  console.log('\n' + report);
  sendTelegram(report);

  // Обновляем state
  fs.writeFileSync(CONFIG.stateFile, JSON.stringify({
    last_run: new Date().toISOString(),
    duration_sec: parseInt(duration),
    topics_processed: topics.length,
    improvements_applied: appliedCount,
    summary
  }, null, 2));
}

// ─── ЗАПУСК ────────────────────────────────────────────────
runLoop().catch(err => {
  console.error('LOOP ERROR:', err);
  process.exit(1);
});
