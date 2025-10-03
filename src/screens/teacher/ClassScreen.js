import React, { useState, useEffect } from 'react';
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
  const [students, setStudents] = useState([]);
  const [sports, setSports] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [scoresData, setScoresData] = useState({}); // { studentId: { sportId: { score, notes } } }
  
  // Estados para avaliação em lote
  const [selectedStudents, setSelectedStudents] = useState([]); // Array de IDs dos alunos selecionados
  const [batchScore, setBatchScore] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();

  // Carregar dados iniciais
  useEffect(() => {
    console.log('🔵 ClassScreen - classData recebido:', classData);
    console.log('🔵 ClassScreen - subject:', classData.subject);
    loadStudents();
    loadSports();
    checkAttendanceStatus(); // Verificar se chamada já foi realizada
  }, []);

  // Verificar se a chamada já foi realizada
  const checkAttendanceStatus = async () => {
    if (!classData?.id) return;
    
    try {
      console.log('🔵 ClassScreen - Verificando status da chamada para aula:', classData.id);
      const response = await apiService.getClassAttendance(classData.id, classData.date);
      
      if (response.success && response.data.attendances && response.data.attendances.length > 0) {
        console.log('🔵 ClassScreen - Chamada já foi realizada, atualizando estado');
        setAttendanceTaken(true);
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

      // Buscar o esporte da aula automaticamente
      // O esporte está no campo 'subject' no formato "Nome do Esporte - Tipo da Aula"
      const subjectParts = classData.subject?.split(' - ') || [];
      const sportName = subjectParts[0]; // Primeira parte é o nome do esporte
      
      const classSport = sports.find(sport => 
        sport.name.toLowerCase() === sportName?.toLowerCase()
      );

      if (!classSport) {
        showError('❌ Erro', `Esporte "${sportName}" da aula não encontrado`);
        return;
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

  const renderWorkoutCard = (section) => (
    <TouchableOpacity
      key={section.id}
      style={[
        styles.workoutCard,
        expandedCard === section.id && styles.expandedCard
      ]}
      onPress={() => setExpandedCard(expandedCard === section.id ? null : section.id)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.cardDuration}>{section.duration}</Text>
        </View>
        <View style={styles.expandIcon}>
          <Text style={styles.expandIconText}>
            {expandedCard === section.id ? '−' : '+'}
          </Text>
        </View>
      </View>
      
      {expandedCard === section.id && (
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

  return (
    <ScrollView style={styles.container}>
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
          Vamos começar a aula da {classData?.class || '5ª série'}?
        </Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.classTitle}>{classData?.sport || 'Treino de Vôlei'}</Text>
        <Text style={styles.classInfo}>
          Duração: {classData?.duration || '60min'} Esse treino vale {classData?.xp || '60'}xp para seus alunos
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
              <Text style={styles.inputLabel}>Esporte da Aula</Text>
              <View style={styles.sportDisplayContainer}>
                <Text style={styles.sportDisplayText}>
                  🏆 {(() => {
                    const subjectParts = classData.subject?.split(' - ') || [];
                    return subjectParts[0] || 'Esporte não definido';
                  })()}
                </Text>
              </View>
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
                🏆 Esporte: {(() => {
                  const subjectParts = classData.subject?.split(' - ') || [];
                  return subjectParts[0] || 'Não definido';
                })()}
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
  header: {
    padding: 20,
    paddingTop: 40,
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
  classTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  classInfo: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expandedCard: {
    shadowOpacity: 0.2,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F9BB55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  exercisesList: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
    padding: 20,
    marginHorizontal: 10,
    maxHeight: '90%',
    width: '95%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
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
    gap: 10,
    marginTop: 8,
  },
  scoringModalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
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
    padding: 10,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
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
