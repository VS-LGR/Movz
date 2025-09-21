// Script para iniciar a aplicação completa
const { spawn } = require('child_process');

console.log('🚀 Iniciando aplicação Movz...\n');

// Função para aguardar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function startApp() {
  // Iniciar API
  console.log('1. Iniciando API...');
  const apiProcess = spawn('node', ['api/server.js'], {
    stdio: 'pipe',
    shell: true
  });

  apiProcess.stdout.on('data', (data) => {
    console.log(`API: ${data.toString().trim()}`);
  });

  apiProcess.stderr.on('data', (data) => {
    console.error(`API Error: ${data.toString().trim()}`);
  });

  // Aguardar API inicializar
  await wait(3000);

  // Verificar se API está funcionando
  const fetch = require('node-fetch');
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ API funcionando:', data.status);
  } catch (error) {
    console.log('❌ API não está funcionando:', error.message);
    process.exit(1);
  }

  // Iniciar Frontend
  console.log('\n2. Iniciando Frontend...');
  const frontendProcess = spawn('npm', ['run', 'web'], {
    stdio: 'pipe',
    shell: true
  });

  frontendProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('Web is waiting on')) {
      console.log('✅ Frontend funcionando!');
      console.log('\n🎉 Aplicação iniciada com sucesso!');
      console.log('📱 Acesse: http://localhost:19006');
      console.log('🔧 API: http://localhost:3001');
      console.log('\n📋 Para testar o cadastro:');
      console.log('1. Acesse http://localhost:19006');
      console.log('2. Clique em "Cadastre-se"');
      console.log('3. Preencha os dados');
      console.log('4. Clique em "Salvar"');
      console.log('5. Você verá um aviso de sucesso');
      console.log('6. Será redirecionado para a tela de login');
      console.log('7. Faça login com suas credenciais');
    }
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error(`Frontend Error: ${data.toString().trim()}`);
  });

  // Manter os processos rodando
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando aplicação...');
    apiProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });

  // Manter o script rodando
  process.stdin.resume();
}

// Executar a função
startApp().catch(console.error);
