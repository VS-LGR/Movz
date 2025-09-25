const express = require('express');
const prisma = require('../prisma');
// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso necessário'
    });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    req.user = user;
    next();
  });
};

const router = express.Router();

// Registrar pontuação do usuário
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { sportId, score, level } = req.body;
    const userId = req.user.userId;

    if (!sportId || score === undefined || level === undefined) {
      return res.status(400).json({
        success: false,
        message: 'SportId, score e level são obrigatórios'
      });
    }

    if (score < 0 || level < 1) {
      return res.status(400).json({
        success: false,
        message: 'Score deve ser >= 0 e level >= 1'
      });
    }

    // Verificar se o esporte existe
    const sport = await prisma.sport.findUnique({
      where: { id: sportId }
    });

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Esporte não encontrado'
      });
    }

    // Verificar se o usuário está inscrito no esporte
    const userSport = await prisma.userSport.findFirst({
      where: {
        userId,
        sportId,
        isActive: true
      }
    });

    if (!userSport) {
      return res.status(403).json({
        success: false,
        message: 'Você precisa estar inscrito no esporte para registrar pontuação'
      });
    }

    // Buscar pontuação anterior
    const existingScore = await prisma.userScore.findFirst({
      where: {
        userId,
        sportId
      },
      orderBy: { createdAt: 'desc' }
    });

    // Se a nova pontuação for maior, atualizar
    if (existingScore && score <= existingScore.score) {
      return res.json({
        success: true,
        message: 'Pontuação não foi atualizada (não é maior que a anterior)',
        data: { userScore: existingScore }
      });
    }

    // Criar ou atualizar pontuação
    const userScore = await prisma.userScore.upsert({
      where: {
        userId_sportId: {
          userId,
          sportId
        }
      },
      update: {
        score,
        level
      },
      create: {
        userId,
        sportId,
        score,
        level
      },
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Pontuação registrada com sucesso',
      data: { userScore }
    });

  } catch (error) {
    console.error('Erro ao registrar pontuação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar pontuações do usuário
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const userScores = await prisma.userScore.findMany({
      where: { userId },
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { score: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.userScore.count({
      where: { userId }
    });

    res.json({
      success: true,
      data: {
        userScores,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar pontuações do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar pontuação específica do usuário em um esporte
router.get('/user/:sportId', authenticateToken, async (req, res) => {
  try {
    const { sportId } = req.params;
    const userId = req.user.userId;

    const userScore = await prisma.userScore.findFirst({
      where: {
        userId,
        sportId
      },
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!userScore) {
      return res.status(404).json({
        success: false,
        message: 'Pontuação não encontrada para este esporte'
      });
    }

    res.json({
      success: true,
      data: { userScore }
    });

  } catch (error) {
    console.error('Erro ao buscar pontuação específica:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar ranking geral
router.get('/ranking', async (req, res) => {
  try {
    const { sportId, limit = 50, offset = 0 } = req.query;

    const whereClause = sportId ? { sportId } : {};

    const rankings = await prisma.userScore.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        sport: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { level: 'desc' },
        { createdAt: 'asc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.userScore.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        rankings,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar estatísticas de pontuação
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      totalScores,
      averageScore,
      highestScore,
      totalLevels,
      scoresBySport
    ] = await Promise.all([
      prisma.userScore.count({
        where: { userId }
      }),
      prisma.userScore.aggregate({
        where: { userId },
        _avg: { score: true }
      }),
      prisma.userScore.findFirst({
        where: { userId },
        orderBy: { score: 'desc' },
        include: {
          sport: {
            select: {
              name: true,
              icon: true,
              color: true
            }
          }
        }
      }),
      prisma.userScore.aggregate({
        where: { userId },
        _sum: { level: true }
      }),
      prisma.userScore.groupBy({
        by: ['sportId'],
        where: { userId },
        _max: { score: true },
        _sum: { level: true },
        orderBy: { _max: { score: 'desc' } }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalScores,
        averageScore: averageScore._avg.score || 0,
        highestScore: highestScore || null,
        totalLevels: totalLevels._sum.level || 0,
        scoresBySport
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar pontuações do aluno por esporte (incluindo pontuações das aulas)
router.get('/student/sports', authenticateToken, async (req, res) => {
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

    // Buscar esportes do aluno
    const userSports = await prisma.userSport.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    });

    // Para cada esporte, buscar pontuações das aulas
    const sportsWithScores = await Promise.all(
      userSports.map(async (userSport) => {
        // Buscar pontuações das aulas para este esporte
        const classScores = await prisma.classScore.findMany({
          where: {
            studentId: userId,
            sportId: userSport.sportId
          },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                school: true,
                grade: true
              }
            },
            teacher: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Calcular pontuação total e média
        const totalScore = classScores.reduce((sum, score) => sum + score.score, 0);
        const averageScore = classScores.length > 0 ? Math.round(totalScore / classScores.length) : 0;
        const totalClasses = classScores.length;

        return {
          sport: userSport.sport,
          totalScore,
          averageScore,
          totalClasses,
          scores: classScores
        };
      })
    );

    res.json({
      success: true,
      data: sportsWithScores
    });

  } catch (error) {
    console.error('Erro ao buscar pontuações do aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
