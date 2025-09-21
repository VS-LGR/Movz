const express = require('express');
const prisma = require('../prisma');
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

// Buscar todos os esportes
router.get('/', async (req, res) => {
  try {
    const sports = await prisma.sport.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        _count: {
          select: {
            contents: true,
            userSports: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: { sports }
    });

  } catch (error) {
    console.error('Erro ao buscar esportes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar esporte por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sport = await prisma.sport.findUnique({
      where: { id },
      include: {
        contents: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            difficulty: true,
            duration: true,
            imageUrl: true
          },
          orderBy: [
            { type: 'asc' },
            { difficulty: 'asc' }
          ]
        },
        _count: {
          select: {
            userSports: true,
            contents: true
          }
        }
      }
    });

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Esporte não encontrado'
      });
    }

    res.json({
      success: true,
      data: { sport }
    });

  } catch (error) {
    console.error('Erro ao buscar esporte:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Adicionar esporte ao usuário
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id: sportId } = req.params;
    const userId = req.user.userId;

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

    // Verificar se o usuário já está inscrito
    const existingUserSport = await prisma.userSport.findUnique({
      where: {
        userId_sportId: {
          userId,
          sportId
        }
      }
    });

    if (existingUserSport) {
      if (existingUserSport.isActive) {
        return res.status(409).json({
          success: false,
          message: 'Você já está inscrito neste esporte'
        });
      } else {
        // Reativar inscrição
        await prisma.userSport.update({
          where: { id: existingUserSport.id },
          data: { isActive: true }
        });

        return res.json({
          success: true,
          message: 'Inscrição reativada com sucesso'
        });
      }
    }

    // Criar nova inscrição
    await prisma.userSport.create({
      data: {
        userId,
        sportId
      }
    });

    res.json({
      success: true,
      message: 'Inscrito no esporte com sucesso'
    });

  } catch (error) {
    console.error('Erro ao se inscrever no esporte:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Remover esporte do usuário
router.delete('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id: sportId } = req.params;
    const userId = req.user.userId;

    const userSport = await prisma.userSport.findUnique({
      where: {
        userId_sportId: {
          userId,
          sportId
        }
      }
    });

    if (!userSport) {
      return res.status(404).json({
        success: false,
        message: 'Você não está inscrito neste esporte'
      });
    }

    // Desativar inscrição ao invés de deletar
    await prisma.userSport.update({
      where: { id: userSport.id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Inscrição removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao sair do esporte:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar esportes do usuário
router.get('/user/my-sports', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userSports = await prisma.userSport.findMany({
      where: { 
        userId,
        isActive: true
      },
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { userSports }
    });

  } catch (error) {
    console.error('Erro ao buscar esportes do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar ranking de um esporte
router.get('/:id/ranking', async (req, res) => {
  try {
    const { id: sportId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

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

    const rankings = await prisma.userScore.findMany({
      where: { sportId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
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
      where: { sportId }
    });

    res.json({
      success: true,
      data: {
        sport: {
          id: sport.id,
          name: sport.name,
          icon: sport.icon,
          color: sport.color
        },
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

module.exports = router;
