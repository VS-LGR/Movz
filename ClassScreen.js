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
} from 'react-native';
import apiService from './apiService';

const { width } = Dimensions.get('window');

const ClassScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  // Usar parâmetros passados via navegação
  const classData = window.navigationParams?.classData || {};

  const [attendanceTaken, setAttendanceTaken] = useState(false);
  const [classCompleted, setClassCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState('aquecimento');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

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
      Alert.alert('Sucesso', 'Chamada realizada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao realizar a chamada');
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
      
      // Chamar API para marcar aula como concluída
      const response = await apiService.completeClass(classData.id, true);
      
      if (response.success) {
        setClassCompleted(true);
        setShowCompletionModal(false);
        
        // Marcar que a aula foi concluída nos parâmetros de navegação
        if (window.navigationParams) {
          window.navigationParams.classCompleted = true;
        }
        
        Alert.alert('Sucesso', 'Aula concluída com sucesso!');
        
        // Navegar de volta para a lista de aulas
        onNavigate('classes');
      } else {
        throw new Error(response.message || 'Erro ao concluir a aula');
      }
    } catch (error) {
      console.error('Erro ao concluir aula:', error);
      Alert.alert('Erro', error.message || 'Erro ao concluir a aula');
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
          <View style={styles.menuLines}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
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
});

export default ClassScreen;
