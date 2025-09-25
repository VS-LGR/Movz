import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import SideMenu from '../../components/SideMenu';

const { width, height } = Dimensions.get('window');

const MedalsScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser }) => {
  const [userMedals, setUserMedals] = useState([]);
  const [allMedals, setAllMedals] = useState([]);

  // Dados das medalhas disponíveis
  const availableMedals = [
    {
      id: 1,
      name: 'Primeiro Passo',
      description: 'Complete seu primeiro treino',
      icon: require('../../assets/images/Medalha_1.svg'),
      requirement: '1 treino completado',
      category: 'Iniciante',
      rarity: 'Comum',
      color: '#FFD700'
    },
    {
      id: 2,
      name: 'Maratonista',
      description: 'Complete 10 treinos',
      icon: require('../../assets/images/Medalha_2.svg'),
      requirement: '10 treinos completados',
      category: 'Resistência',
      rarity: 'Rara',
      color: '#C0C0C0'
    },
    {
      id: 3,
      name: 'Campeão',
      description: 'Complete 50 treinos',
      icon: require('../../assets/images/Medalha_3.svg'),
      requirement: '50 treinos completados',
      category: 'Elite',
      rarity: 'Épica',
      color: '#FF6B6B'
    },
    {
      id: 4,
      name: 'Lenda',
      description: 'Complete 100 treinos',
      icon: require('../../assets/images/Medalha_4.svg'),
      requirement: '100 treinos completados',
      category: 'Lenda',
      rarity: 'Lendária',
      color: '#9B59B6'
    },
    {
      id: 5,
      name: 'Velocista',
      description: 'Complete 5 treinos em um dia',
      icon: require('../../assets/images/Medalha_5.svg'),
      requirement: '5 treinos em 1 dia',
      category: 'Velocidade',
      rarity: 'Rara',
      color: '#3498DB'
    },
    {
      id: 6,
      name: 'Consistente',
      description: 'Treine por 7 dias seguidos',
      icon: require('../../assets/images/Medalha_6.svg'),
      requirement: '7 dias consecutivos',
      category: 'Consistência',
      rarity: 'Épica',
      color: '#2ECC71'
    }
  ];

  // Simular medalhas obtidas pelo usuário (em produção, viria da API)
  useEffect(() => {
    // Simular algumas medalhas já obtidas
    const obtainedMedals = [1, 2, 5]; // IDs das medalhas obtidas
    setUserMedals(obtainedMedals);
    setAllMedals(availableMedals);
  }, []);

  const isMedalObtained = (medalId) => {
    return userMedals.includes(medalId);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Comum': return '#95A5A6';
      case 'Rara': return '#3498DB';
      case 'Épica': return '#9B59B6';
      case 'Lendária': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  const renderMedalCard = (medal) => {
    const obtained = isMedalObtained(medal.id);
    
    return (
      <View key={medal.id} style={[styles.medalCard, obtained && styles.medalCardObtained]}>
        <View style={styles.medalIconContainer}>
          <Image 
            source={medal.icon} 
            style={[styles.medalIcon, !obtained && styles.medalIconLocked]} 
            resizeMode="contain"
          />
          {obtained && (
            <View style={styles.obtainedBadge}>
              <Text style={styles.obtainedText}>✓</Text>
            </View>
          )}
        </View>
        
        <View style={styles.medalInfo}>
          <Text style={[styles.medalName, !obtained && styles.medalNameLocked]}>
            {medal.name}
          </Text>
          <Text style={[styles.medalDescription, !obtained && styles.medalDescriptionLocked]}>
            {medal.description}
          </Text>
          <Text style={[styles.medalRequirement, !obtained && styles.medalRequirementLocked]}>
            {medal.requirement}
          </Text>
          
          <View style={styles.medalTags}>
            <View style={[styles.medalTag, { backgroundColor: medal.color }]}>
              <Text style={styles.medalTagText}>{medal.category}</Text>
            </View>
            <View style={[styles.medalTag, { backgroundColor: getRarityColor(medal.rarity) }]}>
              <Text style={styles.medalTagText}>{medal.rarity}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const obtainedCount = userMedals.length;
  const totalCount = allMedals.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Movz</Text>
        <TouchableOpacity 
          style={styles.menuIcon} 
          onPress={() => setIsMenuVisible(true)}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Medalhas</Text>
        <Text style={styles.subtitle}>
          {obtainedCount} de {totalCount} medalhas obtidas
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(obtainedCount / totalCount) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((obtainedCount / totalCount) * 100)}% completo
          </Text>
        </View>
      </View>

      {/* Medals Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.medalsGrid}>
          {allMedals.map(renderMedalCard)}
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  menuIcon: {
    width: 39,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 39,
    height: 6,
    backgroundColor: '#D9D9D9',
    borderRadius: 3,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#D9D9D9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F9BB55',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  medalsGrid: {
    paddingBottom: 20,
  },
  medalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medalCardObtained: {
    borderWidth: 2,
    borderColor: '#F9BB55',
  },
  medalIconContainer: {
    position: 'relative',
    marginRight: 15,
  },
  medalIcon: {
    width: 60,
    height: 60,
  },
  medalIconLocked: {
    opacity: 0.3,
  },
  obtainedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#2ECC71',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obtainedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  medalInfo: {
    flex: 1,
  },
  medalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  medalNameLocked: {
    color: '#999',
  },
  medalDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  medalDescriptionLocked: {
    color: '#CCC',
  },
  medalRequirement: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  medalRequirementLocked: {
    color: '#DDD',
  },
  medalTags: {
    flexDirection: 'row',
    gap: 8,
  },
  medalTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  medalTagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
});

export default MedalsScreen;
