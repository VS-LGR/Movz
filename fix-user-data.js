// Script para corrigir dados de usuários existentes
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxeuzrquwzaemuzkzyrz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZXV6cnF1d3phZW11emt6eXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTIxNjAsImV4cCI6MjA3NTQyODE2MH0.e4h0L224RcS09fj93cTA1YfOsKps76JG_CNjYVi_HO4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserData() {
  try {
    console.log('🔍 Buscando usuários com dados incorretos...');
    
    // Buscar todos os usuários
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*');
    
    if (fetchError) {
      console.error('Erro ao buscar usuários:', fetchError);
      return;
    }
    
    console.log(`📊 Encontrados ${users.length} usuários`);
    
    for (const user of users) {
      console.log(`\n👤 Processando usuário: ${user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - userType: ${user.userType}`);
      console.log(`   - user_type: ${user.user_type}`);
      
      const updates = {};
      
      // Corrigir userType -> user_type
      if (user.userType && !user.user_type) {
        updates.user_type = user.userType;
        console.log(`   ✅ userType -> user_type: ${user.userType}`);
      }
      
      // Corrigir createdAt -> created_at
      if (user.createdAt && !user.created_at) {
        updates.created_at = user.createdAt;
        console.log(`   ✅ createdAt -> created_at: ${user.createdAt}`);
      }
      
      // Corrigir updatedAt -> updated_at
      if (user.updatedAt && !user.updated_at) {
        updates.updated_at = user.updatedAt;
        console.log(`   ✅ updatedAt -> updated_at: ${user.updatedAt}`);
      }
      
      // Corrigir cardBanner -> card_banner
      if (user.cardBanner && !user.card_banner) {
        updates.card_banner = user.cardBanner;
        console.log(`   ✅ cardBanner -> card_banner: ${user.cardBanner}`);
      }
      
      // Corrigir cardTheme -> card_theme
      if (user.cardTheme && !user.card_theme) {
        updates.card_theme = user.cardTheme;
        console.log(`   ✅ cardTheme -> card_theme: ${user.cardTheme}`);
      }
      
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`   ❌ Erro ao atualizar usuário ${user.email}:`, updateError);
        } else {
          console.log(`   ✅ Usuário ${user.email} atualizado com sucesso`);
        }
      } else {
        console.log(`   ⏭️  Usuário ${user.email} já está correto`);
      }
    }
    
    console.log('\n🎉 Processo concluído!');
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

fixUserData();
