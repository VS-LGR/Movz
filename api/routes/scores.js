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
router.get('/ranking', authenticateToken, async (req, res) => {
  try {
    const { sportId, limit = 50, offset = 0 } = req.query;

    let whereClause = sportId ? { sportId } : {};
    
    // Se for uma instituição, filtrar apenas usuários da instituição
    if (req.user.userType === 'INSTITUTION') {
      whereClause.user = {
        institutionId: req.user.institutionId
      };
    }

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

    // Buscar todos os esportes ativos (não apenas os inscritos)
    const allSports = await prisma.sport.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Para cada esporte, buscar pontuações das aulas
    const sportsWithScores = await Promise.all(
      allSports.map(async (sport) => {
        // Buscar pontuações das aulas para este esporte
        const classScores = await prisma.classScore.findMany({
          where: {
            studentId: userId,
            sportId: sport.id
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
          sport: sport,
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

// Buscar dados de presença do aluno
router.get('/student/attendance', authenticateToken, async (req, res) => {
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

    // Buscar a turma do aluno
    const classStudent = await prisma.classStudent.findFirst({
      where: {
        studentId: userId,
        isActive: true
      },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!classStudent) {
      return res.json({
        success: true,
        data: {
          attendanceRate: 0,
          totalClasses: 0,
          presentClasses: 0,
          absentClasses: 0,
          recentAttendance: [],
          streak: 0
        },
        message: 'Aluno não está em nenhuma turma ativa'
      });
    }

    // Buscar aulas da turma do aluno
    const classClasses = await prisma.teacherClass.findMany({
      where: {
        classId: classStudent.classId,
        isCompleted: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 30 // Últimas 30 aulas
    });

    // Buscar presenças do aluno (simulando com base nas pontuações)
    // Se o aluno tem pontuação na aula, significa que esteve presente
    const attendanceData = await Promise.all(
      classClasses.map(async (classItem) => {
        const hasScore = await prisma.classScore.findFirst({
          where: {
            classId: classStudent.classId,
            studentId: userId,
            createdAt: {
              gte: classItem.date,
              lt: new Date(classItem.date.getTime() + 24 * 60 * 60 * 1000) // Dentro do mesmo dia
            }
          }
        });

        return {
          date: classItem.date,
          isPresent: !!hasScore,
          classSubject: classItem.subject,
          teacherName: classStudent.class.teacher.name
        };
      })
    );

    // Calcular estatísticas
    const totalClasses = attendanceData.length;
    const presentClasses = attendanceData.filter(a => a.isPresent).length;
    const absentClasses = totalClasses - presentClasses;
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // Calcular sequência de presenças
    let streak = 0;
    for (let i = 0; i < attendanceData.length; i++) {
      if (attendanceData[i].isPresent) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        attendanceRate,
        totalClasses,
        presentClasses,
        absentClasses,
        recentAttendance: attendanceData.slice(0, 7), // Últimos 7 dias
        streak,
        classInfo: {
          name: classStudent.class.name,
          school: classStudent.class.school,
          grade: classStudent.class.grade,
          teacher: classStudent.class.teacher.name
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar presença do aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
