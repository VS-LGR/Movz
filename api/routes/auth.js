const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, generateId } = require('../supabase');

const router = express.Router();

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso necessário'
    });
  }

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

// Registrar usuário
router.post('/register', async (req, res) => {
  try {
    console.log('Register endpoint called with:', req.body);
    const { name, email, password, age, school, class: userClass, cpf, userType = 'STUDENT' } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Validar CPF se fornecido
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        return res.status(400).json({
          success: false,
          message: 'CPF deve ter 11 dígitos'
        });
      }
      
      // Verificar se CPF já existe
    const { data: existingCpf } = await supabase
      .from('users')
      .select('id')
      .eq('cpf', cleanCpf)
      .single();
      
      if (existingCpf) {
        return res.status(409).json({
          success: false,
          message: 'Este CPF já está cadastrado'
        });
      }
    }

    // Validar tipo de usuário
    if (!['STUDENT', 'TEACHER'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de usuário inválido'
      });
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este email já está cadastrado'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
             const userId = generateId();
             const now = new Date().toISOString();
             const { data: user, error: createError } = await supabase
               .from('users')
               .insert({
                 id: userId,
        name,
        email,
        password: hashedPassword,
        cpf: cpf ? cpf.replace(/\D/g, '') : null,
        age: age ? parseInt(age) : null,
        school: school || null,
        class: userClass || null,
                 userType: userType,
                 createdAt: now,
                 updatedAt: now
               })
      .select('id, name, email, cpf, age, school, class, avatar, userType, createdAt')
      .single();

    if (createError) {
      console.error('Erro ao criar usuário:', createError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar usuário'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType = 'STUDENT' } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se o tipo de usuário corresponde
    if (user.userType !== userType) {
      const userTypeNames = {
        'STUDENT': 'estudante',
        'TEACHER': 'professor',
        'INSTITUTION': 'instituição'
      };
      return res.status(401).json({
        success: false,
        message: `Credenciais inválidas para ${userTypeNames[userType] || userType.toLowerCase()}`
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Retornar dados do usuário (sem senha)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Verificar se é instituição ou usuário
    if (req.user.userType === 'INSTITUTION') {
      const institution = await prisma.institution.findUnique({
        where: { id: req.user.institutionId },
        select: {
          id: true,
          name: true,
          email: true,
          cnpj: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          description: true,
          createdAt: true
        }
      });

      if (!institution) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido - instituição não encontrada'
        });
      }

      return res.json({
        success: true,
        data: {
          ...institution,
          userType: 'INSTITUTION'
        }
      });
    }

    // Para usuários normais
    const userId = req.user.userId || req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido - ID do usuário não encontrado'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        school: true,
        class: true,
        avatar: true,
        userType: true,
        institutionId: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido - usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Erro na verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar turma do aluno
router.get('/student/class', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 Student Class - Recebendo requisição');
    console.log('🔵 Student Class - UserId:', req.user.userId);
    
    const userId = req.user.userId;

    // Verificar se o usuário é um aluno
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('userType')
      .eq('id', userId)
      .single();

    if (userError || !user || user.userType !== 'STUDENT') {
      console.log('❌ Student Class - Usuário não é aluno:', userError);
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta funcionalidade'
      });
    }

    console.log('🔵 Student Class - Buscando turma do aluno...');

    // Buscar a turma ativa do aluno usando camelCase
    const { data: classStudent, error: classError } = await supabase
      .from('class_students')
      .select(`
        *,
        class:classes(
          *,
          teacher:users(
            id, name, email, avatar
          )
        )
      `)
      .eq('studentId', userId)
      .eq('isActive', true)
      .single();

    console.log('🔵 Student Class - Resultado da busca:', { classStudent, classError });

    if (classError || !classStudent) {
      console.log('❌ Student Class - Aluno não está em nenhuma turma:', classError);
      return res.json({
        success: true,
        data: null,
        message: 'Aluno não está em nenhuma turma ativa'
      });
    }

    // Buscar colegas de turma separadamente
    const { data: classmates, error: classmatesError } = await supabase
      .from('class_students')
      .select(`
        *,
        student:users(
          id, name, email, age, avatar
        )
      `)
      .eq('classId', classStudent.classId)
      .eq('isActive', true)
      .neq('studentId', userId); // Excluir o próprio aluno

    console.log('🔵 Student Class - Colegas encontrados:', classmates?.length || 0);

    res.json({
      success: true,
      data: {
        class: classStudent.class,
        teacher: classStudent.class.teacher,
        classmates: (classmates || []).map(cs => cs.student)
      }
    });

  } catch (error) {
    console.error('❌ Student Class - Erro ao buscar turma do aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar pontuações do aluno por esporte
router.get('/student/sports-scores', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 StudentSportsScores - Recebendo requisição');
    console.log('🔵 StudentSportsScores - User:', req.user);
    
    const userId = req.user.userId;
    
    // 1. Buscar TODOS os esportes ativos primeiro
    const { data: allSports, error: sportsError } = await supabase
      .from('sports')
      .select('id, name, color, icon')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (sportsError) {
      console.log('❌ StudentSportsScores - Erro ao buscar esportes:', sportsError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar esportes'
      });
    }

    console.log('🔵 StudentSportsScores - Esportes encontrados:', allSports.length);

    // 2. Buscar pontuações do aluno
    const { data: scores, error: scoresError } = await supabase
      .from('class_scores')
      .select(`
        id,
        score,
        notes,
        lessonDate,
        createdAt,
        sportId,
        class:classes!class_scores_classId_fkey(
          id, name
        )
      `)
      .eq('studentId', userId)
      .order('createdAt', { ascending: false });

    if (scoresError) {
      console.log('❌ StudentSportsScores - Erro ao buscar pontuações:', scoresError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar pontuações'
      });
    }

    console.log('🔵 StudentSportsScores - Pontuações encontradas:', scores.length);

    // 3. Agrupar pontuações por esporte
    const scoresBySport = {};
    scores.forEach(score => {
      const sportId = score.sportId;
      
      if (!scoresBySport[sportId]) {
        scoresBySport[sportId] = [];
      }
      
      scoresBySport[sportId].push({
        id: score.id,
        score: score.score,
        notes: score.notes,
        lessonDate: score.lessonDate,
        createdAt: score.createdAt,
        className: score.class.name
      });
    });

    // 4. Criar dados completos para todos os esportes
    const sportsData = allSports.map(sport => {
      const sportScores = scoresBySport[sport.id] || [];
      const totalScore = sportScores.reduce((sum, score) => sum + score.score, 0);
      const totalClasses = sportScores.length;
      const averageScore = totalClasses > 0 ? Math.round(totalScore / totalClasses) : 0;

      return {
        sport: {
          id: sport.id,
          name: sport.name,
          color: sport.color || '#F9BB55',
          icon: sport.icon || '🏅'
        },
        scores: sportScores,
        totalScore,
        totalClasses,
        averageScore
      };
    });

    console.log('🔵 StudentSportsScores - Esportes processados:', sportsData.length);
    console.log('🔵 StudentSportsScores - Esportes com pontuação:', sportsData.filter(s => s.totalClasses > 0).length);
    console.log('🔵 StudentSportsScores - Esportes sem pontuação:', sportsData.filter(s => s.totalClasses === 0).length);

    res.json({
      success: true,
      data: sportsData
    });

  } catch (error) {
    console.error('❌ StudentSportsScores - Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar dados de presença do aluno
router.get('/student/attendance', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 StudentAttendance - Recebendo requisição');
    console.log('🔵 StudentAttendance - User:', req.user);
    
    const userId = req.user.userId;
    
    // Buscar todas as presenças do aluno usando Supabase
    const { data: attendances, error: attendancesError } = await supabase
      .from('attendances')
      .select(`
        id,
        isPresent,
        lessonDate,
        notes,
        createdAt,
        class:classes!attendances_classId_fkey(
          id, name
        ),
        teacherClass:teacher_classes!attendances_teacherClassId_fkey(
          id, subject, date
        ),
        teacher:users!attendances_teacherId_fkey(
          id, name
        )
      `)
      .eq('studentId', userId)
      .order('lessonDate', { ascending: false });

    if (attendancesError) {
      console.log('❌ StudentAttendance - Erro ao buscar presenças:', attendancesError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar presenças'
      });
    }

    console.log('🔵 StudentAttendance - Presenças encontradas:', attendances.length);

    // Calcular estatísticas
    const totalClasses = attendances.length;
    const presentClasses = attendances.filter(a => a.isPresent).length;
    const absentClasses = totalClasses - presentClasses;
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // Calcular sequência atual (streak)
    let currentStreak = 0;
    for (let i = 0; i < attendances.length; i++) {
      if (attendances[i].isPresent) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Buscar informações da turma do aluno
    const { data: classStudent, error: classError } = await supabase
      .from('class_students')
      .select(`
        class:classes!class_students_classId_fkey(
          id, name, school, grade,
          teacher:users!classes_teacherId_fkey(
            id, name
          )
        )
      `)
      .eq('studentId', userId)
      .eq('isActive', true)
      .single();

    let classInfo = null;
    if (classStudent && classStudent.class) {
      classInfo = {
        name: classStudent.class.name,
        school: classStudent.class.school || 'N/A',
        grade: classStudent.class.grade || 'N/A',
        teacher: classStudent.class.teacher.name
      };
    }

    // Preparar histórico recente (últimas 10 presenças)
    const recentAttendance = attendances.slice(0, 10).map(attendance => ({
      id: attendance.id,
      date: attendance.lessonDate,
      isPresent: attendance.isPresent,
      classSubject: attendance.teacherClass?.subject || 'N/A',
      teacherName: attendance.teacher?.name || 'N/A',
      notes: attendance.notes
    }));

    const responseData = {
      totalClasses,
      presentClasses,
      absentClasses,
      attendanceRate,
      streak: currentStreak,
      classInfo,
      recentAttendance
    };

    console.log('🔵 StudentAttendance - Dados processados:', responseData);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ StudentAttendance - Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar conquistas e medalhas do aluno
router.get('/student/achievements', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 StudentAchievements - Recebendo requisição');
    console.log('🔵 StudentAchievements - User:', req.user);
    
    const userId = req.user.userId;
    
    // Buscar conquistas desbloqueadas do aluno
    const { data: userAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        id,
        unlockedAt,
        isActive,
        achievement:achievements!user_achievements_achievementId_fkey(
          id, name, description, icon, category, rarity, color, requirement, xpReward
        )
      `)
      .eq('userId', userId)
      .eq('isActive', true)
      .order('unlockedAt', { ascending: false });

    if (achievementsError) {
      console.log('❌ StudentAchievements - Erro ao buscar conquistas:', achievementsError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar conquistas'
      });
    }

    // Buscar medalhas desbloqueadas do aluno
    const { data: userMedals, error: medalsError } = await supabase
      .from('user_medals')
      .select(`
        id,
        unlockedAt,
        isActive,
        medal:medals!user_medals_medalId_fkey(
          id, name, description, icon, category, rarity, color, requirement, xpReward
        )
      `)
      .eq('userId', userId)
      .eq('isActive', true)
      .order('unlockedAt', { ascending: false });

    if (medalsError) {
      console.log('❌ StudentAchievements - Erro ao buscar medalhas:', medalsError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar medalhas'
      });
    }

    // Buscar todas as conquistas disponíveis para calcular porcentagem
    const { data: allAchievements, error: allAchievementsError } = await supabase
      .from('achievements')
      .select('id')
      .eq('isActive', true);

    // Buscar todas as medalhas disponíveis para calcular porcentagem
    const { data: allMedals, error: allMedalsError } = await supabase
      .from('medals')
      .select('id')
      .eq('isActive', true);

    const achievementsCount = userAchievements?.length || 0;
    const medalsCount = userMedals?.length || 0;
    const totalAchievements = allAchievements?.length || 0;
    const totalMedals = allMedals?.length || 0;

    const achievementsPercentage = totalAchievements > 0 ? Math.round((achievementsCount / totalAchievements) * 100) : 0;
    const medalsPercentage = totalMedals > 0 ? Math.round((medalsCount / totalMedals) * 100) : 0;

    const responseData = {
      achievements: {
        unlocked: userAchievements?.map(ua => ({
          id: ua.id,
          unlockedAt: ua.unlockedAt,
          ...ua.achievement
        })) || [],
        count: achievementsCount,
        total: totalAchievements,
        percentage: achievementsPercentage
      },
      medals: {
        unlocked: userMedals?.map(um => ({
          id: um.id,
          unlockedAt: um.unlockedAt,
          ...um.medal
        })) || [],
        count: medalsCount,
        total: totalMedals,
        percentage: medalsPercentage
      }
    };

    console.log('🔵 StudentAchievements - Dados processados:', {
      achievements: achievementsCount,
      medals: medalsCount,
      achievementsPercentage,
      medalsPercentage
    });

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ StudentAchievements - Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar ranking da turma do aluno
router.get('/student/ranking', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 StudentRanking - Recebendo requisição');
    console.log('🔵 StudentRanking - User:', req.user);
    
    const userId = req.user.userId;
    console.log('🔵 StudentRanking - Buscando turma do aluno...');
    console.log('🔵 StudentRanking - UserId:', userId);
    
    // Buscar a turma do aluno
    const { data: classStudent, error: classError } = await supabase
      .from('class_students')
      .select(`
        classId,
        class:classes!class_students_classId_fkey(
          id, name, school, grade,
          teacher:users!classes_teacherId_fkey(
            id, name, email, avatar
          )
        )
      `)
      .eq('studentId', userId)
      .eq('isActive', true)
      .single();

    console.log('🔵 StudentRanking - Resultado da busca de turma:', { classStudent, classError });

    if (classError || !classStudent) {
      console.log('❌ StudentRanking - Aluno não está em nenhuma turma:', classError);
      return res.status(404).json({
        success: false,
        message: 'Aluno não está em nenhuma turma ativa'
      });
    }

    console.log('✅ StudentRanking - Turma encontrada:', classStudent.class.name);
    console.log('🔵 StudentRanking - ClassId:', classStudent.classId);

    // Buscar todos os alunos da turma com suas pontuações
    const { data: classmates, error: classmatesError } = await supabase
      .from('class_students')
      .select(`
        studentId,
        student:users!class_students_studentId_fkey(
          id, name, email, avatar, totalXP, level, cardBanner, cardAnimation, cardBackground
        )
      `)
      .eq('classId', classStudent.classId)
      .eq('isActive', true);

    if (classmatesError) {
      console.log('❌ StudentRanking - Erro ao buscar colegas:', classmatesError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar ranking da turma'
      });
    }

    // Buscar pontuações de todos os alunos da turma
    const studentIds = classmates.map(cs => cs.studentId);
    const { data: allScores, error: scoresError } = await supabase
      .from('class_scores')
      .select('studentId, score')
      .in('studentId', studentIds);

    if (scoresError) {
      console.log('❌ StudentRanking - Erro ao buscar pontuações:', scoresError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar pontuações'
      });
    }

    // Calcular pontuação total por aluno
    const scoresByStudent = {};
    allScores.forEach(score => {
      if (!scoresByStudent[score.studentId]) {
        scoresByStudent[score.studentId] = 0;
      }
      scoresByStudent[score.studentId] += score.score;
    });

    // Preparar ranking
    const ranking = classmates.map(classmate => ({
      id: classmate.student.id,
      name: classmate.student.name,
      email: classmate.student.email,
      avatar: classmate.student.avatar,
      totalXP: classmate.student.totalXP || 0,
      level: classmate.student.level || 1,
      cardBanner: classmate.student.cardBanner || 'Banner Padrão',
      cardAnimation: classmate.student.cardAnimation || 'none',
      cardBackground: classmate.student.cardBackground || 'default',
      totalScore: scoresByStudent[classmate.studentId] || 0,
      isCurrentUser: classmate.studentId === userId
    }));

    // Ordenar por pontuação total (decrescente)
    ranking.sort((a, b) => b.totalScore - a.totalScore);

    // Adicionar posição no ranking
    ranking.forEach((student, index) => {
      student.position = index + 1;
    });

    const responseData = {
      class: {
        id: classStudent.class.id,
        name: classStudent.class.name,
        school: classStudent.class.school,
        grade: classStudent.class.grade,
        teacher: classStudent.class.teacher
      },
      ranking,
      totalStudents: ranking.length,
      currentUserPosition: ranking.find(s => s.isCurrentUser)?.position || 0
    };

    console.log('🔵 StudentRanking - Ranking processado:', {
      totalStudents: ranking.length,
      currentUserPosition: responseData.currentUserPosition
    });

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ StudentRanking - Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Logout (opcional - no JWT, o logout é feito no frontend)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

module.exports = router;
