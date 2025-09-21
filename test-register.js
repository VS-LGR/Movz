// Teste simples do cadastro
const fetch = require('node-fetch');

async function testRegister() {
  console.log('🧪 Testando cadastro...\n');

  const testUser = {
    name: 'Usuário Teste Frontend',
    email: 'teste-frontend@exemplo.com',
    password: '123456',
    age: 25,
    school: 'Escola Teste',
    class: 'Turma A'
  };

  try {
    console.log('📡 Enviando dados:', testUser);
    
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Headers:', response.headers.raw());

    const data = await response.json();
    console.log('📡 Dados da resposta:', data);

    if (response.ok && data.success) {
      console.log('✅ Cadastro bem-sucedido!');
      console.log('👤 Usuário:', data.data.user);
      console.log('🔑 Token:', data.data.token.substring(0, 20) + '...');
    } else {
      console.log('❌ Erro no cadastro:', data.message);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testRegister();
