// Script para testar o frontend com debug
const fetch = require('node-fetch');

async function testFrontendDebug() {
  console.log('🧪 Testando frontend com debug...\n');

  // Simular dados do formulário
  const formData = {
    name: 'Teste Frontend Debug',
    email: 'debug@teste.com',
    password: '123456',
    age: '25', // String como vem do input
    school: 'Escola Debug',
    class: 'Turma Debug'
  };

  console.log('📝 Dados do formulário (como vem do input):', formData);

  // Converter age para número (como fazemos no frontend)
  const userDataToSend = {
    ...formData,
    age: parseInt(formData.age, 10)
  };

  console.log('📤 Dados a serem enviados (após conversão):', userDataToSend);

  try {
    console.log('📡 Enviando para API...');
    
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userDataToSend),
    });

    console.log('📡 Status:', response.status);
    const data = await response.json();
    console.log('📡 Resposta:', data);

    if (response.ok && data.success) {
      console.log('✅ Teste bem-sucedido!');
      console.log('👤 Usuário criado:', data.data.user.name);
      console.log('📧 Email:', data.data.user.email);
      console.log('🎯 Próximo passo: Testar no navegador');
    } else {
      console.log('❌ Erro na API:', data.message);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testFrontendDebug();
