import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const FALLBACK_FILE = './data/local-logs.json';

// Fallback: write to local JSON file
async function writeToFile(data) {
  const dir = './data';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  let existing = [];
  if (fs.existsSync(FALLBACK_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
    } catch (e) { existing = []; }
  }
  
  existing.push({ ...data, timestamp: new Date().toISOString() });
  
  // Keep only last 100 entries
  if (existing.length > 100) existing = existing.slice(-100);
  
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(existing, null, 2));
  return true;
}

export async function pushLog(event = {}) {
  const payload = {
    tier:      event.route      || 'unknown',
    model:     event.model      || '-',
    latency:   event.latency_ms || 0,
    prompt:    (event.preview   || '').slice(0, 200),
    status:    event.status     || 'ok',
    error:     event.status === 'error' ? (event.preview || null) : null,
    agent_id:  event.user_id    || 'bot',
    project:   'shadow-stack',
    cached:    false,
  };

  // Try Supabase first
  if (supabase) {
    try {
      // Try 'logs' table first, fallback to 'router_logs'
      const { error } = await supabase.from('logs').insert(payload);
      if (!error) {
        console.log('[supabase] ✅ logged to cloud (logs table)');
        return { ok: true, type: 'cloud' };
      }
      // Try router_logs table
      const { error: error2 } = await supabase.from('router_logs').insert({
        route: payload.tier,
        model: payload.model,
        latency_ms: payload.latency,
        message_preview: payload.prompt,
        status: payload.status,
        user_id: payload.agent_id,
      });
      if (!error2) {
        console.log('[supabase] ✅ logged to cloud (router_logs table)');
        return { ok: true, type: 'cloud' };
      }
      console.warn('[supabase] ⚠️ both tables failed:', error.message, error2?.message);
    } catch (e) {
      console.warn('[supabase] ⚠️ exception:', e.message);
    }
  }

  // Fallback to local file
  console.log('[supabase] 💾 falling back to local file');
  await writeToFile(payload);
  return { ok: true, type: 'local-fallback' };
}

export async function getLogs(limit = 10) {
  // Try Supabase first
  if (supabase) {
    try {
      // Try 'logs' table
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (!error && data && data.length > 0) {
        return { logs: data, type: 'cloud' };
      }
      
      // Try 'router_logs' table
      const { data: data2, error: error2 } = await supabase
        .from('router_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (!error2 && data2 && data2.length > 0) {
        return { logs: data2, type: 'cloud' };
      }
    } catch (e) {
      console.warn('[supabase] read error:', e.message);
    }
  }

  // Fallback to local file
  if (fs.existsSync(FALLBACK_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
      return { logs: data.slice(-limit).reverse(), type: 'local-fallback' };
    } catch (e) {
      return { logs: [], type: 'error' };
    }
  }
  
  return { logs: [], type: 'empty' };
}
