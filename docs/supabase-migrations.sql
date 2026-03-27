-- Shadow Stack: Consolidated Supabase Migrations
-- Combined from: supabase-rls-fix.sql + supabase-rows-fix.sql

-- router_logs table
CREATE TABLE IF NOT EXISTS public.router_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  provider text,
  model text,
  prompt_tokens int,
  completion_tokens int,
  latency_ms int,
  status text,
  executor text DEFAULT 'local' CHECK (executor IN ('local','cloud','open_zero'))
);

-- logs table
CREATE TABLE IF NOT EXISTS public.logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  level text,
  message text,
  meta jsonb
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_router_logs_created ON public.router_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.logs(level);

-- views
CREATE OR REPLACE VIEW public.model_stats_24h AS
  SELECT provider, model,
    COUNT(*) as requests,
    AVG(latency_ms) as avg_latency,
    SUM(prompt_tokens + completion_tokens) as total_tokens
  FROM public.router_logs
  WHERE created_at > now() - interval '24 hours'
  GROUP BY provider, model;

-- RLS policies
ALTER TABLE public.router_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert" ON public.router_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select" ON public.router_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert" ON public.logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select" ON public.logs FOR SELECT TO anon USING (true);
