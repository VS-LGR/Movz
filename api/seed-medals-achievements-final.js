const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMedalsAndAchievements() {
  try {
    console.log('🌱 Iniciando seed de medalhas e conquistas...');

    // Limpar dados existentes
    await prisma.userMedal.deleteMany();
    await prisma.userAchievement.deleteMany();
    await prisma.cardCustomization.deleteMany();
    await prisma.medal.deleteMany();
    await prisma.achievement.deleteMany();

    console.log('✅ Dados antigos removidos');

    // Criar 6 medalhas (exatamente como no frontend)
    const medals = [
      {
        name: 'Primeiro Passo',
        description: 'Complete seu primeiro treino',
        icon: 'http://localhost:3001/assets/images/Medalha_1.svg',
        category: 'Iniciante',
        rarity: 'common',
        color: '#FFD700',
        requirement: '1 treino completado',
        xpReward: 100,
        isActive: true
      },
      {
        name: 'Maratonista',
        description: 'Complete 10 treinos',
        icon: 'http://localhost:3001/assets/images/Medalha_2.svg',
        category: 'Resistência',
        rarity: 'rare',
        color: '#C0C0C0',
        requirement: '10 treinos completados',
        xpReward: 500,
        isActive: true
      },
      {
        name: 'Campeão',
        description: 'Complete 50 treinos',
        icon: 'http://localhost:3001/assets/images/Medalha_3.svg',
        category: 'Elite',
        rarity: 'epic',
        color: '#FF6B6B',
        requirement: '50 treinos completados',
        xpReward: 1000,
        isActive: true
      },
      {
        name: 'Lenda',
        description: 'Complete 100 treinos',
        icon: 'http://localhost:3001/assets/images/Medalha_4.svg',
        category: 'Lenda',
        rarity: 'legendary',
        color: '#9B59B6',
        requirement: '100 treinos completados',
        xpReward: 2000,
        isActive: true
      },
      {
        name: 'Velocista',
        description: 'Complete 5 treinos em um dia',
        icon: 'http://localhost:3001/assets/images/Medalha_5.svg',
        category: 'Velocidade',
        rarity: 'rare',
        color: '#3498DB',
        requirement: '5 treinos em 1 dia',
        xpReward: 750,
        isActive: true
      },
      {
        name: 'Consistente',
        description: 'Treine por 7 dias seguidos',
        icon: 'http://localhost:3001/assets/images/Medalha_6.svg',
        category: 'Consistência',
        rarity: 'epic',
        color: '#2ECC71',
        requirement: '7 dias consecutivos',
        xpReward: 1500,
        isActive: true
      }
    ];

    // Criar 16 conquistas (exatamente como no frontend)
    const achievements = [
      {
        name: 'Primeira Estrela',
        description: 'Complete seu primeiro exercício',
        icon: 'http://localhost:3001/assets/images/aiAtivo 5medals.svg',
        category: 'Iniciante',
        rarity: 'common',
        color: '#FFD700',
        requirement: '1 exercício completado',
        xpReward: 50,
        isActive: true
      },
      {
        name: 'Guerreiro',
        description: 'Complete 5 exercícios em sequência',
        icon: 'http://localhost:3001/assets/images/aiAtivo 9medals.svg',
        category: 'Resistência',
        rarity: 'rare',
        color: '#C0C0C0',
        requirement: '5 exercícios consecutivos',
        xpReward: 200,
        isActive: true
      },
      {
        name: 'Mestre',
        description: 'Complete 25 exercícios',
        icon: 'http://localhost:3001/assets/images/aiAtivo 10medals.svg',
        category: 'Elite',
        rarity: 'epic',
        color: '#FF6B6B',
        requirement: '25 exercícios completados',
        xpReward: 500,
        isActive: true
      },
      {
        name: 'Lenda Viva',
        description: 'Complete 100 exercícios',
        icon: 'http://localhost:3001/assets/images/aiAtivo 11medals.svg',
        category: 'Lenda',
        rarity: 'legendary',
        color: '#9B59B6',
        requirement: '100 exercícios completados',
        xpReward: 1000,
        isActive: true
      },
      {
        name: 'Relâmpago',
        description: 'Complete 10 exercícios em 1 hora',
        icon: 'http://localhost:3001/assets/images/aiAtivo 12medals.svg',
        category: 'Velocidade',
        rarity: 'rare',
        color: '#3498DB',
        requirement: '10 exercícios em 1h',
        xpReward: 300,
        isActive: true
      },
      {
        name: 'Dedicação',
        description: 'Treine por 30 dias seguidos',
        icon: 'http://localhost:3001/assets/images/aiAtivo 13medals.svg',
        category: 'Consistência',
        rarity: 'epic',
        color: '#2ECC71',
        requirement: '30 dias consecutivos',
        xpReward: 800,
        isActive: true
      },
      {
        name: 'Perfeccionista',
        description: 'Complete 50 exercícios com nota máxima',
        icon: 'http://localhost:3001/assets/images/aiAtivo 14medals.svg',
        category: 'Precisão',
        rarity: 'epic',
        color: '#E74C3C',
        requirement: '50 exercícios perfeitos',
        xpReward: 600,
        isActive: true
      },
      {
        name: 'Explorador',
        description: 'Complete exercícios de todos os esportes',
        icon: 'http://localhost:3001/assets/images/aiAtivo 15medals.svg',
        category: 'Variedade',
        rarity: 'rare',
        color: '#F39C12',
        requirement: 'Todos os esportes',
        xpReward: 400,
        isActive: true
      },
      {
        name: 'Campeão',
        description: 'Fique em 1º lugar no ranking',
        icon: 'http://localhost:3001/assets/images/aiAtivo 19medals.svg',
        category: 'Competição',
        rarity: 'legendary',
        color: '#8E44AD',
        requirement: '1º lugar no ranking',
        xpReward: 1200,
        isActive: true
      },
      {
        name: 'Invencível',
        description: 'Mantenha o 1º lugar por 7 dias',
        icon: 'http://localhost:3001/assets/images/aiAtivo 20medals.svg',
        category: 'Domínio',
        rarity: 'legendary',
        color: '#E67E22',
        requirement: '7 dias no topo',
        xpReward: 1500,
        isActive: true
      },
      {
        name: 'Mentor',
        description: 'Ajude 10 colegas no chat',
        icon: 'http://localhost:3001/assets/images/aiAtivo 21medals.svg',
        category: 'Social',
        rarity: 'rare',
        color: '#16A085',
        requirement: '10 ajudas no chat',
        xpReward: 350,
        isActive: true
      },
      {
        name: 'Líder',
        description: 'Seja o mais ativo por 1 mês',
        icon: 'http://localhost:3001/assets/images/aiAtivo 22medals.svg',
        category: 'Liderança',
        rarity: 'epic',
        color: '#27AE60',
        requirement: 'Mais ativo por 30 dias',
        xpReward: 700,
        isActive: true
      },
      {
        name: 'Estrategista',
        description: 'Complete todos os tutoriais',
        icon: 'http://localhost:3001/assets/images/aiAtivo 23medals.svg',
        category: 'Conhecimento',
        rarity: 'rare',
        color: '#2980B9',
        requirement: 'Todos os tutoriais',
        xpReward: 250,
        isActive: true
      },
      {
        name: 'Fenômeno',
        description: 'Quebre 5 recordes pessoais',
        icon: 'http://localhost:3001/assets/images/aiAtivo 24medals.svg',
        category: 'Superação',
        rarity: 'epic',
        color: '#D35400',
        requirement: '5 recordes quebrados',
        xpReward: 650,
        isActive: true
      },
      {
        name: 'Ídolo',
        description: 'Seja mencionado 20 vezes no chat',
        icon: 'http://localhost:3001/assets/images/aiAtivo 25medals.svg',
        category: 'Reconhecimento',
        rarity: 'legendary',
        color: '#C0392B',
        requirement: '20 menções positivas',
        xpReward: 900,
        isActive: true
      },
      {
        name: 'Lenda Eterna',
        description: 'Complete todas as conquistas',
        icon: 'http://localhost:3001/assets/images/aiAtivo 26medals.svg',
        category: 'Supremo',
        rarity: 'mythic',
        color: '#8E44AD',
        requirement: 'Todas as conquistas',
        xpReward: 2000,
        isActive: true
      }
    ];

    // Criar medalhas
    for (const medal of medals) {
      await prisma.medal.create({ data: medal });
    }
    console.log(`✅ ${medals.length} medalhas criadas`);

    // Criar conquistas
    for (const achievement of achievements) {
      await prisma.achievement.create({ data: achievement });
    }
    console.log(`✅ ${achievements.length} conquistas criadas`);

    // Criar personalizações de card
    const customizations = [
      {
        name: 'default',
        description: 'Card padrão',
        type: 'background',
        rarity: 'common',
        unlockType: 'xp',
        unlockValue: 0,
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'champion',
        description: 'Fundo de campeão',
        type: 'background',
        rarity: 'rare',
        unlockType: 'medal',
        unlockValue: 1,
        unlockTarget: 'Campeão',
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'legend',
        description: 'Fundo lendário',
        type: 'background',
        rarity: 'legendary',
        unlockType: 'medal',
        unlockValue: 1,
        unlockTarget: 'Lenda',
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'golden',
        description: 'Fundo dourado',
        type: 'background',
        rarity: 'epic',
        unlockType: 'xp',
        unlockValue: 5000,
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'starry',
        description: 'Fundo estrelado',
        type: 'background',
        rarity: 'rare',
        unlockType: 'achievement',
        unlockValue: 1,
        unlockTarget: 'Primeira Estrela',
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'ocean',
        description: 'Fundo oceânico',
        type: 'background',
        rarity: 'epic',
        unlockType: 'xp',
        unlockValue: 10000,
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'forest',
        description: 'Fundo florestal',
        type: 'background',
        rarity: 'rare',
        unlockType: 'xp',
        unlockValue: 7500,
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'fire',
        description: 'Fundo flamejante',
        type: 'background',
        rarity: 'epic',
        unlockType: 'achievement',
        unlockValue: 1,
        unlockTarget: 'Fenômeno',
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'ice',
        description: 'Fundo gelado',
        type: 'background',
        rarity: 'rare',
        unlockType: 'xp',
        unlockValue: 8000,
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'rainbow',
        description: 'Fundo arco-íris',
        type: 'background',
        rarity: 'legendary',
        unlockType: 'achievement',
        unlockValue: 1,
        unlockTarget: 'Lenda Eterna',
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'none',
        description: 'Sem animação',
        type: 'animation',
        rarity: 'common',
        unlockType: 'xp',
        unlockValue: 0,
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'brilho',
        description: 'Efeito de brilho',
        type: 'animation',
        rarity: 'rare',
        unlockType: 'xp',
        unlockValue: 3000,
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'sparkle',
        description: 'Efeito de faíscas',
        type: 'animation',
        rarity: 'epic',
        unlockType: 'achievement',
        unlockValue: 1,
        unlockTarget: 'Perfeccionista',
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      },
      {
        name: 'arco-íris',
        description: 'Efeito arco-íris',
        type: 'animation',
        rarity: 'legendary',
        unlockType: 'achievement',
        unlockValue: 1,
        unlockTarget: 'Lenda Eterna',
        preview: 'src/assets/images/CardScores.svg',
        isActive: true
      }
    ];

    for (const customization of customizations) {
      await prisma.cardCustomization.create({ data: customization });
    }
    console.log(`✅ ${customizations.length} personalizações criadas`);

    console.log('🎉 Seed de medalhas e conquistas concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMedalsAndAchievements();
