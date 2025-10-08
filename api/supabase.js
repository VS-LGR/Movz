const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://qxeuzrquwzaemuzkzyrz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZXV6cnF1d3phZW11emt6eXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTIxNjAsImV4cCI6MjA3NTQyODE2MH0.e4h0L224RcS09fj93cTA1YfOsKps76JG_CNjYVi_HO4';

// Verificar se a key está disponível
if (!supabaseKey) {
  console.error('SUPABASE_ANON_KEY não encontrada nas variáveis de ambiente');
  throw new Error('SUPABASE_ANON_KEY is required');
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para gerar ID único (similar ao cuid do Prisma)
const generateId = () => {
  return 'c' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

module.exports = { supabase, generateId };
