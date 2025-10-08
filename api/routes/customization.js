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

// Buscar perfil de customização do aluno
router.get('/student/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verificar se é aluno
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('userType, cardBanner, cardBackground')
      .eq('id', userId)
      .single();

    console.log('🔍 Customization - User ID:', userId);
    console.log('🔍 Customization - User data:', user);
    console.log('🔍 Customization - User error:', userError);

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar usuário'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (user.userType !== 'STUDENT') {
      console.log('🔍 Customization - User type mismatch:', user.userType, 'expected STUDENT');
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta funcionalidade'
      });
    }

    // Retornar dados de customização
    res.json({
      success: true,
      data: {
        cardBanner: user.cardBanner || 'Banner Padrão',
        cardTheme: user.cardBackground || 'default'
      }
    });

  } catch (error) {
    console.error('Erro ao buscar perfil de customização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar perfil de customização do aluno
router.put('/student/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cardBanner, cardTheme } = req.body;

    // Verificar se é aluno
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

    // Atualizar customização
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        cardBanner: cardBanner || 'Banner Padrão',
        cardBackground: cardTheme || 'default',
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)
      .select('cardBanner, cardBackground')
      .single();

    if (updateError) {
      console.error('Erro ao atualizar customização:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar customização'
      });
    }

    res.json({
      success: true,
      message: 'Customização atualizada com sucesso',
      data: updatedUser
    });

  } catch (error) {
    console.error('Erro ao atualizar customização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;