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

// Obter aulas do professor
router.get('/', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let whereClause = {
      teacherId: req.user.userId
    };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const classes = await prisma.teacherClass.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });

    // Converter para formato de objeto com data como chave
    const classesByDate = {};
    classes.forEach(cls => {
      const dateStr = cls.date.toISOString().split('T')[0];
      classesByDate[dateStr] = {
        id: cls.id,
        school: cls.school,
        grade: cls.grade,
        subject: cls.subject,
        isCompleted: cls.isCompleted,
        notes: cls.notes
      };
    });

    res.json({
      success: true,
      data: classesByDate
    });

  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Criar ou atualizar aula
router.post('/', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { date, school, grade, subject, notes } = req.body;

    if (!date || !school || !grade) {
      return res.status(400).json({
        success: false,
        message: 'Data, escola e série são obrigatórios'
      });
    }

    const classDate = new Date(date);
    
    // Verificar se já existe uma aula nesta data
    const existingClass = await prisma.teacherClass.findFirst({
      where: {
        teacherId: req.user.userId,
        date: classDate
      }
    });

    let classData;
    if (existingClass) {
      // Atualizar aula existente
      classData = await prisma.teacherClass.update({
        where: { id: existingClass.id },
        data: {
          school,
          grade,
          subject: subject || null,
          notes: notes || null
        }
      });
    } else {
      // Criar nova aula
      classData = await prisma.teacherClass.create({
        data: {
          teacherId: req.user.userId,
          date: classDate,
          school,
          grade,
          subject: subject || null,
          notes: notes || null
        }
      });
    }

    res.status(201).json({
      success: true,
      message: existingClass ? 'Aula atualizada com sucesso' : 'Aula criada com sucesso',
      data: classData
    });

  } catch (error) {
    console.error('Erro ao criar/atualizar aula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Remover aula
router.delete('/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a aula pertence ao professor
    const existingClass = await prisma.teacherClass.findFirst({
      where: {
        id,
        teacherId: req.user.userId
      }
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Aula não encontrada'
      });
    }

    await prisma.teacherClass.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Aula removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover aula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Marcar aula como concluída
router.put('/:id/complete', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;

    // Verificar se a aula pertence ao professor
    const existingClass = await prisma.teacherClass.findFirst({
      where: {
        id,
        teacherId: req.user.userId
      }
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Aula não encontrada'
      });
    }

    const updatedClass = await prisma.teacherClass.update({
      where: { id },
      data: { isCompleted: Boolean(isCompleted) }
    });

    res.json({
      success: true,
      message: isCompleted ? 'Aula marcada como concluída' : 'Aula marcada como não concluída',
      data: updatedClass
    });

  } catch (error) {
    console.error('Erro ao atualizar status da aula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter estatísticas das aulas
router.get('/stats', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let whereClause = {
      teacherId: req.user.userId
    };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const totalClasses = await prisma.teacherClass.count({
      where: whereClause
    });

    const completedClasses = await prisma.teacherClass.count({
      where: {
        ...whereClause,
        isCompleted: true
      }
    });

    const upcomingClasses = await prisma.teacherClass.count({
      where: {
        ...whereClause,
        isCompleted: false,
        date: {
          gte: new Date()
        }
      }
    });

    res.json({
      success: true,
      data: {
        total: totalClasses,
        completed: completedClasses,
        upcoming: upcomingClasses,
        completionRate: totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0
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
