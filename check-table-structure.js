// Script para verificar estrutura da tabela users
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxeuzrquwzaemuzkzyrz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZXV6cnF1d3phZW11emt6eXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTIxNjAsImV4cCI6MjA3NTQyODE2MH0.e4h0L224RcS09fj93cTA1YfOsKps76JG_CNjYVi_HO4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela users...');
    
    // Buscar um usuário para ver os campos disponíveis
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('Erro ao buscar usuários:', fetchError);
      return;
    }
    
    if (users.length > 0) {
      console.log('📊 Campos disponíveis na tabela users:');
      console.log(Object.keys(users[0]));
      
      console.log('\n📋 Exemplo de usuário:');
      console.log(JSON.stringify(users[0], null, 2));
    } else {
      console.log('❌ Nenhum usuário encontrado');
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkTableStructure();
