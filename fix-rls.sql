-- Habilitar RLS em todas as tabelas principais
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

-- Criar políticas básicas para permitir acesso via Prisma
-- Política para tabela users - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.users
    FOR ALL USING (true);

-- Política para tabela institutions - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.institutions
    FOR ALL USING (true);

-- Política para tabela classes - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.classes
    FOR ALL USING (true);

-- Política para tabela class_students - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.class_students
    FOR ALL USING (true);

-- Política para tabela teacher_classes - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.teacher_classes
    FOR ALL USING (true);

-- Política para tabela user_scores - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.user_scores
    FOR ALL USING (true);

-- Política para tabela class_scores - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.class_scores
    FOR ALL USING (true);

-- Política para tabela attendances - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.attendances
    FOR ALL USING (true);

-- Política para tabela chat_messages - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.chat_messages
    FOR ALL USING (true);

-- Política para tabela achievements - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.achievements
    FOR ALL USING (true);

-- Política para tabela medals - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.medals
    FOR ALL USING (true);

-- Política para tabela user_achievements - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.user_achievements
    FOR ALL USING (true);

-- Política para tabela user_medals - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.user_medals
    FOR ALL USING (true);

-- Política para tabela user_progress - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.user_progress
    FOR ALL USING (true);

-- Política para tabela user_sports - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.user_sports
    FOR ALL USING (true);

-- Política para tabela sports - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.sports
    FOR ALL USING (true);

-- Política para tabela contents - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.contents
    FOR ALL USING (true);

-- Política para tabela card_customizations - permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.card_customizations
    FOR ALL USING (true);
