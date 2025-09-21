// Script para testar o sistema completo
const { spawn } = require('child_process');
const fetch = require('node-fetch');

console.log('🚀 Iniciando teste completo do sistema...\n');

// Função para aguardar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para testar API
async function testAPI() {
  try {
    console.log('1. Testando API...');
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ API funcionando:', data.status);
    return true;
  } catch (error) {
    console.log('❌ API não está funcionando:', error.message);
    return false;
  }
}

// Função para testar banco de dados
async function testDatabase() {
  try {
    console.log('2. Testando banco de dados...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const userCount = await prisma.user.count();
    const sportCount = await prisma.sport.count();
    const contentCount = await prisma.content.count();
    
    console.log('✅ Banco funcionando:');
    console.log(`   - Usuários: ${userCount}`);
    console.log(`   - Esportes: ${sportCount}`);
    console.log(`   - Conteúdos: ${contentCount}`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('❌ Banco não está funcionando:', error.message);
    return false;
  }
}

// Função para testar registro de usuário
async function testUserRegistration() {
  try {
    console.log('3. Testando registro de usuário...');
    
    const userData = {
      name: 'Teste Usuário',
      email: 'teste@exemplo.com',
      password: '123456',
      age: 25,
      school: 'Escola Teste',
      class: 'Turma A'
    };

    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Registro funcionando');
      console.log('   - Usuário criado:', result.data.user.name);
      console.log('   - Token gerado:', result.data.token ? 'Sim' : 'Não');
      return true;
    } else {
      console.log('❌ Erro no registro:', result.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no teste de registro:', error.message);
    return false;
  }
}

// Função principal
async function runTests() {
  console.log('Iniciando testes...\n');
  
  // Teste 1: API
  const apiWorking = await testAPI();
  if (!apiWorking) {
    console.log('\n❌ API não está funcionando. Execute: node api/simple-server.js');
    return;
  }
  
  await wait(1000);
  
  // Teste 2: Banco de dados
  const dbWorking = await testDatabase();
  if (!dbWorking) {
    console.log('\n❌ Banco não está funcionando. Execute: npm run db:seed');
    return;
  }
  
  await wait(1000);
  
  // Teste 3: Registro de usuário
  const registrationWorking = await testUserRegistration();
  
  console.log('\n📊 Resumo dos testes:');
  console.log(`API: ${apiWorking ? '✅' : '❌'}`);
  console.log(`Banco: ${dbWorking ? '✅' : '❌'}`);
  console.log(`Registro: ${registrationWorking ? '✅' : '❌'}`);
  
  if (apiWorking && dbWorking && registrationWorking) {
    console.log('\n🎉 Todos os testes passaram! O sistema está funcionando corretamente.');
    console.log('\n📱 Para testar o frontend:');
    console.log('1. Execute: npm run web');
    console.log('2. Acesse: http://localhost:19006');
    console.log('3. Teste o cadastro e login');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.');
  }
}

// Executar testes
runTests().catch(console.error);
