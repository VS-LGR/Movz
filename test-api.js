// Script para testar a API
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Iniciando testes da API...\n');

  try {
    // Teste 1: Health Check
    console.log('1. Testando Health Check...');
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.status);
    console.log('');

    // Teste 2: Listar esportes
    console.log('2. Testando listagem de esportes...');
    const sportsResponse = await fetch(`${API_BASE_URL}/sports`);
    const sportsData = await sportsResponse.json();
    console.log('✅ Esportes encontrados:', sportsData.data.sports.length);
    console.log('');

    // Teste 3: Registrar usuário
    console.log('3. Testando registro de usuário...');
    const registerData = {
      name: 'Teste Usuário',
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
      body: JSON.stringify(registerData),
    });

    const registerResult = await registerResponse.json();
    
    if (registerResult.success) {
      console.log('✅ Usuário registrado com sucesso');
      const token = registerResult.data.token;
      console.log('Token:', token.substring(0, 20) + '...');
      console.log('');

      // Teste 4: Login
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
        console.log('✅ Login realizado com sucesso');
        console.log('');

        // Teste 5: Verificar token
        console.log('5. Testando verificação de token...');
        const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const verifyResult = await verifyResponse.json();
        
        if (verifyResult.success) {
          console.log('✅ Token verificado com sucesso');
          console.log('Usuário:', verifyResult.data.user.name);
          console.log('');

          // Teste 6: Buscar perfil
          console.log('6. Testando busca de perfil...');
          const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const profileResult = await profileResponse.json();
          
          if (profileResult.success) {
            console.log('✅ Perfil carregado com sucesso');
            console.log('Nome:', profileResult.data.user.name);
            console.log('Email:', profileResult.data.user.email);
            console.log('');

            // Teste 7: Inscrever-se em esporte
            console.log('7. Testando inscrição em esporte...');
            const sportId = sportsData.data.sports[0].id;
            const joinResponse = await fetch(`${API_BASE_URL}/sports/${sportId}/join`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            const joinResult = await joinResponse.json();
            
            if (joinResult.success) {
              console.log('✅ Inscrito no esporte com sucesso');
              console.log('');

              // Teste 8: Registrar pontuação
              console.log('8. Testando registro de pontuação...');
              const scoreResponse = await fetch(`${API_BASE_URL}/scores`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  sportId: sportId,
                  score: 100,
                  level: 1
                }),
              });

              const scoreResult = await scoreResponse.json();
              
              if (scoreResult.success) {
                console.log('✅ Pontuação registrada com sucesso');
                console.log('Score:', scoreResult.data.userScore.score);
                console.log('Level:', scoreResult.data.userScore.level);
                console.log('');

                // Teste 9: Enviar mensagem no chat
                console.log('9. Testando envio de mensagem...');
                const chatResponse = await fetch(`${API_BASE_URL}/chat/send`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    message: 'Teste de mensagem via API! 🚀'
                  }),
                });

                const chatResult = await chatResponse.json();
                
                if (chatResult.success) {
                  console.log('✅ Mensagem enviada com sucesso');
                  console.log('Mensagem:', chatResult.data.chatMessage.message);
                  console.log('');

                  console.log('🎉 Todos os testes passaram com sucesso!');
                  console.log('A API está funcionando corretamente.');
                } else {
                  console.log('❌ Erro no envio de mensagem:', chatResult.message);
                }
              } else {
                console.log('❌ Erro no registro de pontuação:', scoreResult.message);
              }
            } else {
              console.log('❌ Erro na inscrição no esporte:', joinResult.message);
            }
          } else {
            console.log('❌ Erro ao carregar perfil:', profileResult.message);
          }
        } else {
          console.log('❌ Erro na verificação do token:', verifyResult.message);
        }
      } else {
        console.log('❌ Erro no login:', loginResult.message);
      }
    } else {
      console.log('❌ Erro no registro:', registerResult.message);
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.log('\n💡 Dicas:');
    console.log('- Certifique-se de que a API está rodando (npm run api)');
    console.log('- Verifique se o banco de dados está configurado');
    console.log('- Execute npm run db:seed para popular o banco');
  }
}

// Executar testes
testAPI();
