// loop.js — AutoResearch main loop
// Usage: node autoresearch/loop.js [maxIterations]

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const MAX_ITERATIONS = parseInt(process.argv[2] || '10');
const IMPROVEMENT_THRESHOLD = 0.01; // 1%
const PROXY_URL = 'http://localhost:20129/v1/chat/completions';
const PROXY_KEY = 'shadow-free-proxy-local-dev-key-1775352488';

async function runEvaluate() {
  try {
    const out = execSync('node autoresearch/evaluate.js', { encoding: 'utf-8', cwd: process.cwd() });
    const match = out.match(/METRIC:\s*([\d.]+)/);
    const metric = parseFloat(match?.[1] ?? '0');
    process.stdout.write(out);
    return metric;
  } catch (e) {
    console.error('evaluate failed:', e.message);
    return 0;
  }
}

async function proposeHypothesis(currentCode, lastMetric, iteration) {
  const taskLen = currentCode.length;
  // Tier selection: short→fast, medium→balanced, long→smart
  const model = taskLen < 300 ? 'gr-llama8b' : taskLen < 1500 ? 'ms-small' : 'omni-sonnet';

  const body = JSON.stringify({
    model,
    messages: [
      {
        role: 'system',
        content: `You are a research agent optimizing a Python file called train.py.
The file contains a SYSTEM_PROMPT string used by an AI assistant.
Your task: propose ONE specific change to improve the metric (% correct answers).
Rules:
- Output ONLY the complete new train.py content, no explanation
- Keep the exact format: SYSTEM_PROMPT = """...""" and def get_prompt(): return SYSTEM_PROMPT
- Make the prompt more specific, detailed, and helpful for Shadow Stack project questions`
      },
      {
        role: 'user',
        content: `Current train.py:\n\`\`\`python\n${currentCode}\n\`\`\`\n\nCurrent metric: ${lastMetric} (iteration ${iteration})\n\nOutput the improved train.py:`
      }
    ],
    max_tokens: 800,
    stream: false
  });

  const res = execSync(
    `curl -s -m 30 ${PROXY_URL} ` +
    `-H "Content-Type: application/json" ` +
    `-H "Authorization: Bearer ${PROXY_KEY}" ` +
    `-d '${body.replace(/'/g, "'\\''")}'`,
    { encoding: 'utf-8' }
  );

  const data = JSON.parse(res);
  const text = data?.choices?.[0]?.message?.content || '';

  // Extract code block if wrapped in ```
  const codeMatch = text.match(/```(?:python)?\n([\s\S]*?)```/);
  return codeMatch ? codeMatch[1] : text;
}

async function main() {
  console.log('🚀 AutoResearch Loop starting...');
  console.log(`Max iterations: ${MAX_ITERATIONS}\n`);

  let bestMetric = await runEvaluate();
  console.log(`📊 Initial metric: ${bestMetric}\n`);

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Iteration ${i}/${MAX_ITERATIONS}`);

    const currentCode = readFileSync('autoresearch/train.py', 'utf-8');

    // Propose change
    console.log('🤔 Proposing hypothesis...');
    let newCode;
    try {
      newCode = await proposeHypothesis(currentCode, bestMetric, i);
    } catch (e) {
      console.error('Proposal failed:', e.message);
      continue;
    }

    if (!newCode.includes('SYSTEM_PROMPT')) {
      console.log('⚠️  Invalid proposal (missing SYSTEM_PROMPT), skipping');
      continue;
    }

    // Apply change
    writeFileSync('autoresearch/train.py', newCode);

    // Evaluate
    console.log('⏱  Evaluating...');
    const newMetric = await runEvaluate();

    // Compare
    if (newMetric > bestMetric * (1 + IMPROVEMENT_THRESHOLD)) {
      bestMetric = newMetric;
      try {
        execSync(`git add autoresearch/train.py && git commit -m "auto(research): metric=${newMetric.toFixed(4)} iter=${i}"`, { cwd: process.cwd() });
        console.log(`✅ Improved! metric=${newMetric.toFixed(4)} — committed`);
      } catch {
        console.log(`✅ Improved! metric=${newMetric.toFixed(4)} (commit skipped)`);
      }
    } else {
      writeFileSync('autoresearch/train.py', currentCode);
      console.log(`❌ No improvement (${newMetric.toFixed(4)} vs ${bestMetric.toFixed(4)}) — reverted`);
    }

    if (bestMetric >= 0.85) {
      console.log('\n🎯 Target reached (≥85%)! Stopping.');
      break;
    }
  }

  console.log(`\n🏁 Done. Best metric: ${bestMetric.toFixed(4)}`);
}

main().catch(console.error);
