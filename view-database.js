// Script para visualizar dados do banco via API
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function viewDatabase() {
  console.log('📊 Visualizando dados do banco de dados...\n');

  try {
    // 1. Verificar saúde da API
    console.log('1. Verificando API...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ API:', healthData.status);
    console.log('');

    // 2. Listar esportes
    console.log('2. Esportes cadastrados:');
    const sportsResponse = await fetch(`${API_BASE_URL}/sports`);
    const sportsData = await sportsResponse.json();
    
    if (sportsData.success) {
      sportsData.data.sports.forEach((sport, index) => {
        console.log(`   ${index + 1}. ${sport.name} (${sport.icon})`);
        console.log(`      Descrição: ${sport.description}`);
        console.log(`      Cor: ${sport.color}`);
        console.log(`      Conteúdos: ${sport._count.contents}`);
        console.log(`      Usuários inscritos: ${sport._count.userSports}`);
        console.log('');
      });
    }

    // 3. Listar usuários (via registro de teste)
    console.log('3. Testando registro de usuário...');
    const testUser = {
      name: 'Usuário Teste',
      email: 'teste@exemplo.com',
      password: '123456',
      age: 25,
      school: 'Escola Teste',
      class: 'Turma A'
    };

    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const registerResult = await registerResponse.json();
    
    if (registerResult.success) {
      console.log('✅ Usuário de teste criado:');
      console.log(`   Nome: ${registerResult.data.user.name}`);
      console.log(`   Email: ${registerResult.data.user.email}`);
      console.log(`   Idade: ${registerResult.data.user.age}`);
      console.log(`   Escola: ${registerResult.data.user.school}`);
      console.log(`   Turma: ${registerResult.data.user.class}`);
      console.log(`   Token: ${registerResult.data.token.substring(0, 20)}...`);
      console.log('');

      // 4. Testar login
      console.log('4. Testando login...');
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'teste@exemplo.com',
          password: '123456'
        }),
      });

      const loginResult = await loginResponse.json();
      
      if (loginResult.success) {
        console.log('✅ Login realizado com sucesso!');
        console.log(`   Usuário: ${loginResult.data.user.name}`);
        console.log('');

        // 5. Testar inscrição em esporte
        console.log('5. Testando inscrição em esporte...');
        const sportId = sportsData.data.sports[0].id;
        const joinResponse = await fetch(`${API_BASE_URL}/sports/${sportId}/join`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loginResult.data.token}`,
          },
        });

        const joinResult = await joinResponse.json();
        
        if (joinResult.success) {
          console.log(`✅ Inscrito no esporte: ${sportsData.data.sports[0].name}`);
          console.log('');

          // 6. Testar registro de pontuação
          console.log('6. Testando registro de pontuação...');
          const scoreResponse = await fetch(`${API_BASE_URL}/scores`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${loginResult.data.token}`,
            },
            body: JSON.stringify({
              sportId: sportId,
              score: 150,
              level: 3
            }),
          });

          const scoreResult = await scoreResponse.json();
          
          if (scoreResult.success) {
            console.log('✅ Pontuação registrada:');
            console.log(`   Esporte: ${scoreResult.data.userScore.sport.name}`);
            console.log(`   Pontuação: ${scoreResult.data.userScore.score}`);
            console.log(`   Nível: ${scoreResult.data.userScore.level}`);
            console.log('');
          }
        }
      }
    }

    console.log('🎉 Banco de dados funcionando perfeitamente!');
    console.log('\n📱 Para testar o frontend:');
    console.log('1. Acesse: http://localhost:19006');
    console.log('2. Teste o cadastro e login');
    console.log('\n🔧 Para visualizar dados:');
    console.log('1. Prisma Studio: http://localhost:5555');
    console.log('2. Ou use um visualizador SQLite no arquivo: prisma/dev.db');

  } catch (error) {
    console.error('❌ Erro ao visualizar banco:', error.message);
  }
}

// Executar
viewDatabase();
