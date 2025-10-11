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

// Middleware para verificar se é professor
const requireTeacher = (req, res, next) => {
  if (req.user.userType !== 'TEACHER') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas professores podem acessar esta funcionalidade.'
    });
  }
  next();
};

// ===== TURMAS =====

// Obter todas as turmas do professor
router.get('/classes', authenticateToken, requireTeacher, async (req, res) => {
  try {
    console.log('🔵 ClassManagement GET - Recebendo requisição');
    console.log('🔵 ClassManagement GET - User:', req.user);
    
    // Buscar turmas do professor usando Supabase
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        *,
        students:class_students(
          id,
          student:users(
            id, name, email, age, avatar
          )
        )
      `)
      .eq('teacherId', req.user.userId)
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    if (classesError) {
      console.error('❌ ClassManagement GET - Erro ao buscar turmas:', classesError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: classesError.message
      });
    }
    
    console.log('🔵 ClassManagement GET - Turmas encontradas:', classes?.length || 0);

    // Processar dados para garantir estrutura correta
    const processedClasses = (classes || []).map(classItem => ({
      id: classItem.id,
      name: classItem.name,
      description: classItem.description,
      school: classItem.school,
      grade: classItem.grade,
      teacherId: classItem.teacherId,
      institutionId: classItem.institutionId,
      isActive: classItem.isActive,
      createdAt: classItem.createdAt,
      updatedAt: classItem.updatedAt,
      students: (classItem.students || []).filter(cs => cs.student).map(cs => cs.student)
    }));

    res.json({
      success: true,
      data: processedClasses
    });

  } catch (error) {
    console.error('❌ ClassManagement GET - Erro ao buscar turmas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Criar nova turma
router.post('/classes', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { name, description, school, grade } = req.body;

    if (!name || !school || !grade) {
      return res.status(400).json({
        success: false,
        message: 'Nome, escola e série são obrigatórios'
      });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description: description || null,
        teacherId: req.user.userId,
        school,
        grade
      },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                age: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Turma criada com sucesso',
      data: newClass
    });

  } catch (error) {
    console.error('Erro ao criar turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar turma
router.put('/classes/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, school, grade } = req.body;

    // Verificar se a turma pertence ao professor
    const existingClass = await prisma.class.findFirst({
      where: {
        id,
        teacherId: req.user.userId
      }
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: name || existingClass.name,
        description: description !== undefined ? description : existingClass.description,
        school: school || existingClass.school,
        grade: grade || existingClass.grade
      },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                age: true,
                avatar: true
              }
            }
          },
          where: {
            isActive: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Turma atualizada com sucesso',
      data: updatedClass
    });

  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Remover turma
router.delete('/classes/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a turma pertence ao professor
    const existingClass = await prisma.class.findFirst({
      where: {
        id,
        teacherId: req.user.userId
      }
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Desativar turma em vez de deletar
    await prisma.class.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Turma removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ===== ALUNOS =====

// Obter todos os alunos disponíveis para adicionar à turma
router.get('/students/available', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId, search } = req.query;

    console.log('🔵 Available Students - Recebendo requisição');
    console.log('🔵 Available Students - Query:', req.query);

    // Buscar a instituição do professor
    const teacher = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { institutionId: true }
    });

    console.log('🔵 Available Students - Professor encontrado:', teacher);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Professor não encontrado'
      });
    }

    if (!teacher.institutionId) {
      console.log('⚠️ Available Students - Professor sem instituição vinculada');
      return res.status(400).json({
        success: false,
        message: 'Professor deve estar vinculado a uma instituição para gerenciar alunos'
      });
    }

    let whereClause = {
      userType: 'STUDENT',
      institutionId: teacher.institutionId, // ← CORREÇÃO: Filtrar por instituição
      isActive: true // ← CORREÇÃO: Apenas usuários ativos
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    // Se classId for fornecido, excluir alunos que já estão na turma
    if (classId) {
      const classStudents = await prisma.classStudent.findMany({
        where: {
          classId,
          isActive: true
        },
        select: {
          studentId: true
        }
      });

      const studentIds = classStudents.map(cs => cs.studentId);
      console.log('🔵 Alunos já na turma (excluídos):', studentIds);
      
      whereClause.id = {
        notIn: studentIds
      };
    }

    console.log('🔵 Buscando alunos disponíveis com filtros:', whereClause);

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        school: true,
        avatar: true,
        institutionId: true,
        isActive: true,
        userType: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 50 // Limitar resultados
    });

    console.log('🔵 Alunos encontrados:', students.length);
    console.log('🔵 Detalhes dos alunos:', students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      institutionId: s.institutionId,
      isActive: s.isActive,
      userType: s.userType
    })));

    // Debug: Verificar se há alunos que não estão aparecendo
    const allStudentsInInstitution = await prisma.user.findMany({
      where: {
        userType: 'STUDENT',
        institutionId: teacher.institutionId
      },
      select: {
        id: true,
        name: true,
        email: true,
        institutionId: true,
        isActive: true,
        userType: true
      }
    });

    console.log('🔵 TODOS os alunos da instituição:', allStudentsInInstitution.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      institutionId: s.institutionId,
      isActive: s.isActive,
      userType: s.userType
    })));

    // Debug: Verificar se algum aluno está em turmas
    const studentsInClasses = await prisma.classStudent.findMany({
      where: {
        student: {
          institutionId: teacher.institutionId,
          userType: 'STUDENT'
        },
        isActive: true
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('🔵 Alunos que já estão em turmas:', studentsInClasses.map(sc => ({
      studentId: sc.student.id,
      studentName: sc.student.name,
      studentEmail: sc.student.email,
      classId: sc.class.id,
      className: sc.class.name
    })));

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Remover aluno de uma turma (para debug/correção)
router.delete('/classes/:classId/students/:studentId', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    // Verificar se a turma pertence ao professor
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.userId
      }
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada ou você não tem permissão para gerenciar esta turma'
      });
    }

    // Remover aluno da turma
    const result = await prisma.classStudent.updateMany({
      where: {
        classId,
        studentId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado nesta turma'
      });
    }

    console.log('🔵 Aluno removido da turma:', { classId, studentId });

    res.json({
      success: true,
      message: 'Aluno removido da turma com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover aluno da turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter alunos de uma turma específica
router.get('/classes/:classId/students', authenticateToken, requireTeacher, async (req, res) => {
  try {
    console.log('🔵 GetClassStudents - Recebendo requisição');
    console.log('🔵 GetClassStudents - ClassId:', req.params.classId);
    console.log('🔵 GetClassStudents - User:', req.user);
    
    const { classId } = req.params;

    // Verificar se a turma existe e pertence ao professor usando Supabase
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, teacherId')
      .eq('id', classId)
      .eq('teacherId', req.user.userId)
      .eq('isActive', true)
      .single();

    if (classError || !classData) {
      console.log('❌ GetClassStudents - Turma não encontrada:', classError);
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    console.log('🔵 GetClassStudents - Turma encontrada:', classData.name);

    // Buscar alunos da turma usando Supabase
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select(`
        id,
        classId,
        studentId,
        isActive,
        student:users(
          id, name, email, age, school, avatar, userType
        )
      `)
      .eq('classId', classId)
      .eq('isActive', true);

    if (studentsError) {
      console.error('❌ GetClassStudents - Erro ao buscar alunos:', studentsError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: studentsError.message
      });
    }

    console.log('🔵 GetClassStudents - Alunos encontrados:', classStudents?.length || 0);

    // Processar dados para garantir estrutura correta
    const processedStudents = (classStudents || []).map(cs => ({
      id: cs.id,
      classId: cs.classId,
      studentId: cs.studentId,
      isActive: cs.isActive,
      student: cs.student
    }));

    res.json({
      success: true,
      data: processedStudents
    });

  } catch (error) {
    console.error('❌ GetClassStudents - Erro ao buscar alunos da turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Adicionar aluno à turma
router.post('/classes/:classId/students', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'ID do aluno é obrigatório'
      });
    }

    // Verificar se a turma pertence ao professor
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.userId
      }
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Verificar se o aluno existe
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        userType: 'STUDENT'
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado'
      });
    }

    // Verificar se o aluno já está na turma
    const existingClassStudent = await prisma.classStudent.findFirst({
      where: {
        classId,
        studentId
      }
    });

    if (existingClassStudent) {
      if (existingClassStudent.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Aluno já está nesta turma'
        });
      } else {
        // Reativar aluno na turma
        await prisma.classStudent.update({
          where: { id: existingClassStudent.id },
          data: { isActive: true }
        });
      }
    } else {
      // Adicionar aluno à turma
      await prisma.classStudent.create({
        data: {
          classId,
          studentId
        }
      });
    }

    // Buscar turma atualizada
    const updatedClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                age: true,
                avatar: true
              }
            }
          },
          where: {
            isActive: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Aluno adicionado à turma com sucesso',
      data: updatedClass
    });

  } catch (error) {
    console.error('Erro ao adicionar aluno à turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Remover aluno da turma
router.delete('/classes/:classId/students/:studentId', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    // Verificar se a turma pertence ao professor
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.userId
      }
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Desativar aluno na turma
    await prisma.classStudent.updateMany({
      where: {
        classId,
        studentId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    // Buscar turma atualizada
    const updatedClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                age: true,
                avatar: true
              }
            }
          },
          where: {
            isActive: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Aluno removido da turma com sucesso',
      data: updatedClass
    });

  } catch (error) {
    console.error('Erro ao remover aluno da turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter estatísticas das turmas
router.get('/classes/stats', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const totalClasses = await prisma.class.count({
      where: {
        teacherId: req.user.userId,
        isActive: true
      }
    });

    const totalStudents = await prisma.classStudent.count({
      where: {
        class: {
          teacherId: req.user.userId
        },
        isActive: true
      }
    });

    const averageStudentsPerClass = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;

    res.json({
      success: true,
      data: {
        totalClasses,
        totalStudents,
        averageStudentsPerClass
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

// ===== PONTUAÇÕES =====

// Salvar pontuação individual do aluno na aula (CORRIGIDO - permite múltiplas pontuações)
router.post('/classes/:classId/scores', authenticateToken, requireTeacher, async (req, res) => {
  try {
    console.log('🔵 SaveScore - Recebendo requisição');
    console.log('🔵 SaveScore - ClassId:', req.params.classId);
    console.log('🔵 SaveScore - Body:', req.body);
    console.log('🔵 SaveScore - User:', req.user);
    
    const { classId } = req.params;
    const { studentId, sportId, score, notes, lessonDate } = req.body;

    // Validações
    if (!studentId || !sportId || score === undefined) {
      console.log('❌ SaveScore - Dados obrigatórios faltando:', { studentId, sportId, score });
      return res.status(400).json({
        success: false,
        message: 'ID do aluno, ID do esporte e pontuação são obrigatórios'
      });
    }

    if (score < 0 || score > 100) {
      console.log('❌ SaveScore - Pontuação inválida:', score);
      return res.status(400).json({
        success: false,
        message: 'Pontuação deve estar entre 0 e 100'
      });
    }

    // Verificar se a turma pertence ao professor usando Supabase
    const { data: existingClass, error: classError } = await supabase
      .from('classes')
      .select('id, name, teacherId')
      .eq('id', classId)
      .eq('teacherId', req.user.userId)
      .eq('isActive', true)
      .single();

    if (classError || !existingClass) {
      console.log('❌ SaveScore - Turma não encontrada:', classError);
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    console.log('🔵 SaveScore - Turma encontrada:', existingClass.name);

    // Verificar se o aluno está na turma usando Supabase
    const { data: classStudent, error: studentError } = await supabase
      .from('class_students')
      .select('id, classId, studentId')
      .eq('classId', classId)
      .eq('studentId', studentId)
      .eq('isActive', true)
      .single();

    if (studentError || !classStudent) {
      console.log('❌ SaveScore - Aluno não está na turma:', studentError);
      return res.status(400).json({
        success: false,
        message: 'Aluno não está nesta turma'
      });
    }

    console.log('🔵 SaveScore - Aluno encontrado na turma');

    // Verificar se o esporte existe usando Supabase
    const { data: sport, error: sportError } = await supabase
      .from('sports')
      .select('id, name')
      .eq('id', sportId)
      .eq('isActive', true)
      .single();

    if (sportError || !sport) {
      console.log('❌ SaveScore - Esporte não encontrado:', sportError);
      return res.status(404).json({
        success: false,
        message: 'Esporte não encontrado'
      });
    }

    console.log('🔵 SaveScore - Esporte encontrado:', sport.name);

    // Criar nova pontuação usando Supabase
    const scoreData = {
      id: generateId(),
      classId,
      studentId,
      sportId,
      score,
      notes: notes || null,
      teacherId: req.user.userId,
      lessonDate: lessonDate ? new Date(lessonDate).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('🔵 SaveScore - Dados para criação:', scoreData);

    const { data: classScore, error: createError } = await supabase
      .from('class_scores')
      .insert([scoreData])
      .select(`
        id,
        classId,
        studentId,
        sportId,
        score,
        notes,
        teacherId,
        lessonDate,
        createdAt,
        student:users!class_scores_studentId_fkey(
          id, name, email
        ),
        sport:sports(
          id, name, icon
        )
      `)
      .single();

    if (createError) {
      console.error('❌ SaveScore - Erro ao criar pontuação:', createError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: createError.message
      });
    }

    console.log('🔵 SaveScore - Pontuação criada com sucesso:', classScore.id);

    res.json({
      success: true,
      message: 'Pontuação salva com sucesso',
      data: classScore
    });

  } catch (error) {
    console.error('❌ SaveScore - Erro ao salvar pontuação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Salvar pontuações em lote (NOVA FUNCIONALIDADE)
router.post('/classes/:classId/scores/batch', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId } = req.params;
    const { scores, lessonDate } = req.body;

    // Validações
    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de pontuações é obrigatória'
      });
    }

    // Verificar se a turma pertence ao professor
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.userId,
        isActive: true
      }
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Validar cada pontuação
    for (const scoreData of scores) {
      if (!scoreData.studentId || !scoreData.sportId || scoreData.score === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Cada pontuação deve ter studentId, sportId e score'
        });
      }

      if (scoreData.score < 0 || scoreData.score > 100) {
        return res.status(400).json({
          success: false,
          message: 'Pontuação deve estar entre 0 e 100'
        });
      }
    }

    // Buscar alunos da turma para validação
    const classStudents = await prisma.classStudent.findMany({
      where: {
        classId,
        isActive: true
      },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const validStudentIds = classStudents.map(cs => cs.student.id);

    // Verificar se todos os alunos estão na turma
    for (const scoreData of scores) {
      if (!validStudentIds.includes(scoreData.studentId)) {
        return res.status(400).json({
          success: false,
          message: `Aluno ${scoreData.studentId} não está nesta turma`
        });
      }
    }

    // Verificar se todos os esportes existem
    const sportIds = [...new Set(scores.map(s => s.sportId))];
    const existingSports = await prisma.sport.findMany({
      where: {
        id: { in: sportIds },
        isActive: true
      }
    });

    if (existingSports.length !== sportIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Um ou mais esportes não foram encontrados'
      });
    }

    // Criar todas as pontuações
    const createdScores = await Promise.all(
      scores.map(scoreData =>
        prisma.classScore.create({
          data: {
            classId,
            studentId: scoreData.studentId,
            sportId: scoreData.sportId,
            score: scoreData.score,
            notes: scoreData.notes || null,
            teacherId: req.user.userId,
            lessonDate: lessonDate ? new Date(lessonDate) : new Date()
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            sport: {
              select: {
                id: true,
                name: true,
                icon: true
              }
            }
          }
        })
      )
    );

    res.json({
      success: true,
      message: `${createdScores.length} pontuações salvas com sucesso`,
      data: createdScores
    });

  } catch (error) {
    console.error('Erro ao salvar pontuações em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter pontuações de uma turma
router.get('/classes/:classId/scores', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId } = req.params;

    // Verificar se a turma pertence ao professor
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.userId,
        isActive: true
      }
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    const scores = await prisma.classScore.findMany({
      where: {
        classId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
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
        { student: { name: 'asc' } },
        { sport: { name: 'asc' } }
      ]
    });

    res.json({
      success: true,
      data: scores
    });

  } catch (error) {
    console.error('Erro ao buscar pontuações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Salvar presença de alunos
router.post('/classes/:classId/attendance', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId, isPresent, date } = req.body;

    if (!studentId || isPresent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'ID do aluno e status de presença são obrigatórios'
      });
    }

    // Verificar se a turma existe e pertence ao professor
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: req.user.userId
      }
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Verificar se o aluno está na turma
    const classStudent = await prisma.classStudent.findFirst({
      where: {
        classId: classId,
        studentId: studentId,
        isActive: true
      }
    });

    if (!classStudent) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado nesta turma'
      });
    }

    // Como não temos um modelo Attendance, vamos simular salvando uma pontuação
    // Se o aluno está presente, damos uma pontuação padrão
    if (isPresent) {
      // Buscar um esporte padrão ou o primeiro esporte disponível
      const defaultSport = await prisma.sport.findFirst({
        where: { isActive: true }
      });

      if (defaultSport) {
        // Verificar se já existe uma pontuação para este aluno nesta turma hoje
        const targetDate = new Date(date || new Date());
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingScore = await prisma.classScore.findFirst({
          where: {
            classId: classId,
            studentId: studentId,
            sportId: defaultSport.id,
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        });

        if (!existingScore) {
          // Criar pontuação de presença (pontuação mínima para marcar presença)
          await prisma.classScore.create({
            data: {
              classId: classId,
              studentId: studentId,
              sportId: defaultSport.id,
              score: 50, // Pontuação mínima para presença
              notes: 'Presença registrada',
              teacherId: req.user.userId
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: isPresent ? 'Presença registrada com sucesso' : 'Falta registrada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar presença:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Salvar presenças em lote (NOVA FUNCIONALIDADE)
router.post('/classes/:classId/attendance/batch', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId } = req.params;
    const { attendances, lessonDate } = req.body;

    // Validações
    if (!attendances || !Array.isArray(attendances) || attendances.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de presenças é obrigatória'
      });
    }

    // Verificar se a aula pertence ao professor usando Supabase
    const { data: existingClass, error: classError } = await supabase
      .from('teacher_classes')
      .select(`
        id,
        classId,
        teacherId,
        isCompleted,
        class:classes(
          id, name, isActive
        )
      `)
      .eq('id', classId)
      .eq('teacherId', req.user.userId)
      .eq('isCompleted', false)
      .single();

    if (classError || !existingClass) {
      console.log('❌ BatchAttendance - Aula não encontrada:', classError);
      return res.status(404).json({
        success: false,
        message: 'Aula não encontrada'
      });
    }

    // Usar o classId da turma para buscar alunos
    const actualClassId = existingClass.classId;

    // Validar cada presença
    for (const attendanceData of attendances) {
      if (!attendanceData.studentId || attendanceData.isPresent === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Cada presença deve ter studentId e isPresent'
        });
      }
    }

    // Buscar alunos da turma para validação usando Supabase
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select(`
        id,
        classId,
        studentId,
        isActive,
        student:users(
          id, name
        )
      `)
      .eq('classId', actualClassId)
      .eq('isActive', true);

    if (studentsError) {
      console.error('❌ BatchAttendance - Erro ao buscar alunos:', studentsError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: studentsError.message
      });
    }

    const validStudentIds = (classStudents || []).map(cs => cs.student.id);

    // Verificar se todos os alunos estão na turma
    for (const attendanceData of attendances) {
      if (!validStudentIds.includes(attendanceData.studentId)) {
        return res.status(400).json({
          success: false,
          message: `Aluno ${attendanceData.studentId} não está nesta turma`
        });
      }
    }

            console.log('🔵 BatchAttendance - Dados recebidos:', {
              classId,
              lessonDate,
              lessonDateType: typeof lessonDate,
              lessonDateValue: lessonDate,
              attendances: attendances.map(a => ({
                studentId: a.studentId,
                isPresent: a.isPresent,
                notes: a.notes
              }))
            });
            
            // DEBUG: Verificar se a data está sendo convertida corretamente
            const lessonDateObj = lessonDate ? new Date(lessonDate) : new Date();
            console.log('🔵 BatchAttendance - Data convertida:', {
              original: lessonDate,
              converted: lessonDateObj,
              iso: lessonDateObj.toISOString(),
              local: lessonDateObj.toLocaleDateString('pt-BR')
            });

            // DEBUG: Verificar se há conflitos de data usando Supabase
            console.log('🔵 BatchAttendance - Verificando conflitos de data...');
            const { data: existingAttendances, error: existingError } = await supabase
              .from('attendances')
              .select('id, studentId, lessonDate')
              .eq('classId', actualClassId)
              .in('studentId', attendances.map(a => a.studentId))
              .gte('lessonDate', new Date(lessonDate).toISOString())
              .lt('lessonDate', new Date(new Date(lessonDate).getTime() + 24 * 60 * 60 * 1000).toISOString());
            
            if (existingError) {
              console.error('❌ BatchAttendance - Erro ao verificar presenças existentes:', existingError);
            } else {
              console.log('🔵 BatchAttendance - Presenças existentes encontradas:', existingAttendances?.length || 0);
            }

    // Criar todas as presenças usando upsert para evitar duplicatas
    const createdAttendances = await Promise.all(
      attendances.map(async (attendanceData) => {
        const lessonDateObj = lessonDate ? new Date(lessonDate) : new Date();
        
                console.log('🔵 BatchAttendance - Salvando presença:', {
                  teacherClassId: classId, // ID da aula
                  classId: actualClassId, // ID da turma
                  studentId: attendanceData.studentId,
                  isPresent: attendanceData.isPresent,
                  lessonDate: lessonDateObj,
                  lessonDateISO: lessonDateObj.toISOString(),
                  lessonDateOnly: lessonDateObj.toISOString().split('T')[0]
                });

        // Verificar se já existe presença para este aluno nesta aula
        const { data: existingAttendance, error: checkError } = await supabase
          .from('attendances')
          .select('id')
          .eq('teacherClassId', classId)
          .eq('studentId', attendanceData.studentId)
          .single();

        const attendanceRecord = {
          classId: actualClassId,
          teacherClassId: classId,
          studentId: attendanceData.studentId,
          isPresent: attendanceData.isPresent,
          lessonDate: lessonDateObj.toISOString(),
          notes: attendanceData.notes || null,
          teacherId: req.user.userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        let result;
        if (existingAttendance) {
          // Atualizar presença existente
          const { data: updatedAttendance, error: updateError } = await supabase
            .from('attendances')
            .update({
              isPresent: attendanceData.isPresent,
              notes: attendanceData.notes || null,
              teacherId: req.user.userId,
              updatedAt: new Date().toISOString()
            })
            .eq('id', existingAttendance.id)
            .select(`
              id,
              classId,
              teacherClassId,
              studentId,
              isPresent,
              notes,
              lessonDate,
              createdAt,
              student:users!attendances_studentId_fkey(
                id, name, email
              )
            `)
            .single();

          if (updateError) {
            console.error('❌ BatchAttendance - Erro ao atualizar presença:', updateError);
            throw updateError;
          }
          result = updatedAttendance;
        } else {
          // Criar nova presença
          attendanceRecord.id = generateId();
          const { data: newAttendance, error: createError } = await supabase
            .from('attendances')
            .insert([attendanceRecord])
            .select(`
              id,
              classId,
              teacherClassId,
              studentId,
              isPresent,
              notes,
              lessonDate,
              createdAt,
              student:users!attendances_studentId_fkey(
                id, name, email
              )
            `)
            .single();

          if (createError) {
            console.error('❌ BatchAttendance - Erro ao criar presença:', createError);
            throw createError;
          }
          result = newAttendance;
        }

        console.log('🔵 BatchAttendance - Presença salva:', {
          studentId: result.studentId,
          studentName: result.student.name,
          isPresent: result.isPresent,
          lessonDate: result.lessonDate
        });

        return result;
      })
    );

    const presentCount = createdAttendances.filter(a => a.isPresent).length;
    const absentCount = createdAttendances.length - presentCount;

    res.json({
      success: true,
      message: `Chamada realizada: ${presentCount} presentes, ${absentCount} faltas`,
      data: {
        attendances: createdAttendances,
        summary: {
          total: createdAttendances.length,
          present: presentCount,
          absent: absentCount
        }
      }
    });

  } catch (error) {
    console.error('Erro ao salvar presenças em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter lista de presença de uma turma (NOVA FUNCIONALIDADE)
router.get('/classes/:classId/attendance', authenticateToken, requireTeacher, async (req, res) => {
  try {
    console.log('🔵 GetAttendance - Recebendo requisição');
    console.log('🔵 GetAttendance - ClassId:', req.params.classId);
    console.log('🔵 GetAttendance - Query:', req.query);
    console.log('🔵 GetAttendance - User:', req.user);
    
    const { classId } = req.params; // Pode ser teacherClass.id ou class.id
    const { lessonDate } = req.query;

    console.log('🔵 GetAttendance - classId recebido:', classId);
    console.log('🔵 GetAttendance - lessonDate recebido:', lessonDate);

    // Primeiro, verificar se é um teacherClass.id usando Supabase
    let teacherClass = null;
    let actualClassId = null;
    let existingClass = null;

    // Tentar buscar como teacherClass primeiro
    const { data: teacherClassData, error: teacherClassError } = await supabase
      .from('teacher_classes')
      .select(`
        id,
        classId,
        class:classes(
          id, name, school, grade, isActive
        )
      `)
      .eq('id', classId)
      .eq('teacherId', req.user.userId)
      .single();

    if (teacherClassData) {
      console.log('🔵 GetAttendance - Encontrado como teacherClass:', teacherClassData.id);
      actualClassId = teacherClassData.classId;
      existingClass = teacherClassData.class;
    } else {
      // Se não for teacherClass, tentar como class diretamente
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name, school, grade, isActive')
        .eq('id', classId)
        .eq('teacherId', req.user.userId)
        .eq('isActive', true)
        .single();
      
      if (classData) {
        console.log('🔵 GetAttendance - Encontrado como class:', classData.id);
        actualClassId = classId;
        existingClass = classData;
      }
    }

    if (!existingClass) {
      console.log('🔴 GetAttendance - Nenhuma turma encontrada para classId:', classId);
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    console.log('🔵 GetAttendance - Usando actualClassId:', actualClassId);

    // Buscar alunos da turma usando Supabase
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select(`
        id,
        classId,
        studentId,
        isActive,
        student:users!class_students_studentId_fkey(
          id, name, email, avatar
        )
      `)
      .eq('classId', actualClassId)
      .eq('isActive', true);

    if (studentsError) {
      console.error('❌ GetAttendance - Erro ao buscar alunos:', studentsError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: studentsError.message
      });
    }

    console.log('🔵 GetAttendance - Alunos encontrados:', classStudents?.length || 0);

    // Se uma data específica foi fornecida, buscar presenças dessa data
    if (lessonDate) {
      const targetDate = new Date(lessonDate);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('🔵 GetAttendance - Buscando presenças para data:', {
        lessonDate,
        targetDate: targetDate.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      });

      const { data: attendances, error: attendanceError } = await supabase
        .from('attendances')
        .select(`
          id,
          classId,
          teacherClassId,
          studentId,
          isPresent,
          lessonDate,
          notes,
          createdAt,
          student:users!attendances_studentId_fkey(
            id, name, email
          )
        `)
        .eq('classId', actualClassId)
        .gte('lessonDate', startOfDay.toISOString())
        .lte('lessonDate', endOfDay.toISOString());

      if (attendanceError) {
        console.error('❌ GetAttendance - Erro ao buscar presenças:', attendanceError);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: attendanceError.message
        });
      }

      console.log('🔵 GetAttendance - Presenças encontradas:', attendances?.length || 0);

      // Combinar alunos com suas presenças
      const attendanceList = (classStudents || []).map(classStudent => {
        const attendance = (attendances || []).find(a => a.studentId === classStudent.student.id);
        return {
          studentId: classStudent.student.id,
          student: classStudent.student,
          isPresent: attendance ? attendance.isPresent : null, // null = não registrado
          notes: attendance ? attendance.notes : null,
          registeredAt: attendance ? attendance.createdAt : null,
          teacherClassId: attendance ? attendance.teacherClassId : null
        };
      });

      console.log('🔵 GetAttendance - Lista de presença montada:', attendanceList.length);

      res.json({
        success: true,
        data: {
          class: {
            id: existingClass.id,
            name: existingClass.name,
            school: existingClass.school,
            grade: existingClass.grade
          },
          lessonDate: targetDate,
          attendances: attendanceList.filter(a => a.isPresent !== null), // Apenas presenças registradas
          summary: {
            total: attendanceList.length,
            present: attendanceList.filter(a => a.isPresent === true).length,
            absent: attendanceList.filter(a => a.isPresent === false).length,
            notRegistered: attendanceList.filter(a => a.isPresent === null).length
          }
        }
      });
    } else {
      // Retornar apenas a lista de alunos sem presenças específicas
      const attendanceList = (classStudents || []).map(classStudent => ({
        studentId: classStudent.student.id,
        student: classStudent.student,
        isPresent: null,
        notes: null,
        registeredAt: null
      }));

      res.json({
        success: true,
        data: {
          class: {
            id: existingClass.id,
            name: existingClass.name,
            school: existingClass.school,
            grade: existingClass.grade
          },
          lessonDate: null,
          attendances: [],
          summary: {
            total: attendanceList.length,
            present: 0,
            absent: 0,
            notRegistered: attendanceList.length
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ GetAttendance - Erro ao buscar lista de presença:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
