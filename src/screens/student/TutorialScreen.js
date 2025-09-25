import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import SideMenu from '../../components/SideMenu';
import HamburgerButton from '../../components/HamburgerButton';

const { width, height } = Dimensions.get('window');

const TutorialScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [expandedCard, setExpandedCard] = useState('aquecimento');

  const workoutSections = [
    {
      id: 'aquecimento',
      title: 'Aquecimento',
      duration: '7min',
      exercises: [
        { name: 'Nome Exercício', repetitions: '20 repetições' },
        { name: 'Nome Exercício', repetitions: '20 repetições' },
        { name: 'Nome Exercício', repetitions: '20 repetições' },
        { name: 'Nome Exercício', repetitions: '20 repetições' },
        { name: 'Nome Exercício', repetitions: '20 repetições' },
        { name: 'Nome Exercício', repetitions: '20 repetições' },
      ],
    },
    {
      id: 'treino',
      title: 'Treino',
      duration: '30min',
      exercises: [
        { name: 'Exercício Principal 1', repetitions: '15 repetições' },
        { name: 'Exercício Principal 2', repetitions: '12 repetições' },
        { name: 'Exercício Principal 3', repetitions: '10 repetições' },
      ],
    },
    {
      id: 'desaquecimento',
      title: 'Desaquecimento',
      duration: '8min',
      exercises: [
        { name: 'Alongamento 1', repetitions: '30 segundos' },
        { name: 'Alongamento 2', repetitions: '30 segundos' },
        { name: 'Relaxamento', repetitions: '2 minutos' },
      ],
    },
  ];

  const toggleCard = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const renderChevron = (isExpanded) => (
    <View style={styles.chevronContainer}>
      <View style={[styles.chevronLine, { transform: [{ rotate: isExpanded ? '45deg' : '-45deg' }] }]} />
      <View style={[styles.chevronLine, { transform: [{ rotate: isExpanded ? '-45deg' : '45deg' }] }]} />
    </View>
  );

  const renderExerciseCard = (exercise, index) => (
    <View key={index} style={styles.exerciseCard}>
      <Text style={styles.exerciseRepetitions}>{exercise.repetitions}</Text>
      <Text style={styles.exerciseName}>{exercise.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Movz</Text>
          <HamburgerButton
            onPress={() => setIsMenuVisible(true)}
            style={styles.menuButton}
          />
        </View>

        {/* Tutorial Title */}
        <Text style={styles.tutorialTitle}>Aula com Tutorial</Text>
        <Text style={styles.tutorialDescription}>
          Continue estudando fora das aulas, com nossos tutoriais guiados.
        </Text>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Workout Title */}
        <Text style={styles.workoutTitle}>Treino de Vôlei</Text>
        <Text style={styles.workoutInfo}>
          Duração: 45min Esse treino vale 30xp
        </Text>

        {/* Workout Sections */}
        {workoutSections.map((section) => (
          <View key={section.id} style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleCard(section.id)}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {renderChevron(expandedCard === section.id)}
            </TouchableOpacity>

            {expandedCard === section.id && (
              <View style={styles.sectionContent}>
                <Text style={styles.sectionDuration}>Duração: {section.duration}</Text>
                <View style={styles.exercisesGrid}>
                  {section.exercises.map((exercise, index) => 
                    renderExerciseCard(exercise, index)
                  )}
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Começar</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Side Menu */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDEE',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  menuButton: {
    marginLeft: 15,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  tutorialDescription: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  divider: {
    height: 1,
    backgroundColor: '#000',
    marginBottom: 20,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  workoutInfo: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins',
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 7.4,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Poppins',
  },
  chevronContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronLine: {
    position: 'absolute',
    width: 18,
    height: 3,
    backgroundColor: '#000',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 7.4,
    elevation: 8,
  },
  sectionDuration: {
    fontSize: 16,
    color: '#000',
    marginBottom: 15,
    fontFamily: 'Poppins',
  },
  exercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  exerciseCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F9BB55',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseRepetitions: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Poppins',
  },
  exerciseName: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  startButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 50,
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 7.4,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
});

export default TutorialScreen;
