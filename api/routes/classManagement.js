const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

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
    const classes = await prisma.class.findMany({
      where: {
        teacherId: req.user.userId,
        isActive: true
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: classes
    });

  } catch (error) {
    console.error('Erro ao buscar turmas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
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

    let whereClause = {
      userType: 'STUDENT'
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
      whereClause.id = {
        notIn: studentIds
      };
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        school: true,
        avatar: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 50 // Limitar resultados
    });

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

// Obter alunos de uma turma específica
router.get('/classes/:classId/students', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId } = req.params;

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

    // Buscar alunos da turma
    const classStudents = await prisma.classStudent.findMany({
      where: {
        classId: classId,
        isActive: true
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            age: true,
            school: true,
            class: true,
            avatar: true,
            userType: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: classStudents
    });

  } catch (error) {
    console.error('Erro ao buscar alunos da turma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
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

// Salvar pontuação do aluno na aula
router.post('/classes/:classId/scores', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId, sportId, score, notes } = req.body;

    // Validações
    if (!studentId || !sportId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'ID do aluno, ID do esporte e pontuação são obrigatórios'
      });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: 'Pontuação deve estar entre 0 e 100'
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

    // Verificar se o aluno está na turma
    const classStudent = await prisma.classStudent.findFirst({
      where: {
        classId,
        studentId,
        isActive: true
      }
    });

    if (!classStudent) {
      return res.status(400).json({
        success: false,
        message: 'Aluno não está nesta turma'
      });
    }

    // Verificar se o esporte existe
    const sport = await prisma.sport.findFirst({
      where: {
        id: sportId,
        isActive: true
      }
    });

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Esporte não encontrado'
      });
    }

    // Criar ou atualizar pontuação
    const classScore = await prisma.classScore.upsert({
      where: {
        classId_studentId_sportId: {
          classId,
          studentId,
          sportId
        }
      },
      update: {
        score,
        notes: notes || null,
        teacherId: req.user.userId
      },
      create: {
        classId,
        studentId,
        sportId,
        score,
        notes: notes || null,
        teacherId: req.user.userId
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
    });

    res.json({
      success: true,
      message: 'Pontuação salva com sucesso',
      data: classScore
    });

  } catch (error) {
    console.error('Erro ao salvar pontuação:', error);
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

module.exports = router;
