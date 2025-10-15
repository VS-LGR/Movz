const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../supabase');
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
    const userId = req.user.userId;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        age,
        school,
        class,
        avatar,
        createdAt,
        updatedAt,
        userType,
        totalXP,
        level,
        cardBanner,
        cardBackground
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Buscar esportes do usuário
    const { data: userSports, error: sportsError } = await supabase
      .from('user_sports')
      .select(`
        *,
        sports:sportId (
          id,
          name,
          icon,
          color
        )
      `)
      .eq('userId', userId)
      .eq('isActive', true);

    if (sportsError) {
      console.error('Erro ao buscar esportes do usuário:', sportsError);
    }

    // Calcular dados de XP
    const totalXP = user.totalXP || 0;
    const level = user.level || 1;
    const xpForCurrentLevel = (level - 1) * 1000;
    const xpForNextLevel = level * 1000;
    const progress = Math.max(0, Math.min(1000, totalXP - xpForCurrentLevel));
    const needed = Math.max(0, xpForNextLevel - totalXP);
    
    console.log('🔍 API - XP Debug:', {
      totalXP,
      level,
      xpForCurrentLevel,
      xpForNextLevel,
      progress,
      needed
    });

    // Buscar dados para conquistas e medalhas
    const { data: classScores } = await supabase
      .from('class_scores')
      .select('score')
      .eq('studentId', userId);

    const { data: attendances } = await supabase
      .from('attendances')
      .select('isPresent')
      .eq('studentId', userId);

    // Buscar conquistas desbloqueadas
    const { data: userAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        id,
        unlockedAt,
        isActive,
        achievement:achievements!user_achievements_achievementId_fkey(
          id, name, description, icon, category, rarity, color, requirement, xpReward
        )
      `)
      .eq('userId', userId)
      .eq('isActive', true)
      .order('unlockedAt', { ascending: false });

    // Buscar medalhas desbloqueadas
    const { data: userMedals, error: medalsError } = await supabase
      .from('user_medals')
      .select(`
        id,
        unlockedAt,
        isActive,
        medal:medals!user_medals_medalId_fkey(
          id, name, description, icon, category, rarity, color, requirement, xpReward
        )
      `)
      .eq('userId', userId)
      .eq('isActive', true)
      .order('unlockedAt', { ascending: false });

    // Buscar todas as conquistas e medalhas para calcular porcentagem
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('id')
      .eq('isActive', true);

    const { data: allMedals } = await supabase
      .from('medals')
      .select('id')
      .eq('isActive', true);

    // Calcular estatísticas
    const totalClasses = classScores?.length || 0;
    const maxScore = classScores?.length > 0 ? Math.max(...classScores.map(cs => cs.score)) : 0;
    const presentClasses = attendances?.filter(a => a.isPresent).length || 0;
    const attendanceRate = attendances?.length > 0 ? Math.round((presentClasses / attendances.length) * 100) : 0;
    const sportsCount = userSports?.length || 0;

    const achievementsCount = userAchievements?.length || 0;
    const medalsCount = userMedals?.length || 0;
    const totalAchievements = allAchievements?.length || 0;
    const totalMedals = allMedals?.length || 0;

    const achievementsPercentage = totalAchievements > 0 ? Math.round((achievementsCount / totalAchievements) * 100) : 0;
    const medalsPercentage = totalMedals > 0 ? Math.round((medalsCount / totalMedals) * 100) : 0;

    const userWithSports = {
      ...user,
      userSports: userSports?.map(us => ({
        ...us,
        sport: us.sports
      })) || [],
      student: {
        totalXP,
        level
      },
      xp: {
        progress,
        needed
      },
      // Dados para conquistas e medalhas
      totalClasses,
      maxScore,
      attendanceRate,
      sportsCount,
      achievements: {
        unlocked: userAchievements?.map(ua => ({
          id: ua.id,
          unlockedAt: ua.unlockedAt,
          ...ua.achievement
        })) || [],
        count: achievementsCount,
        total: totalAchievements,
        percentage: achievementsPercentage
      },
      medals: {
        unlocked: userMedals?.map(um => ({
          id: um.id,
          unlockedAt: um.unlockedAt,
          ...um.medal
        })) || [],
        count: medalsCount,
        total: totalMedals,
        percentage: medalsPercentage
      }
    };

    res.json({
      success: true,
      data: { user: userWithSports }
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
    const userId = req.user.userId;
    const { name, age, school, class: userClass, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (age !== undefined) updateData.age = parseInt(age);
    if (school !== undefined) updateData.school = school;
    if (userClass !== undefined) updateData.class = userClass;
    if (avatar !== undefined) updateData.avatar = avatar;
    updateData.updatedAt = new Date().toISOString();

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        name,
        email,
        age,
        school,
        class,
        avatar,
        updatedAt
      `)
      .single();

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar perfil'
      });
    }

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
    const userId = req.user.userId;
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password')
      .eq('id', userId)
      .single();

    if (userError || !user) {
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
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedNewPassword,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar senha'
      });
    }

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

    // Buscar pontuações do usuário
    const { data: userScores, error: scoresError } = await supabase
      .from('user_scores')
      .select(`
        *,
        sports:sport_id (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(5);

    // Buscar progresso do usuário
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        *,
        contents:content_id (
          title,
          type
        )
      `)
      .eq('user_id', userId)
      .eq('progress', 100)
      .order('completed_at', { ascending: false })
      .limit(5);

    // Contar totais
    const { count: totalScores } = await supabase
      .from('user_scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: totalProgress } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (scoresError) {
      console.error('Erro ao buscar pontuações:', scoresError);
    }
    if (progressError) {
      console.error('Erro ao buscar progresso:', progressError);
    }

    res.json({
      success: true,
      data: {
        totalScores: totalScores || 0,
        totalProgress: totalProgress || 0,
        recentScores: userScores?.map(score => ({
          ...score,
          sport: score.sports
        })) || [],
        recentProgress: userProgress?.map(progress => ({
          ...progress,
          content: progress.contents
        })) || []
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
    const userId = req.user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória para deletar a conta'
      });
    }

    // Buscar usuário com senha
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password')
      .eq('id', userId)
      .single();

    if (userError || !user) {
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
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar conta'
      });
    }

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
