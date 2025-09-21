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

// Buscar conteúdos por esporte
router.get('/sport/:sportId', async (req, res) => {
  try {
    const { sportId } = req.params;
    const { type, difficulty, limit = 20, offset = 0 } = req.query;

    const whereClause = {
      sportId,
      isActive: true
    };

    if (type) {
      whereClause.type = type;
    }

    if (difficulty) {
      whereClause.difficulty = difficulty;
    }

    const contents = await prisma.content.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        difficulty: true,
        duration: true,
        instructions: true,
        videoUrl: true,
        imageUrl: true,
        createdAt: true
      },
      orderBy: [
        { type: 'asc' },
        { difficulty: 'asc' },
        { title: 'asc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.content.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        contents,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar conteúdos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar conteúdo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findUnique({
      where: { id },
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
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    res.json({
      success: true,
      data: { content }
    });

  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar conteúdos por tipo (aquecimento, treino, desaquecimento)
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { sportId, difficulty, limit = 20, offset = 0 } = req.query;

    const whereClause = {
      type: type.toUpperCase(),
      isActive: true
    };

    if (sportId) {
      whereClause.sportId = sportId;
    }

    if (difficulty) {
      whereClause.difficulty = difficulty.toUpperCase();
    }

    const contents = await prisma.content.findMany({
      where: whereClause,
      include: {
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
        { difficulty: 'asc' },
        { title: 'asc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.content.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        contents,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar conteúdos por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar progresso do usuário em um conteúdo
router.get('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id: contentId } = req.params;
    const userId = req.user.userId;

    const progress = await prisma.userProgress.findFirst({
      where: {
        userId,
        contentId
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            type: true,
            difficulty: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { 
        progress: progress || {
          progress: 0,
          completedAt: null,
          content: null
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar progresso do usuário
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id: contentId } = req.params;
    const { progress: progressValue } = req.body;
    const userId = req.user.userId;

    if (progressValue < 0 || progressValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progresso deve estar entre 0 e 100'
      });
    }

    // Verificar se o conteúdo existe
    const content = await prisma.content.findUnique({
      where: { id: contentId }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    const updateData = {
      progress: progressValue,
      completedAt: progressValue === 100 ? new Date() : null
    };

    const userProgress = await prisma.userProgress.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      },
      update: updateData,
      create: {
        userId,
        contentId,
        sportId: content.sportId,
        ...updateData
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            type: true,
            difficulty: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: progressValue === 100 ? 'Conteúdo concluído!' : 'Progresso atualizado',
      data: { userProgress }
    });

  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar conteúdos concluídos pelo usuário
router.get('/user/completed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const completedContents = await prisma.userProgress.findMany({
      where: {
        userId,
        progress: 100
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            difficulty: true,
            duration: true,
            imageUrl: true
          }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.userProgress.count({
      where: {
        userId,
        progress: 100
      }
    });

    res.json({
      success: true,
      data: {
        completedContents,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar conteúdos concluídos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
