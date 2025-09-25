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
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();

  // Carregar dados iniciais
  useEffect(() => {
    loadStudents();
    loadSports();
  }, []);

  const loadStudents = async () => {
    try {
      if (classData.id) {
        const response = await apiService.getClassScores(classData.id);
        if (response.success) {
          // Extrair alunos únicos das pontuações
          const uniqueStudents = response.data.reduce((acc, score) => {
            if (!acc.find(s => s.id === score.student.id)) {
              acc.push(score.student);
            }
            return acc;
          }, []);
          setStudents(uniqueStudents);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const loadSports = async () => {
    try {
      const response = await apiService.getSports();
      if (response.success) {
        setSports(response.data);
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
      // Aqui seria implementada a lógica de chamada
      // Por enquanto, apenas simula o processo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      
      const response = await apiService.saveClassScore(
        classData.id,
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

      {/* Botão de Chamada */}
      <TouchableOpacity 
        style={[styles.attendanceButton, attendanceTaken && styles.attendanceButtonCompleted]}
        onPress={handleTakeAttendance}
        disabled={attendanceTaken || loading}
      >
        <Text style={styles.attendanceButtonText}>
          {attendanceTaken ? 'Chamada Realizada' : 'Fazer a Chamada'}
        </Text>
      </TouchableOpacity>

      {/* Seções de Exercícios */}
      <View style={styles.workoutContainer}>
        {workoutSections.map(renderWorkoutCard)}
      </View>

      {/* Botão de Pontuação */}
      <TouchableOpacity 
        style={styles.scoringButton}
        onPress={handleOpenScoring}
        disabled={loading}
      >
        <Text style={styles.scoringButtonText}>Avaliar Alunos</Text>
      </TouchableOpacity>

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

      {/* Modal de Pontuação */}
      <Modal
        visible={showScoringModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScoringModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scoringModalContent}>
            <Text style={styles.scoringModalTitle}>Avaliar Aluno</Text>
            
            {/* Seleção de Aluno */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Aluno *</Text>
              <ScrollView style={styles.studentList} nestedScrollEnabled>
                {students.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.studentItem,
                      selectedStudent?.id === student.id && styles.selectedStudentItem
                    ]}
                    onPress={() => setSelectedStudent(student)}
                  >
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Seleção de Esporte */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Esporte *</Text>
              <ScrollView style={styles.sportList} nestedScrollEnabled>
                {sports.map((sport) => (
                  <TouchableOpacity
                    key={sport.id}
                    style={[
                      styles.sportItem,
                      selectedSport?.id === sport.id && styles.selectedSportItem
                    ]}
                    onPress={() => setSelectedSport(sport)}
                  >
                    <Text style={styles.sportName}>{sport.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Pontuação */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pontuação (0-100) *</Text>
              <TextInput
                style={styles.scoreInput}
                placeholder="Digite a pontuação"
                value={score}
                onChangeText={setScore}
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
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Botões */}
            <View style={styles.scoringModalButtons}>
              <TouchableOpacity
                style={[styles.scoringModalButton, styles.cancelButton]}
                onPress={() => setShowScoringModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scoringModalButton, styles.saveButton]}
                onPress={handleSaveScore}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvando...' : 'Salvar'}
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
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  // Estilos do modal de pontuação
  scoringButton: {
    backgroundColor: '#F9BB55',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  scoringButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scoringModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    maxHeight: '80%',
    width: '90%',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  studentList: {
    maxHeight: 120,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sportList: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  sportItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedSportItem: {
    backgroundColor: '#F9BB55',
  },
  sportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  scoringModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 10,
  },
  scoringModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ClassScreen;
