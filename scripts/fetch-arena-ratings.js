// scripts/fetch-arena-ratings.js
// Fetches top-10 models from Arena.ai API and saves to data/arena-ratings.json
import https from 'https';
import fs from 'fs';
import path from 'path';

const TARGET = 'https://api.arena.ai/v1/leaderboard?limit=10';
const OUT = path.join(process.env.ROOT_DIR || '.', 'data/arena-ratings.json');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function main() {
  try {
    console.log('🔍 Fetching Arena.ai ratings...');
    const { status, data } = await fetchUrl(TARGET);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    
    const json = JSON.parse(data);
    const payload = {
      fetched_at: new Date().toISOString(),
      source: 'arena.ai',
      models: json.data || json // adapt to actual API shape
    };
    
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
    console.log(`✅ Saved to ${OUT}`);
  } catch (e) {
    console.error('⚠️ Error:', e.message);
    // Fallback: save empty structure
    fs.writeFileSync(OUT, JSON.stringify({ error: e.message }, null, 2));
  }
}
main();
