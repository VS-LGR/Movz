import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import useCustomAlert from '../../hooks/useCustomAlert';
import apiService from '../../services/apiService';
import SideMenu from '../../components/SideMenu';

const { width } = Dimensions.get('window');

const ClassScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  // Usar parâmetros passados via navegação
  const classData = window.navigationParams?.classData || {};
  

  const [attendanceTaken, setAttendanceTaken] = useState(false);
  const [classCompleted, setClassCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState('aquecimento');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  
  // Animações para os cards
  const cardAnimations = useRef({
    aquecimento: new Animated.Value(0),
    treino: new Animated.Value(0),
    alongamento: new Animated.Value(0),
    desaquecimento: new Animated.Value(0), // CORREÇÃO: Adicionar animação para desaquecimento
  }).current;
  const [students, setStudents] = useState([]);
  const [sports, setSports] = useState([]);
  const [currentSport, setCurrentSport] = useState(null); // Esporte atual da aula
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [scoresData, setScoresData] = useState({}); // { studentId: { sportId: { score, notes } } }
  
  // Estados para avaliação em lote
  const [selectedStudents, setSelectedStudents] = useState([]); // Array de IDs dos alunos selecionados
  const [batchScore, setBatchScore] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [selectedSportForScoring, setSelectedSportForScoring] = useState(null); // Esporte específico para pontuação
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();

  // Carregar dados iniciais
  useEffect(() => {
    console.log('🔵 ClassScreen - classData recebido:', classData);
    console.log('🔵 ClassScreen - subject:', classData.subject);
    loadStudents();
    loadSports();
    checkAttendanceStatus(); // Verificar se chamada já foi realizada
  }, []);

  // Identificar esporte atual quando sports carregarem
  useEffect(() => {
    if (sports.length > 0 && classData.subject) {
      identifyCurrentSport();
    }
  }, [sports, classData.subject]);

  // Função para identificar o esporte atual da aula
  const identifyCurrentSport = () => {
    if (!classData.subject || sports.length === 0) return;
    
    // Extrair nome do esporte do subject (formato: "Nome do Esporte - Tipo da Aula")
    const subjectParts = classData.subject.split(' - ');
    const sportName = subjectParts[0];
    
    // Encontrar o esporte correspondente
    const sport = sports.find(s => 
      s.name.toLowerCase() === sportName.toLowerCase()
    );
    
    if (sport) {
      console.log('🔵 ClassScreen - Esporte identificado:', sport);
      setCurrentSport(sport);
    } else {
      console.log('🔴 ClassScreen - Esporte não encontrado:', sportName);
    }
  };

  // Função para verificar se é "Aula Livre"
  const isFreeClass = () => {
    if (!classData.subject) return false;
    const subjectParts = classData.subject.split(' - ');
    const sportName = subjectParts[0];
    return sportName === 'Aula Livre';
  };

  // Função para animar os cards
  const animateCard = (cardId, isExpanding) => {
    const animation = cardAnimations[cardId];
    if (!animation) {
      console.log('🔴 ClassScreen - Animação não encontrada para cardId:', cardId);
      return;
    }

    console.log('🔵 ClassScreen - Animando card:', cardId, 'isExpanding:', isExpanding);
    
    Animated.timing(animation, {
      toValue: isExpanding ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Funções para informações dinâmicas baseadas no esporte
  const getDynamicClassTitle = () => {
    if (!currentSport) return 'Treino de Vôlei'; // Fallback
    
    const subjectParts = classData.subject?.split(' - ') || [];
    const classType = subjectParts[1] || 'TREINO';
    
    return `${currentSport.name} - ${classType}`;
  };

  const getDynamicXP = () => {
    if (!currentSport) return 60; // Fallback
    
    // XP baseado no tipo de aula
    const subjectParts = classData.subject?.split(' - ') || [];
    const classType = subjectParts[1] || 'TREINO';
    
    switch (classType.toUpperCase()) {
      case 'AQUECIMENTO':
        return 20;
      case 'TREINO':
        return 60;
      case 'PRATICA':
        return 80;
      case 'COMPETICAO':
        return 100;
      default:
        return 60;
    }
  };

  const getDynamicDuration = () => {
    if (!currentSport) return '60min'; // Fallback
    
    const subjectParts = classData.subject?.split(' - ') || [];
    const classType = subjectParts[1] || 'TREINO';
    
    switch (classType.toUpperCase()) {
      case 'AQUECIMENTO':
        return '30min';
      case 'TREINO':
        return '60min';
      case 'PRATICA':
        return '90min';
      case 'COMPETICAO':
        return '120min';
      default:
        return '60min';
    }
  };

  // Verificar se a chamada já foi realizada
  const checkAttendanceStatus = async () => {
    if (!classData?.id) return;
    
    try {
      console.log('🔵 ClassScreen - Verificando status da chamada para aula:', classData.id);
      const response = await apiService.getClassAttendance(classData.id, classData.date);
      
      // CORREÇÃO: Verificar se as presenças são da aula específica
      // A API retorna presenças da turma na data, mas precisamos verificar se são da aula específica
      if (response.success && response.data.attendances && response.data.attendances.length > 0) {
        // Verificar se todas as presenças são da aula específica (teacherClass.id)
        const allAttendancesFromThisClass = response.data.attendances.every(attendance => 
          attendance.teacherClassId === classData.id
        );
        
        if (allAttendancesFromThisClass) {
          console.log('🔵 ClassScreen - Chamada já foi realizada para esta aula específica');
          setAttendanceTaken(true);
        } else {
          console.log('🔵 ClassScreen - Presenças encontradas são de outras aulas da mesma turma');
          setAttendanceTaken(false);
        }
      } else {
        console.log('🔵 ClassScreen - Chamada ainda não foi realizada');
        setAttendanceTaken(false);
      }
    } catch (error) {
      console.error('🔴 ClassScreen - Erro ao verificar status da chamada:', error);
      setAttendanceTaken(false);
    }
  };

  const loadStudents = async () => {
    try {
      console.log('🔵 Carregando alunos para a aula:', classData);
      console.log('🔵 classData.classId:', classData.classId);
      console.log('🔵 classData.id:', classData.id);
      
      // Se a aula tem classId (ID da turma), buscar alunos da turma
      if (classData.classId) {
        console.log('🔵 Buscando alunos da turma:', classData.classId);
        const response = await apiService.getClassStudents(classData.classId);
        console.log('🔵 Resposta da API getClassStudents:', response);
        if (response.success) {
          const students = response.data.map(item => item.student);
          console.log(`🔵 ${students.length} alunos encontrados na turma:`, students.map(s => s.name));
          setStudents(students);
        } else {
          console.error('❌ Erro ao buscar alunos da turma:', response.message);
        }
      } else {
        console.log('🔵 Aula sem turma associada, usando alunos passados via navegação');
        // Usar alunos passados via navegação (fallback)
        if (classData.students && Array.isArray(classData.students)) {
          console.log('🔵 Usando alunos passados via navegação:', classData.students.length);
          setStudents(classData.students);
        } else {
          console.log('🔵 Nenhum aluno encontrado');
          setStudents([]);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar alunos:', error);
    }
  };

  const loadSports = async () => {
    try {
      const response = await apiService.getSports();
      if (response.success) {
        setSports(response.data.sports || []);
      }
    } catch (error) {
      console.error('Erro ao carregar esportes:', error);
    }
  };

  // Dados de exemplo dos exercícios (em produção viria da API)
  const workoutSections = [
    {
      id: 'aquecimento',
      title: 'Aquecimento',
      duration: '7min',
      exercises: [
        { name: 'Corrida Leve', repetitions: '5 minutos' },
        { name: 'Alongamento Dinâmico', repetitions: '2 minutos' },
        { name: 'Aquecimento Articular', repetitions: '1 série' },
      ],
    },
    {
      id: 'treino',
      title: 'Treino',
      duration: '30min',
      exercises: [
        { name: 'Saque', repetitions: '20 repetições' },
        { name: 'Recepção', repetitions: '20 repetições' },
        { name: 'Levantamento', repetitions: '20 repetições' },
        { name: 'Ataque', repetitions: '20 repetições' },
        { name: 'Bloqueio', repetitions: '20 repetições' },
        { name: 'Defesa', repetitions: '20 repetições' },
      ],
    },
    {
      id: 'desaquecimento',
      title: 'Desaquecimento',
      duration: '8min',
      exercises: [
        { name: 'Alongamento Final', repetitions: '5 minutos' },
        { name: 'Relaxamento', repetitions: '3 minutos' },
      ],
    },
  ];

  const handleTakeAttendance = async () => {
    try {
      setLoading(true);
      
      if (!classData.classId) {
        showError('❌ Erro', 'Aula não está associada a uma turma');
        return;
      }

      // Salvar presença de todos os alunos
      const attendancePromises = students.map(async (student) => {
        const status = attendanceData[student.id] || 'present'; // Default: presente
        
        try {
          const response = await apiService.saveAttendance(classData.classId, {
            studentId: student.id,
            isPresent: status === 'present',
            date: classData.date
          });
          
          if (!response.success) {
            console.error(`Erro ao salvar presença do aluno ${student.name}:`, response.message);
          }
        } catch (error) {
          console.error(`Erro ao salvar presença do aluno ${student.name}:`, error);
        }
      });

      await Promise.all(attendancePromises);
      
      setAttendanceTaken(true);
      showSuccess('Sucesso! 🎉', 'Chamada realizada com sucesso!');
    } catch (error) {
      showError('❌ Erro', 'Erro ao realizar a chamada');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteClass = () => {
    setShowCompletionModal(true);
  };

  const confirmCompleteClass = async () => {
    try {
      setLoading(true);
      
      console.log('🔵 ClassData:', classData);
      console.log('🔵 Class ID:', classData.id);
      
      if (!classData.id) {
        throw new Error('ID da aula não encontrado');
      }
      
      // Chamar API para marcar aula como concluída
      const response = await apiService.completeClass(classData.id, true);
      
      if (response.success) {
        setClassCompleted(true);
        setShowCompletionModal(false);
        
        // Marcar que a aula foi concluída nos parâmetros de navegação
        if (window.navigationParams) {
          window.navigationParams.classCompleted = true;
        }
        
        showSuccess('Sucesso! 🎉', 'Aula concluída com sucesso!');
        
        // Navegar de volta para a lista de aulas
        onNavigate('teacherClasses');
      } else {
        throw new Error(response.message || 'Erro ao concluir a aula');
      }
    } catch (error) {
      console.error('Erro ao concluir aula:', error);
      showError('❌ Erro', error.message || 'Erro ao concluir a aula');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScoring = () => {
    setShowScoringModal(true);
  };

  // Funções para avaliação em lote
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };


  const handleBatchSaveScores = async () => {
    try {
      if (selectedStudents.length === 0) {
        showError('❌ Erro', 'Selecione pelo menos um aluno');
        return;
      }

      if (!batchScore) {
        showError('❌ Erro', 'Digite uma pontuação');
        return;
      }

      const scoreValue = parseInt(batchScore);
      if (scoreValue < 0 || scoreValue > 100) {
        showError('❌ Erro', 'Pontuação deve estar entre 0 e 100');
        return;
      }

      setLoading(true);
      
      if (!classData.classId) {
        showError('❌ Erro', 'Aula não está associada a uma turma');
        return;
      }

      // Determinar o esporte para pontuação
      let classSport;
      
      if (isFreeClass()) {
        // Para "Aula Livre", usar o esporte selecionado pelo professor
        if (!selectedSportForScoring) {
          showError('❌ Erro', 'Selecione um esporte para continuar');
          return;
        }
        classSport = selectedSportForScoring;
        console.log('🔵 ClassScreen - Usando esporte selecionado para "Aula Livre":', classSport.name);
      } else {
        // Para outros esportes, usar o esporte da aula automaticamente
        const subjectParts = classData.subject?.split(' - ') || [];
        const sportName = subjectParts[0]; // Primeira parte é o nome do esporte
        
        classSport = sports.find(sport => 
          sport.name.toLowerCase() === sportName?.toLowerCase()
        );

        if (!classSport) {
          showError('❌ Erro', `Esporte "${sportName}" da aula não encontrado`);
          return;
        }
        console.log('🔵 ClassScreen - Usando esporte da aula:', classSport.name);
      }

      // Salvar pontuação para todos os alunos selecionados
      const scorePromises = selectedStudents.map(async (studentId) => {
        try {
          console.log('🔵 ClassScreen - Salvando pontuação:', {
            classId: classData.classId,
            studentId,
            sportId: classSport.id,
            score: scoreValue,
            notes: batchNotes.trim() || null,
            lessonDate: classData.date
          });
          
          const response = await apiService.saveClassScore(
            classData.classId,
            studentId,
            classSport.id,
            scoreValue,
            batchNotes.trim() || null,
            classData.date
          );
          
          console.log('🔵 ClassScreen - Resposta da API:', response);
          
          if (!response.success) {
            console.error(`🔴 Erro ao salvar pontuação do aluno ${studentId}:`, response.message);
            throw new Error(response.message || 'Erro ao salvar pontuação');
          }
        } catch (error) {
          console.error(`🔴 Erro ao salvar pontuação do aluno ${studentId}:`, error);
          throw error;
        }
      });

      await Promise.all(scorePromises);

      // CORREÇÃO: Só salvar presenças se a chamada ainda não foi realizada
      if (!attendanceTaken) {
        // Salvar presença de todos os alunos usando a nova API em lote
        const attendances = students.map(student => ({
          studentId: student.id,
          isPresent: true // Por padrão, todos presentes quando há pontuação
        }));

        console.log('🔵 ClassScreen - Salvando presenças:', {
          classId: classData.id, // ← CORREÇÃO: Usar ID da aula específica
          attendances,
          lessonDate: classData.date
        });

        try {
          const attendanceResponse = await apiService.saveBatchAttendance(
            classData.id, // ← CORREÇÃO: Usar ID da aula específica
            attendances, 
            classData.date
          );
          
          console.log('🔵 ClassScreen - Resposta da API de presença:', attendanceResponse);
          
          if (!attendanceResponse.success) {
            console.error('🔴 Erro ao salvar presenças:', attendanceResponse.message);
          } else {
            setAttendanceTaken(true); // Marcar chamada como realizada
          }
        } catch (error) {
          console.error('🔴 Erro ao salvar presenças:', error);
        }
      } else {
        console.log('🔵 ClassScreen - Chamada já realizada, não alterando presenças');
      }

      if (attendanceTaken) {
        showSuccess('Sucesso! 🎉', `Pontuações salvas para ${selectedStudents.length} aluno(s) no esporte ${classSport.name}!`);
      } else {
        showSuccess('Sucesso! 🎉', `Pontuações e presenças salvas para ${selectedStudents.length} aluno(s) no esporte ${classSport.name}!`);
      }
      
      // Limpar estados
      setSelectedStudents([]);
      setBatchScore('');
      setBatchNotes('');
      setSelectedSportForScoring(null); // Limpar seleção de esporte
      setShowScoringModal(false);
      setAttendanceTaken(true);
      
      loadStudents(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao salvar avaliações:', error);
      showError('❌ Erro', 'Erro ao salvar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScore = async () => {
    try {
      if (!selectedStudent || !selectedSport || !score) {
        showError('❌ Erro', 'Preencha todos os campos obrigatórios');
        return;
      }

      const scoreValue = parseInt(score);
      if (scoreValue < 0 || scoreValue > 100) {
        showError('❌ Erro', 'Pontuação deve estar entre 0 e 100');
        return;
      }

      setLoading(true);
      
      if (!classData.classId) {
        showError('❌ Erro', 'Aula não está associada a uma turma');
        return;
      }
      
      const response = await apiService.saveClassScore(
        classData.classId,
        selectedStudent.id,
        selectedSport.id,
        scoreValue,
        notes.trim() || null
      );

      if (response.success) {
        showSuccess('Sucesso! 🎉', 'Pontuação salva com sucesso!');
        setShowScoringModal(false);
        setSelectedStudent(null);
        setSelectedSport(null);
        setScore('');
        setNotes('');
        loadStudents(); // Recarregar dados
      } else {
        throw new Error(response.message || 'Erro ao salvar pontuação');
      }
    } catch (error) {
      console.error('Erro ao salvar pontuação:', error);
      showError('❌ Erro', error.message || 'Erro ao salvar pontuação');
    } finally {
      setLoading(false);
    }
  };

  const renderWorkoutCard = (section) => {
    const isExpanded = expandedCard === section.id;
    const animation = cardAnimations[section.id];
    
    console.log('🔵 ClassScreen - Renderizando card:', section.id, 'animation:', !!animation);
    
    // Verificação de segurança para a animação
    if (!animation) {
      console.log('🔴 ClassScreen - Usando fallback para card:', section.id);
      return (
        <TouchableOpacity
          key={section.id}
          style={[
            styles.workoutCard,
            isExpanded && styles.expandedCard
          ]}
          onPress={() => setExpandedCard(isExpanded ? null : section.id)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.cardDuration}>{section.duration}</Text>
            </View>
            <View style={styles.expandIcon}>
              <Text style={styles.expandIconText}>
                {isExpanded ? '⌄' : '>'}
              </Text>
            </View>
          </View>
          
          {isExpanded && (
            <View style={styles.exercisesList}>
              {section.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseReps}>{exercise.repetitions}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        key={section.id}
        style={[
          styles.workoutCard,
          isExpanded && styles.expandedCard
        ]}
        onPress={() => {
          const newExpandedCard = isExpanded ? null : section.id;
          setExpandedCard(newExpandedCard);
          animateCard(section.id, !isExpanded);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDuration}>{section.duration}</Text>
          </View>
          <View style={styles.expandIcon}>
            <Animated.Text 
              style={[
                styles.expandIconText,
                {
                  transform: [{
                    rotate: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '90deg']
                    })
                  }]
                }
              ]}
            >
              >
            </Animated.Text>
          </View>
        </View>
        
        <Animated.View 
          style={[
            styles.exercisesList,
            {
              opacity: animation,
              maxHeight: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200]
              })
            }
          ]}
        >
          {section.exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseItem}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseReps}>{exercise.repetitions}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Background com imagem do esporte */}
      {currentSport?.icon && (
        <View style={styles.sportBackgroundContainer}>
          <Image 
            source={{ uri: currentSport.icon }} 
            style={styles.sportBackgroundImage}
            tintColor={currentSport.color || '#F9BB55'}
            resizeMode="contain"
          />
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logo}>Muvz</Text>
          <TouchableOpacity 
            style={styles.menuLines}
            onPress={() => setIsMenuVisible(true)}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title}>Início da Aula</Text>
        <Text style={styles.subtitle}>
          Vamos começar a aula da {classData?.grade || 'turma'}?
        </Text>
        
        <View style={styles.divider} />
        
        <View style={styles.classTitleContainer}>
          {currentSport?.icon && (
            <Image 
              source={{ uri: currentSport.icon }} 
            style={styles.classTitleIcon}
            tintColor={currentSport.color || '#F9BB55'}
              resizeMode="contain"
            />
          )}
          <Text style={styles.classTitle}>{getDynamicClassTitle()}</Text>
        </View>
        <Text style={styles.classInfo}>
          Duração: {getDynamicDuration()} • Esse treino vale <Text style={styles.xpNumber}>{getDynamicXP()}xp</Text> para seus alunos
        </Text>
      </View>

      {/* Status da Chamada */}
      {attendanceTaken && (
        <View style={styles.attendanceStatusContainer}>
          <Text style={styles.attendanceStatusText}>✅ Chamada realizada com sucesso!</Text>
        </View>
      )}

      {/* Seções de Exercícios */}
      <View style={styles.workoutContainer}>
        {workoutSections.map(renderWorkoutCard)}
      </View>

      {/* Botões de Ação */}
      <View style={styles.actionButtonsContainer}>
        {/* Botão de Lista de Presença */}
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.attendanceButton,
            attendanceTaken && styles.attendanceButtonCompleted
          ]}
          onPress={() => {
            console.log('🔵 ClassScreen - Navegando para attendanceList com classData:', classData);
            onNavigate('attendanceList', { classData });
          }}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>
            {(() => {
              const text = attendanceTaken ? '✅ Chamada Realizada' : '📋 Lista de Presença';
              console.log('🔵 ClassScreen - Botão Lista de Presença:', text, 'attendanceTaken:', attendanceTaken);
              return text;
            })()}
          </Text>
        </TouchableOpacity>

        {/* Botão de Pontuação */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.scoringButton]}
          onPress={handleOpenScoring}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>⭐ Avaliar Alunos</Text>
        </TouchableOpacity>
      </View>

      {/* Botão de Conclusão */}
      <TouchableOpacity 
        style={[styles.completeButton, classCompleted && styles.completeButtonCompleted]}
        onPress={handleCompleteClass}
        disabled={classCompleted || loading}
      >
        <Text style={styles.completeButtonText}>
          {classCompleted ? 'Aula Concluída' : 'Concluir Aula'}
        </Text>
      </TouchableOpacity>

      {/* Modal de Confirmação de Conclusão */}
      {showCompletionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Concluir Aula</Text>
            <Text style={styles.modalMessage}>
              Tem certeza que deseja concluir esta aula? Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCompletionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmCompleteClass}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Concluindo...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal de Avaliação Completa */}
      <Modal
        visible={showScoringModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScoringModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scoringModalContent}>
            <Text style={styles.scoringModalTitle}>Avaliar Alunos e Presença</Text>
            
            {/* Lista de Alunos com Seleção e Presença */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alunos da Turma</Text>
              <ScrollView style={styles.studentList} nestedScrollEnabled>
                {students.map((student) => (
                  <View key={student.id} style={styles.studentRow}>
                    {/* Checkbox para seleção */}
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => toggleStudentSelection(student.id)}
                    >
                      <View style={[
                        styles.checkbox,
                        selectedStudents.includes(student.id) && styles.checkboxChecked
                      ]}>
                        {selectedStudents.includes(student.id) && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    
                    {/* Informações do aluno */}
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentEmail}>{student.email}</Text>
                    </View>
                    
                    {/* Toggle de presença */}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Esporte da Aula */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {isFreeClass() ? 'Esporte para Pontuação *' : 'Esporte da Aula'}
              </Text>
              {isFreeClass() ? (
                <View style={styles.sportSelectorContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    style={styles.sportSelectorScroll}
                    contentContainerStyle={styles.sportSelectorContent}
                  >
                    {sports.filter(sport => sport.name !== 'Aula Livre').map((sport) => (
                      <TouchableOpacity
                        key={sport.id}
                        style={[
                          styles.sportSelectorCard,
                          selectedSportForScoring?.id === sport.id && styles.sportSelectorCardSelected
                        ]}
                        onPress={() => setSelectedSportForScoring(sport)}
                      >
                        <Text style={styles.sportSelectorText} numberOfLines={1}>
                          {sport.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {!selectedSportForScoring && (
                    <Text style={styles.sportSelectorWarning}>
                      ⚠️ Selecione um esporte para continuar
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.sportDisplayContainer}>
                  <Text style={styles.sportDisplayText}>
                    🏆 {(() => {
                      const subjectParts = classData.subject?.split(' - ') || [];
                      return subjectParts[0] || 'Esporte não definido';
                    })()}
                  </Text>
                </View>
              )}
            </View>

            {/* Pontuação */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pontuação (0-100) *</Text>
              <TextInput
                style={styles.scoreInput}
                placeholder="Digite a pontuação"
                value={batchScore}
                onChangeText={setBatchScore}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Observações */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Observações</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Observações sobre o desempenho (opcional)"
                value={batchNotes}
                onChangeText={setBatchNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Resumo */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                📊 {selectedStudents.length} aluno(s) selecionado(s) para avaliação
              </Text>
              <Text style={styles.summaryText}>
                🏆 Esporte: {isFreeClass() 
                  ? (selectedSportForScoring?.name || 'Não selecionado')
                  : (() => {
                      const subjectParts = classData.subject?.split(' - ') || [];
                      return subjectParts[0] || 'Não definido';
                    })()
                }
              </Text>
              <Text style={styles.summaryText}>
                📝 Presença será salva para todos os alunos
              </Text>
            </View>

            {/* Botões */}
            <View style={styles.scoringModalButtons}>
              <TouchableOpacity
                style={[styles.scoringModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowScoringModal(false);
                  setSelectedStudents([]);
                  setBatchScore('');
                  setBatchNotes('');
                  setSelectedSportForScoring(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scoringModalButton, styles.saveButton]}
                onPress={handleBatchSaveScores}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvando...' : 'Salvar Tudo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <SideMenu 
        isVisible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)} 
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        userType="TEACHER"
      />
      
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EDED',
  },
  sportBackgroundContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width > 768 ? '50%' : '60%', // Responsivo para desktop/tablet
    height: '35%',
    zIndex: 0,
    opacity: 0.06,
  },
  sportBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  menuLines: {
    flexDirection: 'column',
    gap: 3,
  },
  menuLine: {
    width: 39,
    height: 6,
    backgroundColor: '#D9D9D9',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#000',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#000',
    marginBottom: 20,
  },
  classTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  classTitleIcon: {
    width: width > 768 ? 48 : 40, // Responsivo
    height: width > 768 ? 48 : 40,
    marginRight: 12,
  },
  classTitle: {
    fontSize: width > 768 ? 36 : 32, // Responsivo
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  classInfo: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    lineHeight: 24,
  },
  xpNumber: {
    color: '#2FD4CD',
    fontWeight: 'bold',
  },
  attendanceButton: {
    backgroundColor: '#B5B5B5',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  attendanceButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
  attendanceButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  workoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    padding: 20,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  expandedCard: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  cardDuration: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  expandIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    minWidth: 40,
    minHeight: 40,
  },
  expandIconText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F9BB55',
    textAlign: 'center',
    lineHeight: 32,
  },
  exercisesList: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    overflow: 'hidden',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  exerciseReps: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  completeButton: {
    backgroundColor: '#B5B5B5',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#F9BB55',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  // Estilos dos botões de ação
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  attendanceButton: {
    backgroundColor: '#2196F3',
  },
  attendanceButtonCompleted: {
    backgroundColor: '#4CAF50', // Verde para indicar que foi realizada
  },
  scoringButton: {
    backgroundColor: '#F9BB55',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  scoringModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 5,
    maxHeight: '95%',
    width: '98%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scoringModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  studentList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  studentItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedStudentItem: {
    backgroundColor: '#F9BB55',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  studentEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sportList: {
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  sportItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedSportItem: {
    backgroundColor: '#F9BB55',
  },
  sportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  scoringModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  scoringModalButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Novos estilos para avaliação em lote
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  checkboxContainer: {
    marginRight: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#F9BB55',
    borderColor: '#F9BB55',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  studentInfo: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    marginHorizontal: 0,
  },
  summaryText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Poppins',
    lineHeight: 14,
  },
  sportSelectorContainer: {
    marginTop: 10,
  },
  sportSelectorScroll: {
    maxHeight: 80,
  },
  sportSelectorContent: {
    paddingHorizontal: 4,
  },
  sportSelectorCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 60,
    maxWidth: 80,
    alignItems: 'center',
  },
  sportSelectorCardSelected: {
    backgroundColor: '#F9BB55',
    borderColor: '#F9BB55',
  },
  sportSelectorText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  sportSelectorWarning: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 5,
    fontFamily: 'Poppins',
  },
  sportDisplayContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  sportDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
  },
  attendanceStatusContainer: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  attendanceStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
});

export default ClassScreen;
