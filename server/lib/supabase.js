// server/lib/supabase.js — router_logs insert (silent fail if unavailable)
import { createClient } from '@supabase/supabase-js';

let supabase = null;

function init() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.log('[Supabase] Not configured — logging disabled (set SUPABASE_URL + SUPABASE_ANON_KEY)');
    return;
  }
  supabase = createClient(url, key);
  console.log('[Supabase] Connected — router_logs enabled');
}

init();

export async function logRoute(event) {
  if (!supabase) return;
  try {
    await supabase.from('router_logs').insert({
      route: event.route || 'unknown',
      model: event.model || '-',
      latency_ms: event.latency_ms || 0,
      status: event.status || 'ok',
      message_preview: (event.preview || '').slice(0, 200),
      user_id: event.user_id || 'bot',
    });
  } catch (err) {
    // Silent fail — don't crash the router
    console.error('[Supabase] logRoute error:', err.message);
  }
}
