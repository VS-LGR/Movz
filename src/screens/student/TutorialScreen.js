import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import SideMenu from '../../components/SideMenu';
import HamburgerButton from '../../components/HamburgerButton';

const { width, height } = Dimensions.get('window');

const TutorialScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [currentStep, setCurrentStep] = useState('sport-selection'); // 'sport-selection', 'workout', 'completed'
  const [selectedSport, setSelectedSport] = useState(null);
  const [workoutProgress, setWorkoutProgress] = useState(0);
  const [currentWorkoutStep, setCurrentWorkoutStep] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Dados de treino específicos para cada esporte
  const workoutData = {
    'Futebol': {
      name: 'Futebol',
      color: '#4CAF50',
      icon: require('../../assets/images/futebol_sports.svg'),
      sections: [
        {
          id: 'aquecimento',
          title: 'Aquecimento',
          duration: '10min',
          exercises: [
            { name: 'Corrida leve no lugar', repetitions: '2 minutos' },
            { name: 'Polichinelo', repetitions: '30 segundos' },
            { name: 'Alongamento de pernas', repetitions: '1 minuto' },
            { name: 'Movimentos circulares com os pés', repetitions: '30 segundos cada pé' },
            { name: 'Corrida com elevação de joelhos', repetitions: '1 minuto' },
            { name: 'Alongamento de quadril', repetitions: '1 minuto' },
          ],
        },
        {
          id: 'treino',
          title: 'Treino Principal',
          duration: '25min',
          exercises: [
            { name: 'Toques de bola alternando os pés', repetitions: '3 minutos' },
            { name: 'Dribles em zigue-zague', repetitions: '5 minutos' },
            { name: 'Chutes ao gol', repetitions: '5 minutos' },
            { name: 'Passe de curta distância', repetitions: '5 minutos' },
            { name: 'Jogo de 1x1', repetitions: '7 minutos' },
          ],
        },
        {
          id: 'desaquecimento',
          title: 'Desaquecimento',
          duration: '10min',
          exercises: [
            { name: 'Caminhada leve', repetitions: '3 minutos' },
            { name: 'Alongamento de panturrilha', repetitions: '1 minuto cada perna' },
            { name: 'Alongamento de coxa', repetitions: '1 minuto cada perna' },
            { name: 'Alongamento de quadril', repetitions: '1 minuto cada lado' },
            { name: 'Respiração profunda', repetitions: '2 minutos' },
          ],
        },
      ],
    },
    'Basquete': {
      name: 'Basquete',
      color: '#FF9800',
      icon: require('../../assets/images/Basquete_sports.svg'),
      sections: [
        {
          id: 'aquecimento',
          title: 'Aquecimento',
          duration: '8min',
          exercises: [
            { name: 'Corrida leve', repetitions: '2 minutos' },
            { name: 'Polichinelo', repetitions: '1 minuto' },
            { name: 'Alongamento de braços', repetitions: '1 minuto' },
            { name: 'Movimentos circulares com os braços', repetitions: '1 minuto' },
            { name: 'Agachamentos leves', repetitions: '1 minuto' },
            { name: 'Alongamento de pernas', repetitions: '2 minutos' },
          ],
        },
        {
          id: 'treino',
          title: 'Treino Principal',
          duration: '30min',
          exercises: [
            { name: 'Dribles estacionários', repetitions: '5 minutos' },
            { name: 'Arremessos livres', repetitions: '5 minutos' },
            { name: 'Lances de 3 pontos', repetitions: '5 minutos' },
            { name: 'Dribles em movimento', repetitions: '5 minutos' },
            { name: 'Jogo de 1x1', repetitions: '10 minutos' },
          ],
        },
        {
          id: 'desaquecimento',
          title: 'Desaquecimento',
          duration: '7min',
          exercises: [
            { name: 'Caminhada leve', repetitions: '2 minutos' },
            { name: 'Alongamento de braços', repetitions: '1 minuto cada' },
            { name: 'Alongamento de pernas', repetitions: '1 minuto cada' },
            { name: 'Alongamento de costas', repetitions: '1 minuto' },
            { name: 'Respiração profunda', repetitions: '2 minutos' },
          ],
        },
      ],
    },
    'Vôlei': {
      name: 'Vôlei',
      color: '#2196F3',
      icon: require('../../assets/images/Voley_sports.svg'),
      sections: [
        {
          id: 'aquecimento',
          title: 'Aquecimento',
          duration: '10min',
          exercises: [
            { name: 'Corrida leve', repetitions: '2 minutos' },
            { name: 'Polichinelo', repetitions: '1 minuto' },
            { name: 'Alongamento de braços e ombros', repetitions: '2 minutos' },
            { name: 'Movimentos circulares com os braços', repetitions: '1 minuto' },
            { name: 'Agachamentos leves', repetitions: '1 minuto' },
            { name: 'Alongamento de pernas', repetitions: '3 minutos' },
          ],
        },
        {
          id: 'treino',
          title: 'Treino Principal',
          duration: '25min',
          exercises: [
            { name: 'Toque de bola individual', repetitions: '5 minutos' },
            { name: 'Toque de bola em dupla', repetitions: '5 minutos' },
            { name: 'Saque', repetitions: '5 minutos' },
            { name: 'Recepção e levantamento', repetitions: '5 minutos' },
            { name: 'Jogo de 2x2', repetitions: '5 minutos' },
          ],
        },
        {
          id: 'desaquecimento',
          title: 'Desaquecimento',
          duration: '10min',
          exercises: [
            { name: 'Caminhada leve', repetitions: '2 minutos' },
            { name: 'Alongamento de braços', repetitions: '2 minutos' },
            { name: 'Alongamento de pernas', repetitions: '2 minutos' },
            { name: 'Alongamento de costas', repetitions: '2 minutos' },
            { name: 'Respiração profunda', repetitions: '2 minutos' },
          ],
        },
      ],
    },
    'Tênis de Mesa (Ping Pong)': {
      name: 'Tênis de Mesa (Ping Pong)',
      color: '#9C27B0',
      icon: require('../../assets/images/pingPong_sports.svg'),
      sections: [
        {
          id: 'aquecimento',
          title: 'Aquecimento',
          duration: '8min',
          exercises: [
            { name: 'Corrida leve', repetitions: '2 minutos' },
            { name: 'Polichinelo', repetitions: '1 minuto' },
            { name: 'Alongamento de braços', repetitions: '1 minuto' },
            { name: 'Movimentos circulares com os braços', repetitions: '1 minuto' },
            { name: 'Agachamentos leves', repetitions: '1 minuto' },
            { name: 'Alongamento de pernas', repetitions: '2 minutos' },
          ],
        },
        {
          id: 'treino',
          title: 'Treino Principal',
          duration: '30min',
          exercises: [
            { name: 'Rebatidas contra a parede', repetitions: '5 minutos' },
            { name: 'Saque com efeito', repetitions: '5 minutos' },
            { name: 'Direita e esquerda', repetitions: '5 minutos' },
            { name: 'Voleio de mesa', repetitions: '5 minutos' },
            { name: 'Jogo de 1x1', repetitions: '10 minutos' },
          ],
        },
        {
          id: 'desaquecimento',
          title: 'Desaquecimento',
          duration: '7min',
          exercises: [
            { name: 'Caminhada leve', repetitions: '2 minutos' },
            { name: 'Alongamento de braços', repetitions: '1 minuto cada' },
            { name: 'Alongamento de pernas', repetitions: '1 minuto cada' },
            { name: 'Alongamento de costas', repetitions: '1 minuto' },
            { name: 'Respiração profunda', repetitions: '2 minutos' },
          ],
        },
      ],
    },
    'Natação': {
      name: 'Natação',
      color: '#00BCD4',
      icon: require('../../assets/images/Swimming_sports.svg'),
      sections: [
        {
          id: 'aquecimento',
          title: 'Aquecimento',
          duration: '10min',
          exercises: [
            { name: 'Nado livre leve', repetitions: '3 minutos' },
            { name: 'Alongamento na borda', repetitions: '2 minutos' },
            { name: 'Movimentos de braços fora d\'água', repetitions: '2 minutos' },
            { name: 'Nado costas leve', repetitions: '3 minutos' },
          ],
        },
        {
          id: 'treino',
          title: 'Treino Principal',
          duration: '25min',
          exercises: [
            { name: 'Nado livre', repetitions: '5 minutos' },
            { name: 'Nado costas', repetitions: '5 minutos' },
            { name: 'Nado peito', repetitions: '5 minutos' },
            { name: 'Nado borboleta', repetitions: '5 minutos' },
            { name: 'Nado livre intenso', repetitions: '5 minutos' },
          ],
        },
        {
          id: 'desaquecimento',
          title: 'Desaquecimento',
          duration: '10min',
          exercises: [
            { name: 'Nado livre leve', repetitions: '3 minutos' },
            { name: 'Alongamento na borda', repetitions: '2 minutos' },
            { name: 'Respiração profunda', repetitions: '2 minutos' },
            { name: 'Relaxamento na água', repetitions: '3 minutos' },
          ],
        },
      ],
    },
    'Handebol': {
      name: 'Handebol',
      color: '#E91E63',
      icon: require('../../assets/images/Handball_sports.svg'),
      sections: [
        {
          id: 'aquecimento',
          title: 'Aquecimento',
          duration: '10min',
          exercises: [
            { name: 'Corrida leve', repetitions: '2 minutos' },
            { name: 'Polichinelo', repetitions: '1 minuto' },
            { name: 'Alongamento de braços e ombros', repetitions: '2 minutos' },
            { name: 'Movimentos circulares com os braços', repetitions: '1 minuto' },
            { name: 'Agachamentos leves', repetitions: '1 minuto' },
            { name: 'Alongamento de pernas', repetitions: '3 minutos' },
          ],
        },
        {
          id: 'treino',
          title: 'Treino Principal',
          duration: '25min',
          exercises: [
            { name: 'Passe de peito', repetitions: '5 minutos' },
            { name: 'Arremesso de 7 metros', repetitions: '5 minutos' },
            { name: 'Dribles', repetitions: '5 minutos' },
            { name: 'Jogo de 3x3', repetitions: '10 minutos' },
          ],
        },
        {
          id: 'desaquecimento',
          title: 'Desaquecimento',
          duration: '10min',
          exercises: [
            { name: 'Caminhada leve', repetitions: '2 minutos' },
            { name: 'Alongamento de braços', repetitions: '2 minutos' },
            { name: 'Alongamento de pernas', repetitions: '2 minutos' },
            { name: 'Alongamento de costas', repetitions: '2 minutos' },
            { name: 'Respiração profunda', repetitions: '2 minutos' },
          ],
        },
      ],
    },
    'Queimada': {
      name: 'Queimada',
      color: '#FF5722',
      icon: require('../../assets/images/queimada_sports.svg'),
      sections: [
        {
          id: 'aquecimento',
          title: 'Aquecimento',
          duration: '8min',
          exercises: [
            { name: 'Corrida leve', repetitions: '2 minutos' },
            { name: 'Polichinelo', repetitions: '1 minuto' },
            { name: 'Alongamento de braços', repetitions: '1 minuto' },
            { name: 'Agachamentos leves', repetitions: '1 minuto' },
            { name: 'Alongamento de pernas', repetitions: '3 minutos' },
          ],
        },
        {
          id: 'treino',
          title: 'Treino Principal',
          duration: '20min',
          exercises: [
            { name: 'Arremessos de precisão', repetitions: '5 minutos' },
            { name: 'Movimentação lateral', repetitions: '5 minutos' },
            { name: 'Jogo de queimada', repetitions: '10 minutos' },
          ],
        },
        {
          id: 'desaquecimento',
          title: 'Desaquecimento',
          duration: '7min',
          exercises: [
            { name: 'Caminhada leve', repetitions: '2 minutos' },
            { name: 'Alongamento de braços', repetitions: '1 minuto cada' },
            { name: 'Alongamento de pernas', repetitions: '1 minuto cada' },
            { name: 'Respiração profunda', repetitions: '2 minutos' },
          ],
        },
      ],
    },
    'Exercícios Gerais': {
      name: 'Exercícios Gerais',
      color: '#795548',
      icon: require('../../assets/images/Exercise_sports.svg'),
      sections: [
        {
          id: 'aquecimento',
          title: 'Aquecimento',
          duration: '10min',
          exercises: [
            { name: 'Corrida leve no lugar', repetitions: '2 minutos' },
            { name: 'Polichinelo', repetitions: '1 minuto' },
            { name: 'Alongamento geral', repetitions: '3 minutos' },
            { name: 'Movimentos articulares', repetitions: '2 minutos' },
            { name: 'Agachamentos leves', repetitions: '1 minuto' },
            { name: 'Alongamento de pernas', repetitions: '1 minuto' },
          ],
        },
        {
          id: 'treino',
          title: 'Treino Principal',
          duration: '30min',
          exercises: [
            { name: 'Flexões de braço', repetitions: '3 séries de 10' },
            { name: 'Agachamentos', repetitions: '3 séries de 15' },
            { name: 'Abdominais', repetitions: '3 séries de 20' },
            { name: 'Prancha', repetitions: '3 séries de 30 segundos' },
            { name: 'Burpees', repetitions: '3 séries de 5' },
            { name: 'Polichinelo', repetitions: '3 séries de 30 segundos' },
          ],
        },
        {
          id: 'desaquecimento',
          title: 'Desaquecimento',
          duration: '10min',
          exercises: [
            { name: 'Caminhada leve', repetitions: '3 minutos' },
            { name: 'Alongamento de braços', repetitions: '1 minuto cada' },
            { name: 'Alongamento de pernas', repetitions: '1 minuto cada' },
            { name: 'Alongamento de costas', repetitions: '1 minuto' },
            { name: 'Respiração profunda', repetitions: '3 minutos' },
          ],
        },
      ],
    },
  };


  const handleSportSelection = (sport) => {
    setSelectedSport(sport);
    setCurrentStep('workout');
    setWorkoutProgress(0);
    setCurrentWorkoutStep(0);
  };

  const handleWorkoutComplete = async () => {
    try {
      console.log('🔵 handleWorkoutComplete - Função chamada!');
      console.log('🔵 selectedSport:', selectedSport?.name);
      
      // Mostrar modal de finalização
      setShowCompletionModal(true);
      
    } catch (error) {
      console.error('🔵 Erro em handleWorkoutComplete:', error);
      Alert.alert('Erro', 'Erro ao salvar progresso do treino');
    }
  };

  const handleCloseCompletionModal = () => {
    console.log('🔵 Fechando modal de finalização - resetando estado');
    setShowCompletionModal(false);
    setCurrentStep('sport-selection');
    setSelectedSport(null);
    setWorkoutProgress(0);
    setCurrentWorkoutStep(0);
  };

  const handleWorkoutStepComplete = () => {
    console.log('🔵 handleWorkoutStepComplete - Função chamada!');
    console.log('🔵 currentWorkoutStep:', currentWorkoutStep);
    console.log('🔵 selectedSport:', selectedSport?.name);
    
    if (!selectedSport) {
      console.log('🔵 Erro: selectedSport é null');
      return;
    }
    
    const sportData = workoutData[selectedSport.name];
    if (!sportData) {
      console.log('🔵 Erro: sportData não encontrado');
      return;
    }
    
    const totalSteps = sportData.sections.length;
    const newStep = currentWorkoutStep + 1;
    
    console.log('🔵 totalSteps:', totalSteps);
    console.log('🔵 newStep:', newStep);
    console.log('🔵 newStep >= totalSteps:', newStep >= totalSteps);
    
    if (newStep >= totalSteps) {
      console.log('🔵 Chamando handleWorkoutComplete...');
      handleWorkoutComplete();
    } else {
      console.log('🔵 Indo para próxima etapa...');
      setCurrentWorkoutStep(newStep);
      setWorkoutProgress((newStep / totalSteps) * 100);
    }
  };

  const renderSportSelection = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Escolha um Esporte</Text>
        <Text style={styles.subtitle}>Selecione o esporte para começar seu treino</Text>
        <HamburgerButton
          onPress={() => setIsMenuVisible(true)}
          style={styles.menuButton}
        />
      </View>

      <ScrollView style={styles.sportsContainer} showsVerticalScrollIndicator={false}>
        {Object.keys(workoutData).length > 0 ? (
          Object.entries(workoutData).map(([sportKey, sportData]) => {
            return (
              <TouchableOpacity
                key={sportKey}
                style={[styles.sportCard, { borderLeftColor: sportData.color }]}
                onPress={() => handleSportSelection(sportData)}
              >
                <View style={styles.sportIconContainer}>
                  <Image 
                    source={sportData.icon} 
                    style={styles.sportIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.sportInfo}>
                  <Text style={styles.sportName}>{sportData.name}</Text>
                  <Text style={styles.sportDescription}>
                    Treino completo com aquecimento, prática e desaquecimento
                  </Text>
                </View>
                <View style={styles.sportArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum esporte disponível</Text>
          </View>
        )}
      </ScrollView>

      <SideMenu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        userType="STUDENT"
      />
    </SafeAreaView>
  );

  const renderWorkout = () => {
    if (!selectedSport) return null;
    
    const sportData = workoutData[selectedSport.name];
    if (!sportData) return null;
    
    const currentSection = sportData.sections[currentWorkoutStep];
    if (!currentSection) return null;
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep('sport-selection')}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{sportData.name}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${workoutProgress}%`, backgroundColor: sportData.color }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentWorkoutStep + 1} de {sportData.sections.length} etapas
          </Text>
        </View>

        {/* Current Section */}
        <ScrollView style={styles.workoutContainer} showsVerticalScrollIndicator={false}>
          <View style={[styles.sectionCard, { borderLeftColor: sportData.color }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{currentSection.title}</Text>
              <Text style={styles.sectionDuration}>{currentSection.duration}</Text>
            </View>
            
            <View style={styles.exercisesContainer}>
              {currentSection.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseRepetitions}>{exercise.repetitions}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: sportData.color }]}
            onPress={handleWorkoutStepComplete}
          >
            <Text style={styles.actionButtonText}>
              {currentWorkoutStep + 1 >= sportData.sections.length ? 'Finalizar Treino' : 'Próxima Etapa'}
            </Text>
          </TouchableOpacity>
        </View>

        <SideMenu
          isVisible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
          onNavigate={onNavigate}
          currentUser={currentUser}
          onLogout={onLogout}
          userType="STUDENT"
        />
      </SafeAreaView>
    );
  };

  if (currentStep === 'sport-selection') {
    return (
      <>
        {renderSportSelection()}
        {/* Modal de Finalização */}
        {showCompletionModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Parabéns! 🎉</Text>
              <Text style={styles.modalMessage}>
                Você completou o treino de {selectedSport?.name || 'esporte'}!
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCloseCompletionModal}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </>
    );
  } else if (currentStep === 'workout') {
    return (
      <>
        {renderWorkout()}
        {/* Modal de Finalização */}
        {showCompletionModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Parabéns! 🎉</Text>
              <Text style={styles.modalMessage}>
                Você completou o treino de {selectedSport?.name || 'esporte'}!
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCloseCompletionModal}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDEE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginTop: 5,
  },
  menuButton: {
    marginLeft: 15,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F9BB55',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  placeholder: {
    width: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 10,
  },
  sportsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sportCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sportIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  sportIcon: {
    width: 30,
    height: 30,
  },
  sportInfo: {
    flex: 1,
  },
  sportName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  sportDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  sportArrow: {
    marginLeft: 10,
  },
  arrowText: {
    fontSize: 20,
    color: '#F9BB55',
    fontWeight: 'bold',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginTop: 8,
  },
  workoutContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  sectionDuration: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  exercisesContainer: {
    gap: 15,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  exerciseNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F9BB55',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  exerciseRepetitions: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  // Modal de Finalização
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
    margin: 20,
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    elevation: 10,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9BB55',
    fontFamily: 'Poppins',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#F9BB55',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
});

export default TutorialScreen;