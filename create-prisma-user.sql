-- Criar usuário Prisma com privilégios completos
CREATE USER prisma WITH PASSWORD 'prisma_secure_password_2024';

-- Conceder privilégios completos no schema public
GRANT ALL PRIVILEGES ON SCHEMA public TO prisma;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prisma;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prisma;

-- Configurar RLS para permitir acesso do usuário Prisma
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_customizations ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso do usuário Prisma
CREATE POLICY "prisma_access_users" ON public.users FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_institutions" ON public.institutions FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_classes" ON public.classes FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_class_students" ON public.class_students FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_teacher_classes" ON public.teacher_classes FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_user_scores" ON public.user_scores FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_class_scores" ON public.class_scores FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_attendances" ON public.attendances FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_chat_messages" ON public.chat_messages FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_achievements" ON public.achievements FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_medals" ON public.medals FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_user_achievements" ON public.user_achievements FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_user_medals" ON public.user_medals FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_user_progress" ON public.user_progress FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_user_sports" ON public.user_sports FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_sports" ON public.sports FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_contents" ON public.contents FOR ALL TO prisma USING (true);
CREATE POLICY "prisma_access_card_customizations" ON public.card_customizations FOR ALL TO prisma USING (true);

