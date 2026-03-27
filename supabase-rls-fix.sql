-- ============================================
-- Shadow Stack — Supabase RLS Fix
-- Run in: https://supabase.com/dashboard/project/shadow-stack-prod
-- ============================================

-- Step 1: Check current RLS status
SELECT 
  schemaname,
  tablename, 
  rowsecurity,
  has_table_privilege('anon', tablename, 'INSERT') as can_insert_anon,
  has_table_privilege('anon', tablename, 'SELECT') as can_select_anon
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('logs', 'router_logs');

-- Step 2: Disable RLS on logs table
ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;

-- Step 3: Disable RLS on router_logs table  
ALTER TABLE public.router_logs DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('logs', 'router_logs');

-- Step 5: Test insert (as anon)
INSERT INTO public.logs (tier, model, latency, prompt, status, agent_id, project)
VALUES ('test', 'rls-fix', 0, 'RLS disabled - test insert', 'ok', 'bot', 'shadow-stack');

-- Step 6: Read test
SELECT * FROM public.logs ORDER BY timestamp DESC LIMIT 5;
