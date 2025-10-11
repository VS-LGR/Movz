-- Script para desabilitar RLS em todas as tabelas públicas
-- Execute este script no Supabase SQL Editor

-- Desabilitar RLS em todas as tabelas públicas
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_customizations DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
