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

// Registrar nova instituição
router.post('/register', async (req, res) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: 'Nome, CNPJ, email e senha são obrigatórios'
      });
    }

    // Verificar se CNPJ já existe
    const existingInstitution = await prisma.institution.findFirst({
      where: {
        OR: [
          { cnpj },
          { email }
        ]
      }
    });

    if (existingInstitution) {
      return res.status(400).json({
        success: false,
        message: 'CNPJ ou email já cadastrado'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar instituição
    const institution = await prisma.institution.create({
      data: {
        name,
        cnpj,
        email,
        password: hashedPassword,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        description: description || null
      },
      select: {
        id: true,
        name: true,
        cnpj: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        description: true,
        createdAt: true
      }
    });

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

    // Buscar instituição
    const institution = await prisma.institution.findUnique({
      where: { email }
    });

    if (!institution || !institution.isActive) {
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

// Buscar usuário por CPF
router.get('/users/search', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const { cpf } = req.query;

    if (!cpf) {
      return res.status(400).json({
        success: false,
        message: 'CPF é obrigatório'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        cpf,
        institutionId: req.user.institutionId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        age: true,
        userType: true,
        institutionId: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Adicionar usuário à instituição
router.post('/users/:userId/add', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se já está vinculado a uma instituição
    if (user.institutionId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já está vinculado a uma instituição'
      });
    }

    // Vincular usuário à instituição
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { institutionId: req.user.institutionId },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        userType: true,
        institutionId: true
      }
    });

    res.json({
      success: true,
      message: 'Usuário adicionado à instituição com sucesso',
      data: updatedUser
    });

  } catch (error) {
    console.error('Erro ao adicionar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Remover usuário da instituição
router.delete('/users/:userId/remove', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar se usuário pertence à instituição
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        institutionId: req.user.institutionId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado ou não pertence a esta instituição'
      });
    }

    // Remover vínculo
    await prisma.user.update({
      where: { id: userId },
      data: { institutionId: null }
    });

    res.json({
      success: true,
      message: 'Usuário removido da instituição com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Listar usuários da instituição
router.get('/users', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const { userType, search } = req.query;

    let whereClause = {
      institutionId: req.user.institutionId,
      isActive: true
    };

    if (userType) {
      whereClause.userType = userType;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { cpf: { contains: search } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        age: true,
        userType: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ===== GERENCIAMENTO DE TURMAS =====

// Listar turmas da instituição
router.get('/classes', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      where: {
        institutionId: req.user.institutionId,
        isActive: true
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true
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
    console.error('Erro ao listar turmas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Criar turma
router.post('/classes', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const { name, description, teacherId, school, grade } = req.body;

    if (!name || !teacherId || !school || !grade) {
      return res.status(400).json({
        success: false,
        message: 'Nome, professor, escola e série são obrigatórios'
      });
    }

    // Verificar se professor pertence à instituição
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        institutionId: req.user.institutionId,
        userType: 'TEACHER'
      }
    });

    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: 'Professor não encontrado ou não pertence a esta instituição'
      });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description: description || null,
        teacherId,
        institutionId: req.user.institutionId,
        school,
        grade
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true
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

// Adicionar aluno à turma
router.post('/classes/:classId/students', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'ID do aluno é obrigatório'
      });
    }

    // Verificar se turma pertence à instituição
    const classItem = await prisma.class.findFirst({
      where: {
        id: classId,
        institutionId: req.user.institutionId
      }
    });

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Verificar se aluno pertence à instituição
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        institutionId: req.user.institutionId,
        userType: 'STUDENT'
      }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Aluno não encontrado ou não pertence a esta instituição'
      });
    }

    // Verificar se aluno já está na turma
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
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true
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
router.delete('/classes/:classId/students/:studentId', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    // Verificar se turma pertence à instituição
    const classItem = await prisma.class.findFirst({
      where: {
        id: classId,
        institutionId: req.user.institutionId
      }
    });

    if (!classItem) {
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

// Remover turma
router.delete('/classes/:classId', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const { classId } = req.params;

    // Verificar se turma pertence à instituição
    const classItem = await prisma.class.findFirst({
      where: {
        id: classId,
        institutionId: req.user.institutionId
      }
    });

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Turma não encontrada'
      });
    }

    // Desativar turma em vez de deletar
    await prisma.class.update({
      where: { id: classId },
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

// ===== ESTATÍSTICAS =====

// Obter estatísticas da instituição
router.get('/stats', authenticateToken, requireInstitution, async (req, res) => {
  try {
    const institutionId = req.user.institutionId;

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      activeClasses
    ] = await Promise.all([
      prisma.user.count({
        where: {
          institutionId,
          userType: 'STUDENT',
          isActive: true
        }
      }),
      prisma.user.count({
        where: {
          institutionId,
          userType: 'TEACHER',
          isActive: true
        }
      }),
      prisma.class.count({
        where: {
          institutionId,
          isActive: true
        }
      }),
      prisma.class.count({
        where: {
          institutionId,
          isActive: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        activeClasses
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

module.exports = router;
