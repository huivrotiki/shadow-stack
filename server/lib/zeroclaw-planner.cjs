// ZeroClaw planner — cheap regex-based intent classifier + task decomposer.
// No LLM calls. Output feeds ZeroClaw.execute() via /api/zeroclaw/execute-plan.

// Note: \b word-boundary doesn't match Cyrillic in JS regex; use explicit lookarounds or just substring match.
const INTENT_PATTERNS = [
  { kind: 'code',      re: /(код|напиш|функц|class|реализуй|implement|\bcode\b|refactor|рефактор|\bbug\b|баг|\bfix\b)/i, model: 'auto' },
  { kind: 'research',  re: /(найди|research|исследуй|объясни|explain|что такое|how does|почему|\bwhy\b)/i,              model: 'auto' },
  { kind: 'translate', re: /(переведи|translate|на английск|на русск)/i,                                               model: 'auto' },
  { kind: 'summarize', re: /(суммар|summar|кратко|tl;?dr|резюм)/i,                                                     model: 'auto' },
  { kind: 'creative',  re: /(придумай|creative|сценар|story|generate|напиши текст)/i,                                  model: 'auto' },
  { kind: 'chat',      re: /.*/,                                                                                        model: 'auto' },
];

function intent(text) {
  const t = String(text || '');
  for (const p of INTENT_PATTERNS) {
    if (p.re.test(t)) return { kind: p.kind, model: p.model };
  }
  return { kind: 'chat', model: 'auto' };
}

// Split a goal into 1-3 steps.
// Heuristics:
//   - Numbered lists ("1)" / "2." / "- ") → one step per item.
//   - " then "/" потом "/" затем " → split on connector.
//   - Otherwise single-step.
function decompose(text) {
  const t = String(text || '').trim();
  if (!t) return [];

  const lines = t.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const numbered = lines.filter(l => /^(\d+[\.\)]|[-*])\s+/.test(l));
  if (numbered.length >= 2) {
    return numbered.map(l => l.replace(/^(\d+[\.\)]|[-*])\s+/, ''));
  }

  const connectors = /\s+(?:then|затем|потом|after that|после этого)\s+/i;
  if (connectors.test(t)) {
    return t.split(connectors).map(s => s.trim()).filter(Boolean);
  }

  return [t];
}

function plan(goal) {
  const parts = decompose(goal);
  const base = intent(goal);
  const steps = parts.map((instruction, i) => ({
    id: i + 1,
    instruction,
    intent: intent(instruction).kind,
    model: base.model,
  }));
  return { goal, intent: base.kind, steps };
}

module.exports = { intent, plan, decompose };
