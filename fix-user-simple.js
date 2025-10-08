// Script simples para corrigir apenas user_type
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxeuzrquwzaemuzkzyrz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZXV6cnF1d3phZW11emt6eXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTIxNjAsImV4cCI6MjA3NTQyODE2MH0.e4h0L224RcS09fj93cTA1YfOsKps76JG_CNjYVi_HO4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserType() {
  try {
    console.log('🔍 Corrigindo user_type dos usuários...');
    
    // Buscar usuários que têm userType mas não user_type
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, userType, user_type')
      .not('userType', 'is', null);
    
    if (fetchError) {
      console.error('Erro ao buscar usuários:', fetchError);
      return;
    }
    
    console.log(`📊 Encontrados ${users.length} usuários para corrigir`);
    
    for (const user of users) {
      if (user.userType && !user.user_type) {
        console.log(`👤 Corrigindo ${user.email}: ${user.userType} -> user_type`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ user_type: user.userType })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar ${user.email}:`, updateError);
        } else {
          console.log(`✅ ${user.email} corrigido com sucesso`);
        }
      }
    }
    
    console.log('\n🎉 Correção concluída!');
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

fixUserType();
