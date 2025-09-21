const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
// Importar authenticateToken do arquivo auth.js
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

// Buscar perfil do usuário
router.get('/profile', authenticateToken, async (req, res) => {
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
        createdAt: true,
        updatedAt: true,
        userSports: {
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
        }
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
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar perfil do usuário
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, age, school, class: userClass, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (age !== undefined) updateData.age = parseInt(age);
    if (school !== undefined) updateData.school = school;
    if (userClass !== undefined) updateData.class = userClass;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        school: true,
        class: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: { user }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Alterar senha
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar estatísticas do usuário
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      totalScores,
      totalProgress,
      userScores,
      userProgress
    ] = await Promise.all([
      prisma.userScore.count({
        where: { userId }
      }),
      prisma.userProgress.count({
        where: { userId }
      }),
      prisma.userScore.findMany({
        where: { userId },
        include: {
          sport: {
            select: {
              name: true,
              icon: true,
              color: true
            }
          }
        },
        orderBy: { score: 'desc' },
        take: 5
      }),
      prisma.userProgress.findMany({
        where: { 
          userId,
          progress: 100
        },
        include: {
          content: {
            select: {
              title: true,
              type: true
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        totalScores,
        totalProgress,
        recentScores: userScores,
        recentProgress: userProgress
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

// Deletar conta
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória para deletar a conta'
      });
    }

    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Deletar usuário (cascade vai deletar dados relacionados)
    await prisma.user.delete({
      where: { id: req.user.userId }
    });

    res.json({
      success: true,
      message: 'Conta deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
