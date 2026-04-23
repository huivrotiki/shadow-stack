// router-engine.test.cjs — Tests for Auto Route
const { smartQuery, detectIntent, getSpeed, setSpeed } = require('./router-engine.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(msg || `Expected "${expected}", got "${actual}"`);
}

// === detectIntent Tests ===
test('detectIntent: code intent', () => {
  assertEqual(detectIntent('write a function to sort array'), 'code');
  assertEqual(detectIntent('debug this error in my code'), 'code');
  assertEqual(detectIntent('implement new class'), 'code');
});

test('detectIntent: browser intent', () => {
  assertEqual(detectIntent('open url http://example.com'), 'browser');
  assertEqual(detectIntent('browse website and scrape data'), 'browser');
  assertEqual(detectIntent('fetch page content'), 'browser');
});

test('detectIntent: summarize intent (NEW)', () => {
  assertEqual(detectIntent('summarize this article'), 'summarize');
  assertEqual(detectIntent('give me a tldr of this text'), 'summarize');
  assertEqual(detectIntent('brief overview needed'), 'summarize');
});

test('detectIntent: translate intent (NEW)', () => {
  assertEqual(detectIntent('translate to spanish'), 'translate');
  assertEqual(detectIntent('english translation required'), 'translate');
});

test('detectIntent: creative intent (NEW)', () => {
  assertEqual(detectIntent('write a story about dragons'), 'creative');
  assertEqual(detectIntent('creative writing task'), 'creative');
  assertEqual(detectIntent('generate idea for new project'), 'creative');
});

test('detectIntent: short query', () => {
  assertEqual(detectIntent('hi'), 'short');
  assertEqual(detectIntent('ok'), 'short');
});

test('detectIntent: default fallback', () => {
  assertEqual(detectIntent('tell me about the weather'), 'default');
  assertEqual(detectIntent('what is the meaning of life'), 'default');
});

// === smartQuery Tests ===
test('smartQuery: code intent returns provider', () => {
  const result = smartQuery('write a function to calculate fibonacci');
  assert(result.provider, 'Provider should exist');
  assert(result.model, 'Model should exist');
  assert(result.confidence > 0, 'Confidence should be positive');
  assert(result.reason, 'Reason should exist');
  console.log(`   → ${result.reason}`);
});

test('smartQuery: browser intent returns browser provider', () => {
  const result = smartQuery('open url and scrape data');
  assertEqual(result.provider, 'browser');
  assertEqual(result.model, 'chromium');
  assertEqual(result.confidence, 0.9);
});

test('smartQuery: short query returns ollama', () => {
  const result = smartQuery('hi');
  assertEqual(result.provider, 'ollama');
});

test('smartQuery: includes profile data', () => {
  const result = smartQuery('default query');
  assert(result.temperature !== undefined, 'Should have temperature');
  assert(result.maxTokens !== undefined, 'Should have maxTokens');
  assert(result.timeout !== undefined, 'Should have timeout');
});

// === getSpeed / setSpeed Tests ===
test('getSpeed: returns current speed', () => {
  const speed = getSpeed();
  assert(['slow', 'medium', 'fast'].includes(speed.current), 'Speed should be valid');
  assert(speed.profile, 'Profile should exist');
});

test('setSpeed: changes speed', () => {
  setSpeed('fast');
  assertEqual(getSpeed().current, 'fast');
  setSpeed('medium'); // Reset
  assertEqual(getSpeed().current, 'medium');
});

test('setSpeed: throws on invalid speed', () => {
  try {
    setSpeed('ultrafast');
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.message.includes('Invalid speed'));
  }
});

// === Edge Cases ===
test('detectIntent: case insensitive', () => {
  assertEqual(detectIntent('WRITE CODE'), 'code');
  assertEqual(detectIntent('Browse Website'), 'browser');
});

test('detectIntent: long text with code keywords', () => {
  const longText = 'A'.repeat(100) + ' implement this function ' + 'B'.repeat(100);
  assertEqual(detectIntent(longText), 'code');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
