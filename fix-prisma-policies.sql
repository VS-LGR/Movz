-- Corrigir políticas de RLS para permitir acesso completo do usuário Prisma
-- Remover políticas existentes e criar novas mais permissivas

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "prisma_access_users" ON public.users;
DROP POLICY IF EXISTS "prisma_access_institutions" ON public.institutions;
DROP POLICY IF EXISTS "prisma_access_classes" ON public.classes;
DROP POLICY IF EXISTS "prisma_access_class_students" ON public.class_students;
DROP POLICY IF EXISTS "prisma_access_teacher_classes" ON public.teacher_classes;
DROP POLICY IF EXISTS "prisma_access_user_scores" ON public.user_scores;
DROP POLICY IF EXISTS "prisma_access_class_scores" ON public.class_scores;
DROP POLICY IF EXISTS "prisma_access_attendances" ON public.attendances;
DROP POLICY IF EXISTS "prisma_access_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "prisma_access_achievements" ON public.achievements;
DROP POLICY IF EXISTS "prisma_access_medals" ON public.medals;
DROP POLICY IF EXISTS "prisma_access_user_achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "prisma_access_user_medals" ON public.user_medals;
DROP POLICY IF EXISTS "prisma_access_user_progress" ON public.user_progress;
DROP POLICY IF EXISTS "prisma_access_user_sports" ON public.user_sports;
DROP POLICY IF EXISTS "prisma_access_sports" ON public.sports;
DROP POLICY IF EXISTS "prisma_access_contents" ON public.contents;
DROP POLICY IF EXISTS "prisma_access_card_customizations" ON public.card_customizations;

-- Criar políticas mais permissivas para o usuário Prisma
CREATE POLICY "prisma_full_access_users" ON public.users FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_institutions" ON public.institutions FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_classes" ON public.classes FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_class_students" ON public.class_students FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_teacher_classes" ON public.teacher_classes FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_user_scores" ON public.user_scores FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_class_scores" ON public.class_scores FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_attendances" ON public.attendances FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_chat_messages" ON public.chat_messages FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_achievements" ON public.achievements FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_medals" ON public.medals FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_user_achievements" ON public.user_achievements FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_user_medals" ON public.user_medals FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_user_progress" ON public.user_progress FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_user_sports" ON public.user_sports FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_sports" ON public.sports FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_contents" ON public.contents FOR ALL TO prisma USING (true) WITH CHECK (true);
CREATE POLICY "prisma_full_access_card_customizations" ON public.card_customizations FOR ALL TO prisma USING (true) WITH CHECK (true);

-- Garantir que o usuário Prisma tenha acesso a todas as sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO prisma;

-- Garantir que o usuário Prisma possa criar novas tabelas se necessário
GRANT CREATE ON SCHEMA public TO prisma;

