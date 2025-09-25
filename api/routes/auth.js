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

// Registrar usuário
router.post('/register', async (req, res) => {
  try {
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
      const existingCpf = await prisma.user.findUnique({
        where: { cpf: cleanCpf }
      });
      
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
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este email já está cadastrado'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf: cpf ? cpf.replace(/\D/g, '') : null,
        age: age ? parseInt(age) : null,
        school: school || null,
        class: userClass || null,
        userType
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        age: true,
        school: true,
        class: true,
        avatar: true,
        userType: true,
        createdAt: true
      }
    });

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
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
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
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        school: true,
        class: true,
        avatar: true,
        userType: true,
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
    const userId = req.user.userId;

    // Verificar se o usuário é um aluno
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

    // Buscar a turma ativa do aluno
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
                name: true,
                email: true,
                avatar: true
              }
            },
            students: {
              where: {
                isActive: true
              },
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
        }
      }
    });

    if (!classStudent) {
      return res.json({
        success: true,
        data: null,
        message: 'Aluno não está em nenhuma turma ativa'
      });
    }

    res.json({
      success: true,
      data: {
        class: classStudent.class,
        teacher: classStudent.class.teacher,
        classmates: classStudent.class.students.map(cs => cs.student)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar turma do aluno:', error);
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
