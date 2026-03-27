-- Shadow Stack Supabase Fix
-- Выполни этот скрипт в SQL Editor: https://supabase.com/dashboard/project/dfajrknplwezzjrqdchu/sql

-- RLS на таблице logs блокирует вставку анонимным пользователям
-- Этот скрипт отключает RLS

-- Отключаем RLS для таблицы logs
ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;

-- Проверяем что отключилось
SELECT 
    schemaname,
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'logs';

-- Теперь создаем политику для публичного чтения (опционально, если захочешь включить RLS обратно)
-- CREATE POLICY "public_read" ON public.logs FOR SELECT USING (true);

-- Проверка: вставка тестовой записи
INSERT INTO public.logs (tier, model, latency, prompt, project, status)
VALUES ('setup-complete', 'sql-fix', 0, 'RLS disabled via SQL script', 'shadow-stack', 'ok');

-- Вывод результата
SELECT * FROM public.logs ORDER BY id DESC LIMIT 3;