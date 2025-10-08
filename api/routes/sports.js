const express = require('express');
const { supabase } = require('../supabase');
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
    const { data: sports, error: sportsError } = await supabase
      .from('sports')
      .select(`
        id,
        name,
        description,
        icon,
        color
      `)
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (sportsError) {
      console.error('Erro ao buscar esportes:', sportsError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar esportes'
      });
    }

    // Buscar contagens para cada esporte
    const sportsWithCounts = await Promise.all(
      sports.map(async (sport) => {
        const { count: contentsCount } = await supabase
          .from('contents')
          .select('*', { count: 'exact', head: true })
          .eq('sport_id', sport.id)
          .eq('isActive', true);

        const { count: userSportsCount } = await supabase
          .from('user_sports')
          .select('*', { count: 'exact', head: true })
          .eq('sport_id', sport.id)
          .eq('is_active', true);

        return {
          ...sport,
          _count: {
            contents: contentsCount || 0,
            userSports: userSportsCount || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: { sports: sportsWithCounts }
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

    const { data: sport, error: sportError } = await supabase
      .from('sports')
      .select(`
        id,
        name,
        description,
        icon,
        color
      `)
      .eq('id', id)
      .single();

    if (sportError || !sport) {
      return res.status(404).json({
        success: false,
        message: 'Esporte não encontrado'
      });
    }

    // Buscar conteúdos do esporte
    const { data: contents, error: contentsError } = await supabase
      .from('contents')
      .select(`
        id,
        title,
        description,
        type,
        difficulty,
        duration,
        imageUrl
      `)
      .eq('sport_id', id)
      .eq('isActive', true)
      .order('type', { ascending: true })
      .order('difficulty', { ascending: true });

    // Buscar contagens
    const { count: userSportsCount } = await supabase
      .from('user_sports')
      .select('*', { count: 'exact', head: true })
      .eq('sport_id', id)
      .eq('is_active', true);

    const { count: contentsCount } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })
      .eq('sport_id', id)
      .eq('isActive', true);

    const sportWithData = {
      ...sport,
      contents: contents || [],
      _count: {
        userSports: userSportsCount || 0,
        contents: contentsCount || 0
      }
    };

    res.json({
      success: true,
      data: { sport: sportWithData }
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
router.get('/:id/ranking', authenticateToken, async (req, res) => {
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

    let whereClause = { sportId };
    
    // Se for uma instituição, filtrar apenas usuários da instituição
    if (req.user.userType === 'INSTITUTION') {
      whereClause.user = {
        institutionId: req.user.institutionId
      };
    }

    const rankings = await prisma.userScore.findMany({
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
      orderBy: [
        { score: 'desc' },
        { level: 'desc' },
        { createdAt: 'asc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.userScore.count({
      where: whereClause
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

// ===== FAVORITOS =====

// Adicionar esporte aos favoritos
router.post('/:id/favorite', authenticateToken, async (req, res) => {
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

    // Verificar se já está nos favoritos
    const existingFavorite = await prisma.userSport.findUnique({
      where: {
        userId_sportId: {
          userId,
          sportId
        }
      }
    });

    if (existingFavorite && existingFavorite.isActive) {
      return res.status(409).json({
        success: false,
        message: 'Esporte já está nos seus favoritos'
      });
    }

    // Criar ou reativar favorito
    if (existingFavorite) {
      await prisma.userSport.update({
        where: { id: existingFavorite.id },
        data: { isActive: true }
      });
    } else {
      await prisma.userSport.create({
        data: {
          userId,
          sportId
        }
      });
    }

    res.json({
      success: true,
      message: 'Esporte adicionado aos favoritos'
    });

  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Remover esporte dos favoritos
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
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
        message: 'Esporte não está nos seus favoritos'
      });
    }

    // Desativar favorito
    await prisma.userSport.update({
      where: { id: userSport.id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Esporte removido dos favoritos'
    });

  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar esportes favoritos do usuário
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const favoriteSports = await prisma.userSport.findMany({
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: {
        sports: favoriteSports.map(fav => fav.sport)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
