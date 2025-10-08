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
    const userId = req.user.userId;

    // Verificar se o usuário é um aluno
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

    // Buscar a turma ativa do aluno
    const { data: classStudent, error: classError } = await supabase
      .from('class_students')
      .select(`
        *,
        classes:class_id (
          *,
          teachers:teacher_id (
            id, name, email, avatar
          ),
          students:class_students!class_id (
            *,
            students:student_id (
              id, name, email, age, avatar
            )
          )
        )
      `)
      .eq('student_id', userId)
      .eq('is_active', true)
      .single();

    if (classError || !classStudent) {
      return res.json({
        success: true,
        data: null,
        message: 'Aluno não está em nenhuma turma ativa'
      });
    }

    // Filtrar apenas alunos ativos
    const activeStudents = classStudent.classes.students.filter(cs => cs.is_active);

    res.json({
      success: true,
      data: {
        class: classStudent.classes,
        teacher: classStudent.classes.teachers,
        classmates: activeStudents.map(cs => cs.students)
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
