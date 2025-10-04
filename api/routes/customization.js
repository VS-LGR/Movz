const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  console.log('🔍 Customization Auth - Headers:', req.headers);
  const authHeader = req.headers['authorization'];
  console.log('🔍 Customization Auth - Auth Header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('🔍 Customization Auth - Token:', token);

  if (!token) {
    console.log('❌ Customization Auth - No token provided');
    return res.status(401).json({
      success: false,
      message: 'Token de acesso necessário'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    console.log('🔍 Customization Auth - JWT Secret:', process.env.JWT_SECRET || 'fallback-secret');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('✅ Customization Auth - Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Customization Auth - Token verification failed:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Buscar dados de XP e personalização do aluno
router.get('/student/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verificar se é aluno
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    });

    if (!user || user.userType !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta funcionalidade'
      });
    }

    // Buscar dados completos do aluno
    const studentData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        totalXP: true,
        level: true,
        cardBackground: true,
        cardAnimation: true,
        createdAt: true
      }
    });

    // Buscar medalhas desbloqueadas
    const userMedals = await prisma.userMedal.findMany({
      where: { userId: userId, isActive: true },
      include: {
        medal: true
      },
      orderBy: { unlockedAt: 'desc' }
    });

    // Buscar conquistas desbloqueadas
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: userId, isActive: true },
      include: {
        achievement: true
      },
      orderBy: { unlockedAt: 'desc' }
    });

    // Buscar todas as medalhas disponíveis (6 medalhas)
    const allMedals = await prisma.medal.findMany({
      where: { isActive: true },
      orderBy: { xpReward: 'asc' }
    });
    // Buscar todas as conquistas disponíveis (16 conquistas)
    const allAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { xpReward: 'asc' }
    });

    // Buscar personalizações disponíveis
    const availableCustomizations = await prisma.cardCustomization.findMany({
      where: { isActive: true },
      orderBy: { unlockValue: 'asc' }
    });

    // Calcular estatísticas
    const totalMedals = allMedals.length;
    const unlockedMedals = userMedals.length;
    const totalAchievements = allAchievements.length;
    const unlockedAchievements = userAchievements.length;

    // Calcular XP necessário para próximo nível
    const currentLevel = studentData.level;
    const xpForNextLevel = currentLevel * 1000; // 1000 XP por nível
    const xpProgress = studentData.totalXP % 1000;
    const xpNeeded = xpForNextLevel - studentData.totalXP;

    const responseData = {
      success: true,
      data: {
        student: studentData,
        medals: {
          unlocked: userMedals.map(um => um.medal),
          all: allMedals,
          available: allMedals,
          stats: {
            total: totalMedals,
            unlocked: unlockedMedals,
            percentage: totalMedals > 0 ? Math.round((unlockedMedals / totalMedals) * 100) : 0
          }
        },
        achievements: {
          unlocked: userAchievements.map(ua => ua.achievement),
          all: allAchievements,
          available: allAchievements,
          stats: {
            total: totalAchievements,
            unlocked: unlockedAchievements,
            percentage: totalAchievements > 0 ? Math.round((unlockedAchievements / totalAchievements) * 100) : 0
          }
        },
        customizations: availableCustomizations,
        xp: {
          current: studentData.totalXP,
          level: currentLevel,
          progress: xpProgress,
          needed: xpNeeded,
          nextLevel: currentLevel + 1
        }
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Erro ao buscar perfil do aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar personalização do card
router.put('/student/card', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { background, animation } = req.body;

    // Verificar se é aluno
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    });

    if (!user || user.userType !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta funcionalidade'
      });
    }

    // Verificar se as personalizações estão desbloqueadas
    if (background) {
      const bgCustomization = await prisma.cardCustomization.findFirst({
        where: { 
          name: background,
          type: 'background',
          isActive: true
        }
      });

      if (!bgCustomization) {
        return res.status(400).json({
          success: false,
          message: 'Personalização de fundo não encontrada'
        });
      }

      // Verificar se está desbloqueada
      const isUnlocked = await checkCustomizationUnlocked(userId, bgCustomization);
      if (!isUnlocked) {
        return res.status(403).json({
          success: false,
          message: 'Esta personalização ainda não foi desbloqueada'
        });
      }
    }

    if (animation) {
      const animCustomization = await prisma.cardCustomization.findFirst({
        where: { 
          name: animation,
          type: 'animation',
          isActive: true
        }
      });

      if (!animCustomization) {
        return res.status(400).json({
          success: false,
          message: 'Personalização de animação não encontrada'
        });
      }

      // Verificar se está desbloqueada
      const isUnlocked = await checkCustomizationUnlocked(userId, animCustomization);
      if (!isUnlocked) {
        return res.status(403).json({
          success: false,
          message: 'Esta personalização ainda não foi desbloqueada'
        });
      }
    }

    // Atualizar personalizações
    const updateData = {};
    if (background) updateData.cardBackground = background;
    if (animation) updateData.cardAnimation = animation;

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Personalização atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar personalização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Função auxiliar para verificar se personalização está desbloqueada
async function checkCustomizationUnlocked(userId, customization) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXP: true }
  });

  switch (customization.unlockType) {
    case 'xp':
      return user.totalXP >= customization.unlockValue;
    
    case 'achievement':
      if (!customization.unlockTarget) return false;
      const achievement = await prisma.achievement.findFirst({
        where: { name: customization.unlockTarget }
      });
      if (!achievement) return false;
      
      const userAchievement = await prisma.userAchievement.findFirst({
        where: { 
          userId: userId,
          achievementId: achievement.id,
          isActive: true
        }
      });
      return !!userAchievement;
    
    case 'medal':
      if (!customization.unlockTarget) return false;
      const medal = await prisma.medal.findFirst({
        where: { name: customization.unlockTarget }
      });
      if (!medal) return false;
      
      const userMedal = await prisma.userMedal.findFirst({
        where: { 
          userId: userId,
          medalId: medal.id,
          isActive: true
        }
      });
      return !!userMedal;
    
    default:
      return false;
  }
}

// Calcular e atualizar XP do aluno
router.post('/student/calculate-xp', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verificar se é aluno
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    });

    if (!user || user.userType !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta funcionalidade'
      });
    }

    // Buscar todas as pontuações do aluno
    const scores = await prisma.classScore.findMany({
      where: { studentId: userId },
      include: {
        sport: true
      }
    });

    // Calcular XP baseado nas pontuações
    let totalXP = 0;
    const xpBreakdown = [];

    scores.forEach(score => {
      // XP baseado na pontuação (1 XP por ponto)
      const scoreXP = score.score;
      totalXP += scoreXP;
      
      xpBreakdown.push({
        sport: score.sport.name,
        score: score.score,
        xp: scoreXP,
        date: score.createdAt
      });
    });

    // Calcular nível baseado no XP total
    const newLevel = Math.floor(totalXP / 1000) + 1;

    // Atualizar XP e nível do aluno
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: totalXP,
        level: newLevel
      }
    });

    // Verificar conquistas e medalhas desbloqueadas
    await checkAndUnlockAchievements(userId);
    await checkAndUnlockMedals(userId);

    res.json({
      success: true,
      data: {
        totalXP: totalXP,
        level: newLevel,
        xpBreakdown: xpBreakdown
      }
    });

  } catch (error) {
    console.error('Erro ao calcular XP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Função para verificar e desbloquear conquistas
async function checkAndUnlockAchievements(userId) {
  const achievements = await prisma.achievement.findMany({
    where: { isActive: true }
  });

  for (const achievement of achievements) {
    const alreadyUnlocked = await prisma.userAchievement.findFirst({
      where: {
        userId: userId,
        achievementId: achievement.id,
        isActive: true
      }
    });

    if (alreadyUnlocked) continue;

    let shouldUnlock = false;

    // Verificar requisitos baseados no nome da conquista
    switch (achievement.name) {
      case 'Primeira Estrela':
        const firstScore = await prisma.classScore.findFirst({
          where: { studentId: userId }
        });
        shouldUnlock = !!firstScore;
        break;

      case 'Guerreiro':
        const recentScores = await prisma.classScore.findMany({
          where: { studentId: userId },
          orderBy: { createdAt: 'desc' },
          take: 5
        });
        shouldUnlock = recentScores.length >= 5;
        break;

      case 'Mestre':
        const masterScores = await prisma.classScore.findMany({
          where: { studentId: userId }
        });
        shouldUnlock = masterScores.length >= 25;
        break;

      case 'Lenda Viva':
        const legendScores = await prisma.classScore.findMany({
          where: { studentId: userId }
        });
        shouldUnlock = legendScores.length >= 100;
        break;
    }

    if (shouldUnlock) {
      await prisma.userAchievement.create({
        data: {
          userId: userId,
          achievementId: achievement.id
        }
      });

      // Adicionar XP da conquista
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalXP: {
            increment: achievement.xpReward
          }
        }
      });
    }
  }
}

// Função para verificar e desbloquear medalhas
async function checkAndUnlockMedals(userId) {
  const medals = await prisma.medal.findMany({
    where: { isActive: true }
  });

  for (const medal of medals) {
    const alreadyUnlocked = await prisma.userMedal.findFirst({
      where: {
        userId: userId,
        medalId: medal.id,
        isActive: true
      }
    });

    if (alreadyUnlocked) continue;

    let shouldUnlock = false;

    // Verificar requisitos baseados no nome da medalha
    switch (medal.name) {
      case 'Primeiro Passo':
        const firstClass = await prisma.classScore.findFirst({
          where: { studentId: userId }
        });
        shouldUnlock = !!firstClass;
        break;

      case 'Maratonista':
        const marathonClasses = await prisma.classScore.findMany({
          where: { studentId: userId }
        });
        shouldUnlock = marathonClasses.length >= 10;
        break;

      case 'Campeão':
        const championClasses = await prisma.classScore.findMany({
          where: { studentId: userId }
        });
        shouldUnlock = championClasses.length >= 50;
        break;

      case 'Lenda':
        const legendClasses = await prisma.classScore.findMany({
          where: { studentId: userId }
        });
        shouldUnlock = legendClasses.length >= 100;
        break;
    }

    if (shouldUnlock) {
      await prisma.userMedal.create({
        data: {
          userId: userId,
          medalId: medal.id
        }
      });

      // Adicionar XP da medalha
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalXP: {
            increment: medal.xpReward
          }
        }
      });
    }
  }
}

module.exports = router;
