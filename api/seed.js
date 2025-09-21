const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar esportes
  const sports = await Promise.all([
    prisma.sport.upsert({
      where: { name: 'Futebol' },
      update: {},
      create: {
        name: 'Futebol',
        description: 'O esporte mais popular do mundo',
        icon: '⚽',
        color: '#00FF00',
        isActive: true
      }
    }),
    prisma.sport.upsert({
      where: { name: 'Basquete' },
      update: {},
      create: {
        name: 'Basquete',
        description: 'Esporte de quadra com cesta',
        icon: '🏀',
        color: '#FF8C00',
        isActive: true
      }
    }),
    prisma.sport.upsert({
      where: { name: 'Vôlei' },
      update: {},
      create: {
        name: 'Vôlei',
        description: 'Esporte de quadra com rede',
        icon: '🏐',
        color: '#FFD700',
        isActive: true
      }
    }),
    prisma.sport.upsert({
      where: { name: 'Tênis' },
      update: {},
      create: {
        name: 'Tênis',
        description: 'Esporte de raquete',
        icon: '🎾',
        color: '#00FFFF',
        isActive: true
      }
    }),
    prisma.sport.upsert({
      where: { name: 'Natação' },
      update: {},
      create: {
        name: 'Natação',
        description: 'Esporte aquático',
        icon: '🏊',
        color: '#0080FF',
        isActive: true
      }
    })
  ]);

  console.log('✅ Esportes criados:', sports.length);

  // Criar conteúdos para cada esporte
  for (const sport of sports) {
    // Aquecimento
    await prisma.content.createMany({
      data: [
        {
          sportId: sport.id,
          title: `Aquecimento - ${sport.name}`,
          description: `Exercícios de aquecimento para ${sport.name}`,
          type: 'WARMUP',
          difficulty: 'BEGINNER',
          duration: 10,
          instructions: `1. Corrida leve por 5 minutos\n2. Alongamento dinâmico\n3. Movimentos específicos do ${sport.name}`,
          isActive: true
        },
        {
          sportId: sport.id,
          title: `Aquecimento Avançado - ${sport.name}`,
          description: `Aquecimento mais intenso para ${sport.name}`,
          type: 'WARMUP',
          difficulty: 'INTERMEDIATE',
          duration: 15,
          instructions: `1. Corrida com variações de velocidade\n2. Alongamento dinâmico completo\n3. Exercícios específicos do ${sport.name}\n4. Ativação muscular`,
          isActive: true
        }
      ]
    });

    // Treino
    await prisma.content.createMany({
      data: [
        {
          sportId: sport.id,
          title: `Treino Básico - ${sport.name}`,
          description: `Treino fundamental de ${sport.name}`,
          type: 'TRAINING',
          difficulty: 'BEGINNER',
          duration: 30,
          instructions: `1. Fundamentos básicos\n2. Exercícios de técnica\n3. Prática dirigida\n4. Jogos educativos`,
          isActive: true
        },
        {
          sportId: sport.id,
          title: `Treino Intermediário - ${sport.name}`,
          description: `Treino de nível intermediário para ${sport.name}`,
          type: 'TRAINING',
          difficulty: 'INTERMEDIATE',
          duration: 45,
          instructions: `1. Técnica aprimorada\n2. Exercícios táticos\n3. Simulações de jogo\n4. Condicionamento físico`,
          isActive: true
        },
        {
          sportId: sport.id,
          title: `Treino Avançado - ${sport.name}`,
          description: `Treino de alto nível para ${sport.name}`,
          type: 'TRAINING',
          difficulty: 'ADVANCED',
          duration: 60,
          instructions: `1. Técnica refinada\n2. Estratégias avançadas\n3. Simulações competitivas\n4. Preparação física intensa`,
          isActive: true
        }
      ]
    });

    // Desaquecimento
    await prisma.content.createMany({
      data: [
        {
          sportId: sport.id,
          title: `Desaquecimento - ${sport.name}`,
          description: `Exercícios de desaquecimento para ${sport.name}`,
          type: 'COOLDOWN',
          difficulty: 'BEGINNER',
          duration: 10,
          instructions: `1. Caminhada leve\n2. Alongamento estático\n3. Respiração profunda\n4. Relaxamento muscular`,
          isActive: true
        }
      ]
    });

    // Tutoriais
    await prisma.content.createMany({
      data: [
        {
          sportId: sport.id,
          title: `Tutorial - Fundamentos do ${sport.name}`,
          description: `Aprenda os fundamentos básicos do ${sport.name}`,
          type: 'TUTORIAL',
          difficulty: 'BEGINNER',
          duration: 20,
          instructions: `1. História do ${sport.name}\n2. Regras básicas\n3. Equipamentos necessários\n4. Técnicas fundamentais`,
          isActive: true
        }
      ]
    });
  }

  console.log('✅ Conteúdos criados para todos os esportes');

  // Criar usuário de exemplo
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('123456', 12);

  const exampleUser = await prisma.user.upsert({
    where: { email: 'usuario@exemplo.com' },
    update: {},
    create: {
      name: 'Usuário Exemplo',
      email: 'usuario@exemplo.com',
      password: hashedPassword,
      age: 25,
      school: 'Escola Exemplo',
      class: 'Turma A',
      avatar: null
    }
  });

  console.log('✅ Usuário de exemplo criado');

  // Inscrição do usuário em alguns esportes
  await prisma.userSport.createMany({
    data: [
      { userId: exampleUser.id, sportId: sports[0].id }, // Futebol
      { userId: exampleUser.id, sportId: sports[1].id }, // Basquete
      { userId: exampleUser.id, sportId: sports[2].id }  // Vôlei
    ]
  });

  console.log('✅ Usuário inscrito em esportes');

  // Criar algumas pontuações de exemplo
  await prisma.userScore.createMany({
    data: [
      { userId: exampleUser.id, sportId: sports[0].id, score: 150, level: 3 },
      { userId: exampleUser.id, sportId: sports[1].id, score: 120, level: 2 },
      { userId: exampleUser.id, sportId: sports[2].id, score: 90, level: 1 }
    ]
  });

  console.log('✅ Pontuações de exemplo criadas');

  // Criar algumas mensagens de chat
  await prisma.chatMessage.createMany({
    data: [
      {
        userId: exampleUser.id,
        message: 'Olá pessoal! Bem-vindos ao Movz! 🎉',
        isRead: true
      },
      {
        userId: exampleUser.id,
        message: 'Vamos treinar juntos! 💪',
        isRead: true
      },
      {
        userId: exampleUser.id,
        message: 'Qual esporte vocês mais gostam?',
        isRead: true
      }
    ]
  });

  console.log('✅ Mensagens de chat criadas');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
