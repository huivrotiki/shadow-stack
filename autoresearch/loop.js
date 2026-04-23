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
   // Use WORKING model from debug test (gr-llama8b works!)
   const model = 'gr-llama8b'; // Confirmed working in debug test
   

  const prompt = `Current train.py has SYSTEM_PROMPT with metric ${lastMetric}.
Output ONLY valid Python code starting with:
SYSTEM_PROMPT = """
...your improved prompt here...
"""

Keep the exact format: SYSTEM_PROMPT = """...""" and def get_prompt(): return SYSTEM_PROMPT
No explanations, no markdown blocks, just raw Python code.`;

  const body = JSON.stringify({
    model,
    messages: [
      {
        role: 'system',
        content: `You are a Python code generator. Output ONLY raw Python code.`
      },
      {
        role: 'user',
        content: `${prompt}\n\nCurrent code:\n${currentCode}\n\nOutput improved train.py:`
      }
    ],
    max_tokens: 1000,
    temperature: 0.3,
    stream: false
  });

   let res;
   try {
     res = execSync(
       `curl -s -m 30 ${PROXY_URL} ` +
       `-H "Content-Type: application/json" ` +
       `-H "Authorization: Bearer ${PROXY_KEY}" ` +
       `-d @-`,
       { input: body, encoding: 'utf-8' }
     );
   } catch (e) {
     console.error('   [DEBUG] curl failed:', e.message);
     return 'ERROR: curl failed';
   }
   
   let data;
   try {
     data = JSON.parse(res);
   } catch (e) {
     console.error('   [DEBUG] JSON parse failed:', e.message);
     console.error('   [DEBUG] Raw response (200ch):', res.substring(0, 200));
     return 'ERROR: invalid JSON';
   }
   
   // Check for API errors
   if (data.error) {
     console.error('   [DEBUG] API error:', JSON.stringify(data.error));
     return 'ERROR: ' + (data.error.message || JSON.stringify(data.error));
   }
   
   const text = data?.choices?.[0]?.message?.content || '';
   
   // Simple check: if response contains SYSTEM_PROMPT, return it directly
   if (text.includes('SYSTEM_PROMPT')) {
     console.log('   [DEBUG] Response contains SYSTEM_PROMPT, returning full text');
     return text.trim();
   }
   
   // Fallback: try to extract code block
   const codeMatch = text.match(/```(?:python)?\n([\s\S]*?)```/);
   if (codeMatch) {
     console.log('   [DEBUG] Extracted from code block');
     return codeMatch[1].trim();
   }
   
   console.log('   [DEBUG] No pattern matched, returning raw text');
   return text.trim();
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

     // More flexible check: look for SYSTEM_PROMPT anywhere in the response
     if (!newCode.includes('SYSTEM_PROMPT') && !newCode.includes('def get_prompt')) {
       console.log('⚠️  Invalid proposal (missing SYSTEM_PROMPT/get_prompt), skipping');
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
