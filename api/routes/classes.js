const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, generateId } = require('../supabase');

const router = express.Router();

// Função para formatar data
const formatDate = (date) => {
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  } else if (date instanceof Date) {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  return 'Data inválida';
};

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
    console.log('🔵 Classes GET - Recebendo requisição');
    console.log('🔵 Classes GET - User:', req.user);
    console.log('🔵 Classes GET - Query:', req.query);
    
    const { month, year } = req.query;
    
    let query = supabase
      .from('teacher_classes')
      .select('*')
      .eq('teacherId', req.user.userId);
    
    console.log('🔵 Classes GET - Query inicial:', { month, year });

    if (month && year) {
      // CORREÇÃO: Como date agora é string, usar filtro de string
      const startDateStr = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDateStr = `${year}-${month.toString().padStart(2, '0')}-31`;
      
      query = query
        .gte('date', startDateStr)
        .lte('date', endDateStr);
    }

    query = query.order('date', { ascending: true });

    console.log('🔵 Classes GET - Buscando classes...');
    
    const { data: classes, error: classesError } = await query;

    if (classesError) {
      console.error('❌ Classes GET - Erro ao buscar aulas:', classesError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: classesError.message
      });
    }
    
    console.log('🔵 Classes GET - Classes encontradas:', classes?.length || 0);

    // CORREÇÃO: Retornar array de aulas ao invés de objeto agrupado por data
    // Isso permite múltiplas aulas no mesmo dia (de turmas diferentes)
    const classesArray = (classes || []).map(cls => {
      // CORREÇÃO: Forçar conversão para string
      let dateStr;
      if (typeof cls.date === 'string') {
        dateStr = cls.date;
      } else if (cls.date instanceof Date) {
        // Se for Date, converter para string YYYY-MM-DD
        dateStr = cls.date.toISOString().split('T')[0];
      } else {
        // Fallback: tentar converter para string
        dateStr = String(cls.date);
      }
      
      console.log('🔵 API Classes - Processando aula:', {
        id: cls.id,
        originalDate: cls.date,
        originalType: typeof cls.date,
        dateStr: dateStr,
        dateStrType: typeof dateStr
      });
      
      return {
        id: cls.id,
        classId: cls.classId, // ID da turma associada
        school: cls.school,
        grade: cls.grade,
        subject: cls.subject,
        isCompleted: cls.isCompleted,
        notes: cls.notes,
        date: dateStr // CORREÇÃO: Sempre retornar como string
      };
    });

    res.json({
      success: true,
      data: classesArray
    });

  } catch (error) {
    console.error('❌ Classes GET - Erro ao buscar aulas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Criar ou atualizar aula
router.post('/', authenticateToken, requireTeacher, async (req, res) => {
  try {
    console.log('🔵 CreateClass POST - Recebendo requisição');
    console.log('🔵 CreateClass POST - Body:', req.body);
    console.log('🔵 CreateClass POST - User:', req.user);
    
    const { date, school, grade, subject, notes, classId } = req.body;

    if (!date || !school || !grade) {
      console.log('❌ CreateClass POST - Dados obrigatórios faltando:', { date, school, grade });
      return res.status(400).json({
        success: false,
        message: 'Data, escola e série são obrigatórios'
      });
    }

    // CORREÇÃO DEFINITIVA: Usar string de data diretamente para evitar problemas de fuso horário
    let classDate;
    if (typeof date === 'string' && date.includes('-')) {
      // Se é string no formato YYYY-MM-DD, usar diretamente
      classDate = date; // Manter como string
      
      // DEBUG: Verificar se a data está sendo mantida corretamente
      console.log('🔵 CreateClass POST - DEBUG Data:', {
        input: date,
        type: typeof date,
        kept: classDate,
        length: classDate.length
      });
    } else {
      classDate = new Date(date);
    }
    
    console.log('🔵 CreateClass POST - Data recebida:', date);
    console.log('🔵 CreateClass POST - Data mantida:', classDate);
    console.log('🔵 CreateClass POST - Tipo da data:', typeof classDate);
    console.log('🔵 CreateClass POST - Professor:', req.user.userId);
    console.log('🔵 CreateClass POST - Turma:', classId);
    console.log('🔵 CreateClass POST - Assunto:', subject);

    // Verificar se já existe uma aula para esta turma nesta data usando Supabase
    if (classId) {
      const { data: existingClassOnDate, error: checkError } = await supabase
        .from('teacher_classes')
        .select('id')
        .eq('classId', classId)
        .eq('date', classDate)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ CreateClass POST - Erro ao verificar aula existente:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }

      if (existingClassOnDate) {
        console.log('🔴 CreateClass POST - Já existe uma aula para esta turma nesta data:', existingClassOnDate.id);
        return res.status(409).json({
          success: false,
          message: `Já existe uma aula para esta turma no dia ${formatDate(classDate)}. Uma turma só pode ter uma aula por dia.`
        });
      }
    }
    
    // DEBUG: Verificar dados antes de criar
    const createData = {
      id: generateId(),
      teacherId: req.user.userId,
      classId: classId || null,
      date: classDate,
      school,
      grade,
      subject: subject || null,
      notes: notes || null,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('🔵 CreateClass POST - Dados para criação:', createData);
    console.log('🔵 CreateClass POST - Tipo do campo date:', typeof createData.date);
    
    let classData;
    try {
      const { data: newClass, error: createError } = await supabase
        .from('teacher_classes')
        .insert([createData])
        .select()
        .single();

      if (createError) {
        console.error('🔴 CreateClass POST - Erro ao criar aula:', createError);
        console.error('🔴 CreateClass POST - Erro detalhado:', {
          message: createError.message,
          code: createError.code,
          details: createError.details
        });
        throw createError;
      }

      classData = newClass;
      console.log('🔵 CreateClass POST - Aula criada com ID:', classData.id);
    } catch (createError) {
      console.error('🔴 CreateClass POST - Erro ao criar aula:', createError);
      console.error('🔴 CreateClass POST - Erro detalhado:', {
        message: createError.message,
        code: createError.code,
        meta: createError.meta
      });
      throw createError;
    }

    console.log('🔵 CreateClass POST - Aula criada com sucesso:', {
      id: classData.id,
      date: classData.date,
      dateType: typeof classData.date,
      subject: classData.subject,
      teacherId: classData.teacherId
    });

    res.status(201).json({
      success: true,
      message: 'Aula criada com sucesso',
      data: classData
    });

  } catch (error) {
    console.error('❌ CreateClass POST - Erro ao criar/atualizar aula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
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
      // CORREÇÃO: Como date agora é string, usar filtro de string
      const startDateStr = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDateStr = `${year}-${month.toString().padStart(2, '0')}-31`;
      whereClause.date = {
        gte: startDateStr,
        lte: endDateStr
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
