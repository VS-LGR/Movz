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

// Middleware para verificar se é instituição
const requireInstitution = (req, res, next) => {
  if (req.user.userType !== 'INSTITUTION') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas instituições podem acessar esta funcionalidade.'
    });
  }
  next();
};

// ===== AUTENTICAÇÃO DE INSTITUIÇÃO =====

// Teste de conectividade com o banco
router.get('/test-db', async (req, res) => {
  try {
    console.log('🔵 Test DB - Testando conectividade...');
    
    // Teste simples de conectividade usando Supabase
    const { data: result, error } = await supabase
      .from('institutions')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Test DB - Erro de conectividade:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro de conectividade com o banco',
        error: error.message
      });
    }
    
    console.log('✅ Test DB - Conectividade OK');
    
    res.json({
      success: true,
      message: 'Banco de dados acessível',
      data: { test: 1 }
    });
  } catch (error) {
    console.error('❌ Test DB - Erro de conectividade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro de conectividade com o banco',
      error: error.message
    });
  }
});

// Registrar nova instituição
router.post('/register', async (req, res) => {
  try {
    console.log('🔵 Institution Register - Recebendo dados:', req.body);
    
    const {
      name,
      cnpj,
      email,
      password,
      phone,
      address,
      city,
      state,
      zipCode,
      description
    } = req.body;

    // Validações
    if (!name || !cnpj || !email || !password) {
      console.log('❌ Institution Register - Dados obrigatórios faltando:', { name, cnpj, email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Nome, CNPJ, email e senha são obrigatórios'
      });
    }

    // Verificar se CNPJ já existe usando Supabase
    const { data: existingInstitution } = await supabase
      .from('institutions')
      .select('id')
      .or(`cnpj.eq.${cnpj},email.eq.${email}`)
      .maybeSingle();

    if (existingInstitution) {
      return res.status(400).json({
        success: false,
        message: 'CNPJ ou email já cadastrado'
      });
    }

    // Hash da senha
    console.log('🔵 Institution Register - Fazendo hash da senha...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar instituição
    console.log('🔵 Institution Register - Criando instituição no banco...');
    const now = new Date().toISOString();
    const institutionData = {
      id: generateId(),
      name,
      cnpj,
      email,
      password: hashedPassword,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      description: description || null,
      updatedAt: now
    };
    
    console.log('🔵 Institution Register - Dados para criação:', { ...institutionData, password: '[HASHED]' });
    
    const { data: institution, error: createError } = await supabase
      .from('institutions')
      .insert([institutionData])
      .select()
      .single();

    if (createError) {
      console.error('❌ Institution Register - Erro ao criar instituição:', createError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: createError.message
      });
    }
    
    console.log('✅ Institution Register - Instituição criada com sucesso:', institution.id);

    res.status(201).json({
      success: true,
      message: 'Instituição registrada com sucesso',
      data: institution
    });

  } catch (error) {
    console.error('Erro ao registrar instituição:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Login de instituição
router.post('/login', async (req, res) => {
  try {
    console.log('🔵 Recebendo requisição de login da instituição');
    console.log('🔵 Headers:', req.headers);
    console.log('🔵 Body:', req.body);
    console.log('🔵 Content-Type:', req.get('Content-Type'));
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Email ou senha não fornecidos');
      console.log('❌ Email:', email);
      console.log('❌ Password:', password);
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar instituição usando Supabase
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('*')
      .eq('email', email)
      .single();

    if (institutionError || !institution || !institution.isActive) {
      console.log('❌ Instituição não encontrada ou inativa:', institutionError);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, institution.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar token
    const token = jwt.sign(
      {
        institutionId: institution.id,
        email: institution.email,
        userType: 'INSTITUTION'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        institution: {
          id: institution.id,
          name: institution.name,
          cnpj: institution.cnpj,
          email: institution.email,
          phone: institution.phone,
          address: institution.address,
          city: institution.city,
          state: institution.state,
          zipCode: institution.zipCode,
          description: institution.description
        }
      }
    });

  } catch (error) {
    console.error('Erro no login da instituição:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ===== GERENCIAMENTO DE USUÁRIOS =====

// Diagnóstico público de usuários (rota temporária para debug - SEM AUTENTICAÇÃO)
router.get('/users/debug', async (req, res) => {
  try {
    console.log('🔵 User Debug - Iniciando diagnóstico público');

    // Teste simples de conectividade usando Supabase
    const { count: totalUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log('🔵 User Debug - Teste de conectividade:', { totalUsers, countError });

    // Buscar usuários com CPF específico para testar
    const testCpf = '03382457237'; // CPF que você mencionou
    const { data: userWithCpf, error: userError } = await supabase
      .from('users')
      .select('id, name, email, cpf, userType, institutionId, isActive, createdAt')
      .eq('cpf', testCpf)
      .single();

    console.log('🔵 User Debug - Usuário com CPF teste:', userWithCpf);

    res.json({
      success: true,
      data: {
        connectivity: { total: totalUsers },
        testUser: userWithCpf,
        message: 'Diagnóstico básico concluído'
      }
    });

  } catch (error) {
    console.error('❌ User Debug - Erro no diagnóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Buscar usuário por CPF
router.get('/users/search', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 User Search - Recebendo requisição');
    console.log('🔵 User Search - Query:', req.query);
    console.log('🔵 User Search - User:', req.user);
    
    const { cpf } = req.query;

    if (!cpf) {
      console.log('❌ User Search - CPF não fornecido');
      return res.status(400).json({
        success: false,
        message: 'CPF é obrigatório'
      });
    }

    console.log('🔵 User Search - Buscando usuário com CPF:', cpf);
    console.log('🔵 User Search - InstitutionId:', req.user.institutionId);

    // Consulta usando Supabase: busca usuários por CPF
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, cpf, userType, institutionId')
      .eq('cpf', cpf)
      .eq('isActive', true)
      .single();

    console.log('🔵 User Search - Usuário encontrado:', user);

    if (userError || !user) {
      console.log('❌ User Search - Usuário não encontrado:', userError);
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se o usuário já está vinculado à instituição
    if (user.institutionId === req.user.institutionId) {
      console.log('⚠️ User Search - Usuário já vinculado à mesma instituição');
      // Para professores, permitir busca mesmo se já vinculado (para criação de turmas)
      if (user.userType === 'TEACHER') {
        console.log('✅ User Search - Professor já vinculado, mas permitindo busca para criação de turmas');
        return res.json({
          success: true,
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            cpf: user.cpf,
            userType: user.userType,
            institutionId: user.institutionId
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Usuário já está vinculado a esta instituição'
      });
    }

    // Verificar se o usuário está vinculado a outra instituição
    if (user.institutionId && user.institutionId !== req.user.institutionId) {
      console.log('❌ User Search - Usuário já vinculado a outra instituição:', user.institutionId);
      return res.status(400).json({
        success: false,
        message: 'Usuário já está vinculado a outra instituição'
      });
    }

    console.log('✅ User Search - Usuário disponível para vinculação:', user.name);
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        userType: user.userType,
        institutionId: user.institutionId
      }
    });

  } catch (error) {
    console.error('❌ User Search - Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Adicionar usuário à instituição
router.post('/users/:userId/add', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 Add User - Recebendo requisição');
    console.log('🔵 Add User - Params:', req.params);
    console.log('🔵 Add User - User:', req.user);
    
    const { userId } = req.params;

    // Verificar se usuário existe usando Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, institutionId')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.log('❌ Add User - Usuário não encontrado:', userError);
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se já está vinculado à mesma instituição
    if (user.institutionId === req.user.institutionId) {
      console.log('⚠️ Add User - Usuário já vinculado à mesma instituição');
      return res.status(400).json({
        success: false,
        message: 'Usuário já está vinculado a esta instituição'
      });
    }

    // Verificar se está vinculado a outra instituição
    if (user.institutionId && user.institutionId !== req.user.institutionId) {
      console.log('❌ Add User - Usuário já vinculado a outra instituição:', user.institutionId);
      return res.status(400).json({
        success: false,
        message: 'Usuário já está vinculado a outra instituição'
      });
    }

    // Vincular usuário à instituição usando Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ institutionId: req.user.institutionId })
      .eq('id', userId)
      .select('id, name, email, cpf, userType, institutionId')
      .single();

    if (updateError) {
      console.error('❌ Add User - Erro ao vincular usuário:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: updateError.message
      });
    }

    console.log('✅ Add User - Usuário adicionado com sucesso:', updatedUser.id);
    res.json({
      success: true,
      message: 'Usuário adicionado à instituição com sucesso',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        cpf: updatedUser.cpf,
        userType: updatedUser.userType,
        institutionId: updatedUser.institutionId
      }
    });

  } catch (error) {
    console.error('❌ Add User - Erro ao adicionar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Remover usuário da instituição
router.delete('/users/:userId/remove', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 Remove User - Recebendo requisição');
    console.log('🔵 Remove User - Params:', req.params);
    console.log('🔵 Remove User - User:', req.user);
    
    const { userId } = req.params;

    // Verificar se usuário pertence à instituição usando Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, institutionId')
      .eq('id', userId)
      .eq('institutionId', req.user.institutionId)
      .single();

    if (userError || !user) {
      console.log('❌ Remove User - Usuário não encontrado ou não pertence à instituição');
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado ou não pertence a esta instituição'
      });
    }

    // Remover vínculo usando Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ institutionId: null })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Remove User - Erro ao remover vínculo:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: updateError.message
      });
    }

    console.log('✅ Remove User - Usuário removido com sucesso:', userId);
    res.json({
      success: true,
      message: 'Usuário removido da instituição com sucesso'
    });

  } catch (error) {
    console.error('❌ Remove User - Erro ao remover usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar usuários da instituição
router.get('/users', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 InstitutionUsers - Recebendo requisição');
    console.log('🔵 InstitutionUsers - InstitutionId:', req.user.institutionId);

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, cpf, userType, createdAt')
      .eq('institutionId', req.user.institutionId)
      .eq('isActive', true);

    if (usersError) {
      console.error('❌ InstitutionUsers - Erro ao buscar usuários:', usersError);
      return res.json({
        success: true,
        data: []
      });
    }

    console.log('🔵 InstitutionUsers - Usuários encontrados:', users?.length || 0);

    res.json({
      success: true,
      data: users || []
    });

  } catch (error) {
    console.error('❌ InstitutionUsers - Erro ao listar usuários:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// ===== GERENCIAMENTO DE TURMAS =====

// Obter dados detalhados de uma turma específica
router.get('/classes/:classId/details', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const { classId } = req.params;
    const institutionId = req.user.institutionId;

    // Verificar se a turma pertence à instituição usando Supabase
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .eq('institutionId', institutionId)
      .eq('isActive', true)
      .single();

    if (classError || !classData) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Buscar professor da turma
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', classData.teacherId)
      .single();

    // Buscar alunos da turma
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select(`
        id,
        student:users(id, name, email, cpf)
      `)
      .eq('classId', classId)
      .eq('isActive', true);

    // Buscar aulas da turma
    const { data: classSessions, error: sessionsError } = await supabase
      .from('teacher_classes')
      .select('*')
      .eq('classId', classId)
      .eq('isCompleted', true)
      .order('date', { ascending: false });

    // Buscar pontuações de todos os alunos da turma
    const { data: classScores, error: scoresError } = await supabase
      .from('class_scores')
      .select(`
        *,
        student:users(id, name),
        sport:sports(id, name)
      `)
      .eq('classId', classId);

    // Calcular estatísticas de presença
    const totalSessions = classSessions?.length || 0;
    
    // Buscar registros de presença para cada aluno
    const studentAttendanceData = await Promise.all(
      (classStudents || []).map(async (classStudent) => {
        const studentId = classStudent.student.id;
        
        const { data: attendanceRecords } = await supabase
          .from('attendances')
          .select('*')
          .eq('classId', classId)
          .eq('studentId', studentId)
          .order('lessonDate', { ascending: false });

        const presentCount = attendanceRecords?.filter(record => record.isPresent).length || 0;
        const absentCount = attendanceRecords?.filter(record => !record.isPresent).length || 0;
        const totalRecords = attendanceRecords?.length || 0;
        const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

        return {
          studentId,
          studentName: classStudent.student.name,
          presentCount,
          absentCount,
          attendanceRate
        };
      })
    );

    // Encontrar aluno com mais faltas
    const studentWithMostAbsences = studentAttendanceData.reduce((max, current) => 
      current.absentCount > max.absentCount ? current : max, 
      { absentCount: 0, studentName: 'Nenhum' }
    );

    // Calcular média geral de notas da turma
    const allScores = classScores?.map(score => score.score) || [];
    const averageScore = allScores.length > 0 
      ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
      : 0;

    // Calcular total de faltas da turma
    const totalAbsences = studentAttendanceData.reduce((sum, student) => sum + student.absentCount, 0);

    // Calcular média de presença da turma
    const averageAttendanceRate = studentAttendanceData.length > 0
      ? Math.round(studentAttendanceData.reduce((sum, student) => sum + student.attendanceRate, 0) / studentAttendanceData.length)
      : 0;

    // Estatísticas por esporte
    const sportStats = {};
    
    // Agrupar pontuações por esporte e aluno
    const scoresBySportAndStudent = {};
    (classScores || []).forEach(score => {
      const sportName = score.sport?.name || 'Desconhecido';
      const studentId = score.studentId;
      const key = `${sportName}-${studentId}`;
      
      if (!scoresBySportAndStudent[key]) {
        scoresBySportAndStudent[key] = {
          sportName,
          studentId,
          totalScore: 0,
          count: 0
        };
      }
      scoresBySportAndStudent[key].totalScore += score.score;
      scoresBySportAndStudent[key].count++;
    });

    // Calcular estatísticas por esporte
    Object.values(scoresBySportAndStudent).forEach(studentSport => {
      const sportName = studentSport.sportName;
      if (!sportStats[sportName]) {
        sportStats[sportName] = {
          totalScores: 0,
          totalStudents: 0,
          averageScore: 0,
          studentScores: []
        };
      }
      sportStats[sportName].studentScores.push(studentSport.totalScore);
    });

    // Calcular médias por esporte
    Object.keys(sportStats).forEach(sportName => {
      const sport = sportStats[sportName];
      sport.totalStudents = sport.studentScores.length;
      sport.totalScores = sport.studentScores.reduce((sum, score) => sum + score, 0);
      sport.averageScore = sport.totalStudents > 0 
        ? Math.round(sport.totalScores / sport.totalStudents)
        : 0;
    });

    res.json({
      success: true,
      data: {
        classInfo: {
          id: classData.id,
          name: classData.name,
          school: classData.school,
          grade: classData.grade,
          teacher: teacher
        },
        statistics: {
          totalStudents: classStudents?.length || 0,
          totalSessions: totalSessions,
          totalAbsences: totalAbsences,
          averageScore: averageScore,
          averageAttendanceRate: averageAttendanceRate,
          studentWithMostAbsences: studentWithMostAbsences.studentName,
          studentWithMostAbsencesCount: studentWithMostAbsences.absentCount
        },
        students: studentAttendanceData,
        sportStats: sportStats,
        recentSessions: (classSessions || []).slice(0, 10).map(session => ({
          id: session.id,
          date: session.date,
          subject: session.subject,
          isCompleted: session.isCompleted
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados da turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Listar turmas da instituição
router.get('/classes', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 Institution Classes - Recebendo requisição');
    console.log('🔵 Institution Classes - InstitutionId:', req.user.institutionId);

    // Consulta usando Supabase com dados relacionados
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:users(id, name, email),
        students:class_students(
          id,
          student:users(id, name, email, cpf)
        )
      `)
      .eq('institutionId', req.user.institutionId)
      .eq('isActive', true);

    if (classesError) {
      console.error('❌ Institution Classes - Erro ao buscar turmas:', classesError);
      return res.json({
        success: true,
        data: []
      });
    }

    console.log('🔵 Institution Classes - Turmas encontradas:', classes?.length || 0);
    console.log('🔵 Institution Classes - Dados das turmas:', classes);

    // Processar dados para garantir que a estrutura está correta
    const processedClasses = (classes || []).map(classItem => ({
      id: classItem.id,
      name: classItem.name,
      description: classItem.description,
      school: classItem.school,
      grade: classItem.grade,
      teacher: classItem.teacher || { id: null, name: 'Professor não encontrado', email: null },
      students: (classItem.students || []).filter(cs => cs.student).map(cs => cs.student)
    }));

    res.json({
      success: true,
      data: processedClasses
    });

  } catch (error) {
    console.error('❌ Institution Classes - Erro ao listar turmas:', error);
    
    // Fallback: retornar array vazio em caso de erro
    res.json({
      success: true,
      data: []
    });
  }
});

// Criar turma
router.post('/classes', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 Create Class - Recebendo requisição');
    console.log('🔵 Create Class - Body:', req.body);
    console.log('🔵 Create Class - User:', req.user);
    
    const { name, description, teacherId, school, grade } = req.body;

    if (!name || !teacherId || !school || !grade) {
      console.log('❌ Create Class - Dados obrigatórios faltando:', { name, teacherId, school, grade });
      return res.status(400).json({
        success: false,
        message: 'Nome, professor, escola e série são obrigatórios'
      });
    }

    // Verificar se professor pertence à instituição usando Supabase
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', teacherId)
      .eq('institutionId', req.user.institutionId)
      .eq('userType', 'TEACHER')
      .eq('isActive', true)
      .single();

    if (teacherError || !teacher) {
      console.log('❌ Create Class - Professor não encontrado ou não pertence à instituição:', teacherError);
      return res.status(400).json({
        success: false,
        message: 'Professor não encontrado ou não pertence a esta instituição'
      });
    }

    console.log('🔵 Create Class - Professor encontrado:', teacher.name);

    // Criar turma usando Supabase
    const now = new Date().toISOString();
    const classData = {
      id: generateId(),
      name,
      description: description || null,
      teacherId,
      institutionId: req.user.institutionId,
      school,
      grade,
      updatedAt: now
    };

    const { data: newClass, error: createError } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single();

    if (createError) {
      console.error('❌ Create Class - Erro ao criar turma:', createError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: createError.message
      });
    }

    // Adicionar dados do professor à resposta
    newClass.teacher = teacher;
    newClass.students = [];

    console.log('✅ Create Class - Turma criada com sucesso:', newClass.id);
    res.status(201).json({
      success: true,
      message: 'Turma criada com sucesso',
      data: newClass
    });

  } catch (error) {
    console.error('❌ Create Class - Erro ao criar turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Adicionar aluno à turma
router.post('/classes/:classId/students', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 Add Student to Class - Recebendo requisição');
    console.log('🔵 Add Student to Class - Params:', req.params);
    console.log('🔵 Add Student to Class - Body:', req.body);
    console.log('🔵 Add Student to Class - User:', req.user);
    
    const { classId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      console.log('❌ Add Student to Class - ID do aluno não fornecido');
      return res.status(400).json({
        success: false,
        message: 'ID do aluno é obrigatório'
      });
    }

    // Verificar se turma pertence à instituição usando Supabase
    const { data: classItem, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('institutionId', req.user.institutionId)
      .eq('isActive', true)
      .single();

    if (classError || !classItem) {
      console.log('❌ Add Student to Class - Turma não encontrada:', classError);
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Verificar se aluno pertence à instituição usando Supabase
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id')
      .eq('id', studentId)
      .eq('institutionId', req.user.institutionId)
      .eq('userType', 'STUDENT')
      .eq('isActive', true)
      .single();

    if (studentError || !student) {
      console.log('❌ Add Student to Class - Aluno não encontrado ou não pertence à instituição:', studentError);
      return res.status(400).json({
        success: false,
        message: 'Aluno não encontrado ou não pertence a esta instituição'
      });
    }

    // Verificar se aluno já está na turma usando Supabase
    const { data: existingClassStudent, error: existingError } = await supabase
      .from('class_students')
      .select('id, isActive')
      .eq('classId', classId)
      .eq('studentId', studentId)
      .single();

    if (existingClassStudent) {
      if (existingClassStudent.isActive) {
        console.log('❌ Add Student to Class - Aluno já está nesta turma');
        return res.status(400).json({
          success: false,
          message: 'Aluno já está nesta turma'
        });
      } else {
        // Reativar aluno na turma
        const { error: updateError } = await supabase
          .from('class_students')
          .update({ isActive: true })
          .eq('id', existingClassStudent.id);

        if (updateError) {
          console.error('❌ Add Student to Class - Erro ao reativar aluno:', updateError);
          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: updateError.message
          });
        }
        console.log('✅ Add Student to Class - Aluno reativado na turma');
      }
    } else {
      // Adicionar aluno à turma usando Supabase
      const { data: newClassStudent, error: createError } = await supabase
        .from('class_students')
        .insert([{
          id: generateId(),
          classId,
          studentId,
          isActive: true
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Add Student to Class - Erro ao adicionar aluno:', createError);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: createError.message
        });
      }
      console.log('✅ Add Student to Class - Aluno adicionado à turma:', newClassStudent);
    }

    // Buscar turma atualizada usando Supabase - versão simplificada
    const { data: updatedClass, error: updatedClassError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (updatedClassError) {
      console.error('❌ Add Student to Class - Erro ao buscar turma atualizada:', updatedClassError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: updatedClassError.message
      });
    }

    // Buscar dados do professor separadamente
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', updatedClass.teacherId)
      .single();

    // Buscar alunos da turma separadamente
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select(`
        id,
        student:users(id, name, email, cpf)
      `)
      .eq('classId', classId)
      .eq('isActive', true);

    // Montar resposta com dados processados
    const responseData = {
      id: updatedClass.id,
      name: updatedClass.name,
      description: updatedClass.description,
      school: updatedClass.school,
      grade: updatedClass.grade,
      teacher: teacher || { id: null, name: 'Professor não encontrado', email: null },
      students: (classStudents || []).filter(cs => cs.student).map(cs => cs.student)
    };

    console.log('✅ Add Student to Class - Operação concluída com sucesso');
    res.json({
      success: true,
      message: 'Aluno adicionado à turma com sucesso',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Add Student to Class - Erro ao adicionar aluno à turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Remover aluno da turma
router.delete('/classes/:classId/students/:studentId', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 Remove Student from Class - Recebendo requisição');
    console.log('🔵 Remove Student from Class - Params:', req.params);
    console.log('🔵 Remove Student from Class - User:', req.user);
    
    const { classId, studentId } = req.params;

    // Verificar se turma pertence à instituição usando Supabase
    const { data: classItem, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('institutionId', req.user.institutionId)
      .eq('isActive', true)
      .single();

    if (classError || !classItem) {
      console.log('❌ Remove Student from Class - Turma não encontrada');
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Desativar aluno na turma usando Supabase
    const { data: result, error: updateError } = await supabase
      .from('class_students')
      .update({ isActive: false })
      .eq('classId', classId)
      .eq('studentId', studentId)
      .eq('isActive', true)
      .select();

    if (updateError) {
      console.error('❌ Remove Student from Class - Erro ao desativar aluno:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: updateError.message
      });
    }

    if (!result || result.length === 0) {
      console.log('❌ Remove Student from Class - Aluno não encontrado na turma');
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado nesta turma'
      });
    }

    console.log('✅ Remove Student from Class - Aluno removido com sucesso');
    res.json({
      success: true,
      message: 'Aluno removido da turma com sucesso'
    });

  } catch (error) {
    console.error('❌ Remove Student from Class - Erro ao remover aluno da turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Remover turma
router.delete('/classes/:classId', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 Delete Class - Recebendo requisição');
    console.log('🔵 Delete Class - Params:', req.params);
    console.log('🔵 Delete Class - User:', req.user);
    
    const { classId } = req.params;

    // Verificar se turma pertence à instituição usando Supabase
    const { data: classItem, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('institutionId', req.user.institutionId)
      .eq('isActive', true)
      .single();

    if (classError || !classItem) {
      console.log('❌ Delete Class - Turma não encontrada');
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Desativar turma em vez de deletar usando Supabase
    const { error: updateError } = await supabase
      .from('classes')
      .update({ isActive: false })
      .eq('id', classId);

    if (updateError) {
      console.error('❌ Delete Class - Erro ao desativar turma:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: updateError.message
      });
    }

    console.log('✅ Delete Class - Turma removida com sucesso');
    res.json({
      success: true,
      message: 'Turma removida com sucesso'
    });

  } catch (error) {
    console.error('❌ Delete Class - Erro ao remover turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ESTATÍSTICAS =====

// Obter estatísticas da instituição
router.get('/stats', authenticateToken, requireInstitution, async (req, res) => {
  try {
    console.log('🔵 Institution Stats - Recebendo requisição');
    console.log('🔵 Institution Stats - InstitutionId:', req.user.institutionId);
    
    const institutionId = req.user.institutionId;

    // Consultas usando Supabase
    const { count: totalStudents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('institutionId', institutionId)
      .eq('userType', 'STUDENT')
      .eq('isActive', true);

    const { count: totalTeachers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('institutionId', institutionId)
      .eq('userType', 'TEACHER')
      .eq('isActive', true);

    const { count: totalClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('institutionId', institutionId)
      .eq('isActive', true);

    console.log('🔵 Institution Stats - Resultados:', {
      totalStudents,
      totalTeachers,
      totalClasses
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        activeClasses: totalClasses
      }
    });

  } catch (error) {
    console.error('❌ Institution Stats - Erro ao buscar estatísticas:', error);
    
    // Fallback: retornar zeros em caso de erro
    res.json({
      success: true,
      data: {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        activeClasses: 0
      }
    });
  }
});

module.exports = router;
