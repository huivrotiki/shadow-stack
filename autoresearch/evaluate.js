// evaluate.js — DO NOT EDIT (agent must never modify this file)
// Runs eval against fixed test set, prints METRIC: <number>

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const TESTS = [
  { q: 'What is 2+2?', keyword: '4' },
  { q: 'What is the capital of France?', keyword: 'paris' },
  { q: 'Say the word "hello"', keyword: 'hello' },
  { q: 'What color is the sky?', keyword: 'blue' },
  { q: 'Is Node.js a JavaScript runtime?', keyword: 'yes' },
];

async function evaluate() {
  let prompt;
  try {
    // Read current train.py and extract SYSTEM_PROMPT
    const trainCode = readFileSync('autoresearch/train.py', 'utf-8');
    const match = trainCode.match(/SYSTEM_PROMPT\s*=\s*"""([\s\S]*?)"""/);
    prompt = match ? match[1].trim() : 'You are a helpful assistant.';
  } catch {
    prompt = 'You are a helpful assistant.';
  }

  let correct = 0;
  for (const test of TESTS) {
    const response = await callProxy(prompt, test.q);
    if (response.toLowerCase().includes(test.keyword.toLowerCase())) correct++;
  }

  const metric = correct / TESTS.length;
  console.log(`METRIC: ${metric.toFixed(4)}`);
  console.log(`Correct: ${correct}/${TESTS.length}`);
  return metric;
}

async function callProxy(systemPrompt, userMessage) {
  try {
    const body = JSON.stringify({
      model: 'auto',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 100,
      stream: false
    });

    const res = execSync(
      `curl -s -m 15 http://localhost:20129/v1/chat/completions ` +
      `-H "Content-Type: application/json" ` +
      `-H "Authorization: Bearer shadow-free-proxy-local-dev-key-1775352488" ` +
      `-d '${body.replace(/'/g, "'\\''")}'`,
      { encoding: 'utf-8' }
    );

    const data = JSON.parse(res);
    return data?.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

evaluate().catch(console.error);
