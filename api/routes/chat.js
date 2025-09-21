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

// Enviar mensagem
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem não pode estar vazia'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem muito longa (máximo 1000 caracteres)'
      });
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId,
        message: message.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: { chatMessage }
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar mensagens
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, before } = req.query;

    const whereClause = {};
    if (before) {
      whereClause.createdAt = {
        lt: new Date(before)
      };
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.chatMessage.count();

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Ordenar do mais antigo para o mais recente
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Marcar mensagens como lidas
router.put('/mark-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.chatMessage.updateMany({
      where: {
        userId: {
          not: userId
        },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas'
    });

  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar estatísticas do chat
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      totalMessages,
      unreadMessages,
      userMessages,
      recentActivity
    ] = await Promise.all([
      prisma.chatMessage.count(),
      prisma.chatMessage.count({
        where: {
          userId: {
            not: userId
          },
          isRead: false
        }
      }),
      prisma.chatMessage.count({
        where: { userId }
      }),
      prisma.chatMessage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalMessages,
        unreadMessages,
        userMessages,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do chat:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar mensagem (apenas do próprio usuário)
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        userId
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada ou você não tem permissão para deletá-la'
      });
    }

    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    res.json({
      success: true,
      message: 'Mensagem deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
