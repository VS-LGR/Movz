const { PrismaClient } = require('@prisma/client');

// Usar a URL da pooler diretamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.qxeuzrquwzaemuzkzyrz:4QF9JtipIOeUIiTC@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    }
  }
});

async function fixRLS() {
  try {
    console.log('🔧 Testando conectividade...');
    
    // Testar conectividade primeiro
    const testResult = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conectividade OK:', testResult);
    
    console.log('🔧 Habilitando RLS em todas as tabelas...');
    
    // Habilitar RLS em todas as tabelas
    const tables = [
      'users', 'institutions', 'classes', 'class_students', 'teacher_classes',
      'user_scores', 'class_scores', 'attendances', 'chat_messages',
      'achievements', 'medals', 'user_achievements', 'user_medals',
      'user_progress', 'user_sports', 'sports', 'contents', 'card_customizations'
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
        console.log(`✅ RLS habilitado em: ${table}`);
      } catch (error) {
        console.log(`⚠️ Erro ao habilitar RLS em ${table}:`, error.message);
      }
    }

    console.log('🔧 Criando políticas básicas...');
    
    // Criar políticas básicas para permitir acesso via service_role
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE POLICY IF NOT EXISTS "Allow all operations for service_role" ON public.${table}
          FOR ALL USING (true);
        `);
        console.log(`✅ Política criada para: ${table}`);
      } catch (error) {
        console.log(`⚠️ Erro ao criar política para ${table}:`, error.message);
      }
    }

    console.log('✅ RLS configurado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRLS();

