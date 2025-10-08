const express = require('express');
const { supabase } = require('../supabase');
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('userType')
      .eq('id', userId)
      .single();

    if (userError || !user || user.userType !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta funcionalidade'
      });
    }

    // Buscar todos os esportes ativos
    const { data: allSports, error: sportsError } = await supabase
      .from('sports')
      .select('id, name, icon, color')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (sportsError) {
      console.error('Erro ao buscar esportes:', sportsError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar esportes'
      });
    }

    // Para cada esporte, buscar pontuações das aulas
    const sportsWithScores = await Promise.all(
      allSports.map(async (sport) => {
        // Buscar pontuações das aulas para este esporte
        const { data: classScores, error: scoresError } = await supabase
          .from('class_scores')
          .select(`
            *,
            classes:class_id (
              id, name, school, grade
            ),
            teachers:teacher_id (
              id, name
            )
          `)
          .eq('student_id', userId)
          .eq('sport_id', sport.id)
          .order('created_at', { ascending: false });

        if (scoresError) {
          console.error('Erro ao buscar pontuações:', scoresError);
          return {
            sport: sport,
            totalScore: 0,
            averageScore: 0,
            totalClasses: 0,
            scores: []
          };
        }

        // Calcular pontuação total e média
        const totalScore = classScores.reduce((sum, score) => sum + score.score, 0);
        const averageScore = classScores.length > 0 ? Math.round(totalScore / classScores.length) : 0;
        const totalClasses = classScores.length;

        return {
          sport: sport,
          totalScore,
          averageScore,
          totalClasses,
          scores: classScores.map(score => ({
            ...score,
            class: score.classes,
            teacher: score.teachers
          }))
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

// Buscar ranking da turma do aluno
router.get('/student/ranking', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verificar se é aluno
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('userType')
      .eq('id', userId)
      .single();

    if (userError || !user || user.userType !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta funcionalidade'
      });
    }

    // Buscar a turma do aluno
    const { data: classStudent, error: classError } = await supabase
      .from('class_students')
      .select(`
        *,
        classes:class_id (
          id, name, school, grade
        )
      `)
      .eq('student_id', userId)
      .eq('is_active', true)
      .single();

    if (classError || !classStudent) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não está matriculado em nenhuma turma'
      });
    }

    // Buscar todos os alunos da turma
    const { data: allClassStudents, error: studentsError } = await supabase
      .from('class_students')
      .select(`
        *,
        students:student_id (
          id, name, email, avatar, card_banner
        )
      `)
      .eq('class_id', classStudent.class_id)
      .eq('is_active', true);

    if (studentsError) {
      console.error('Erro ao buscar alunos da turma:', studentsError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar alunos da turma'
      });
    }

    // Calcular pontuação total de cada aluno
    const rankingData = await Promise.all(
      allClassStudents.map(async (classStudentItem) => {
        const studentId = classStudentItem.student_id;
        
        // Buscar todas as pontuações do aluno em todos os esportes
        const { data: allScores, error: scoresError } = await supabase
          .from('class_scores')
          .select(`
            *,
            sports:sport_id (
              name
            )
          `)
          .eq('student_id', studentId)
          .eq('class_id', classStudent.class_id);

        if (scoresError) {
          console.error('Erro ao buscar pontuações:', scoresError);
          return {
            studentId,
            studentName: classStudentItem.students?.name || 'Aluno',
            studentEmail: classStudentItem.students?.email || '',
            studentAvatar: classStudentItem.students?.avatar || null,
            cardBanner: classStudentItem.students?.card_banner || 'Banner Padrão',
            totalScore: 0,
            totalClasses: 0,
            scores: []
          };
        }

        // Somar todas as pontuações
        const totalScore = allScores.reduce((sum, score) => sum + score.score, 0);
        const totalClasses = allScores.length;

        return {
          studentId,
          studentName: classStudentItem.students?.name || 'Aluno',
          studentEmail: classStudentItem.students?.email || '',
          studentAvatar: classStudentItem.students?.avatar || null,
          cardBanner: classStudentItem.students?.card_banner || 'Banner Padrão',
          totalScore,
          totalClasses,
          scores: allScores.map(score => ({
            sportName: score.sports?.name || 'Esporte',
            score: score.score,
            date: score.created_at
          }))
        };
      })
    );

    // Ordenar por pontuação total (maior para menor)
    rankingData.sort((a, b) => b.totalScore - a.totalScore);

    // Adicionar posição no ranking
    const rankingWithPosition = rankingData.map((student, index) => ({
      ...student,
      position: index + 1
    }));

    res.json({
      success: true,
      data: {
        classInfo: {
          id: classStudent.classes.id,
          name: classStudent.classes.name,
          school: classStudent.classes.school,
          grade: classStudent.classes.grade
        },
        ranking: rankingWithPosition,
        currentStudentId: userId
      }
    });

  } catch (error) {
    console.error('Erro ao buscar ranking da turma:', error);
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('userType')
      .eq('id', userId)
      .single();

    if (userError || !user || user.userType !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta funcionalidade'
      });
    }

    // Buscar a turma do aluno
    const { data: classStudent, error: classError } = await supabase
      .from('class_students')
      .select(`
        *,
        classes:class_id (
          *,
          teachers:teacher_id (
            id, name
          )
        )
      `)
      .eq('student_id', userId)
      .eq('is_active', true)
      .single();

    if (classError || !classStudent) {
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
    const { data: classClasses, error: classesError } = await supabase
      .from('teacher_classes')
      .select('*')
      .eq('class_id', classStudent.class_id)
      .order('date', { ascending: false })
      .limit(100);

    if (classesError) {
      console.error('Erro ao buscar aulas:', classesError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar aulas'
      });
    }

    // Buscar presenças do aluno
    const { data: attendances, error: attendanceError } = await supabase
      .from('attendances')
      .select(`
        *,
        classes:class_id (
          name
        )
      `)
      .eq('student_id', userId);

    if (attendanceError) {
      console.error('Erro ao buscar presenças:', attendanceError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar presenças'
      });
    }

    // Processar dados de presença
    const attendanceData = classClasses.map(classItem => {
      const classDate = new Date(classItem.date);
      const startOfDay = new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate());
      const endOfDay = new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate() + 1);

      const attendance = attendances.find(att => 
        att.class_id === classStudent.class_id &&
        new Date(att.lesson_date) >= startOfDay &&
        new Date(att.lesson_date) < endOfDay
      );

      if (attendance) {
        return {
          date: classItem.date,
          isPresent: attendance.isPresent,
          classSubject: classItem.subject,
          teacherName: classStudent.classes.teachers?.name || 'Professor',
          notes: attendance.notes
        };
      }
      return null;
    }).filter(item => item !== null);

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
        recentAttendance: attendanceData.slice(0, 7),
        streak,
        classInfo: {
          name: classStudent.classes.name,
          school: classStudent.classes.school,
          grade: classStudent.classes.grade,
          teacher: classStudent.classes.teachers?.name || 'Professor'
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
