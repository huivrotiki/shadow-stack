import { createClient } from '@supabase/supabase-js';

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

if (!supabase) console.warn('[supabase] disabled — env vars missing');

export async function pushToSupabase(event = {}) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('logs').insert({
      tier:     event.route      || 'unknown',
      model:    event.model      || '-',
      latency:  event.latency_ms || 0,
      prompt:   (event.preview   || '').slice(0, 200),
      status:   event.status     || 'ok',
      error:    event.status === 'error' ? (event.preview || null) : null,
      agent_id: event.user_id    || 'bot',
      project:  'shadow-stack',
      cached:   false,
    });
    if (error) console.warn('[supabase] insert error:', error.message);
  } catch (e) {
    console.warn('[supabase] write failed:', e.message);
  }
}
