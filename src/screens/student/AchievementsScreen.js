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

const AchievementsScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [userAchievements, setUserAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);

  // Dados das conquistas disponíveis
  const availableAchievements = [
    {
      id: 1,
      name: 'Primeira Estrela',
      description: 'Complete seu primeiro exercício',
      icon: require('../../assets/images/aiAtivo 5medals.svg'),
      requirement: '1 exercício completado',
      category: 'Iniciante',
      rarity: 'Comum',
      color: '#FFD700'
    },
    {
      id: 2,
      name: 'Guerreiro',
      description: 'Complete 5 exercícios em sequência',
      icon: require('../../assets/images/aiAtivo 9medals.svg'),
      requirement: '5 exercícios consecutivos',
      category: 'Resistência',
      rarity: 'Rara',
      color: '#C0C0C0'
    },
    {
      id: 3,
      name: 'Mestre',
      description: 'Complete 25 exercícios',
      icon: require('../../assets/images/aiAtivo 10medals.svg'),
      requirement: '25 exercícios completados',
      category: 'Elite',
      rarity: 'Épica',
      color: '#FF6B6B'
    },
    {
      id: 4,
      name: 'Lenda Viva',
      description: 'Complete 100 exercícios',
      icon: require('../../assets/images/aiAtivo 11medals.svg'),
      requirement: '100 exercícios completados',
      category: 'Lenda',
      rarity: 'Lendária',
      color: '#9B59B6'
    },
    {
      id: 5,
      name: 'Relâmpago',
      description: 'Complete 10 exercícios em 1 hora',
      icon: require('../../assets/images/aiAtivo 12medals.svg'),
      requirement: '10 exercícios em 1h',
      category: 'Velocidade',
      rarity: 'Rara',
      color: '#3498DB'
    },
    {
      id: 6,
      name: 'Dedicação',
      description: 'Treine por 30 dias seguidos',
      icon: require('../../assets/images/aiAtivo 13medals.svg'),
      requirement: '30 dias consecutivos',
      category: 'Consistência',
      rarity: 'Épica',
      color: '#2ECC71'
    },
    {
      id: 7,
      name: 'Perfeccionista',
      description: 'Complete 50 exercícios com nota máxima',
      icon: require('../../assets/images/aiAtivo 14medals.svg'),
      requirement: '50 exercícios perfeitos',
      category: 'Precisão',
      rarity: 'Épica',
      color: '#E74C3C'
    },
    {
      id: 8,
      name: 'Explorador',
      description: 'Complete exercícios de todos os esportes',
      icon: require('../../assets/images/aiAtivo 15medals.svg'),
      requirement: 'Todos os esportes',
      category: 'Variedade',
      rarity: 'Rara',
      color: '#F39C12'
    },
    {
      id: 9,
      name: 'Campeão',
      description: 'Fique em 1º lugar no ranking',
      icon: require('../../assets/images/aiAtivo 19medals.svg'),
      requirement: '1º lugar no ranking',
      category: 'Competição',
      rarity: 'Lendária',
      color: '#8E44AD'
    },
    {
      id: 10,
      name: 'Invencível',
      description: 'Mantenha o 1º lugar por 7 dias',
      icon: require('../../assets/images/aiAtivo 20medals.svg'),
      requirement: '7 dias no topo',
      category: 'Domínio',
      rarity: 'Lendária',
      color: '#E67E22'
    },
    {
      id: 11,
      name: 'Mentor',
      description: 'Ajude 10 colegas no chat',
      icon: require('../../assets/images/aiAtivo 21medals.svg'),
      requirement: '10 ajudas no chat',
      category: 'Social',
      rarity: 'Rara',
      color: '#16A085'
    },
    {
      id: 12,
      name: 'Líder',
      description: 'Seja o mais ativo por 1 mês',
      icon: require('../../assets/images/aiAtivo 22medals.svg'),
      requirement: 'Mais ativo por 30 dias',
      category: 'Liderança',
      rarity: 'Épica',
      color: '#27AE60'
    },
    {
      id: 13,
      name: 'Estrategista',
      description: 'Complete todos os tutoriais',
      icon: require('../../assets/images/aiAtivo 23medals.svg'),
      requirement: 'Todos os tutoriais',
      category: 'Conhecimento',
      rarity: 'Rara',
      color: '#2980B9'
    },
    {
      id: 14,
      name: 'Fenômeno',
      description: 'Quebre 5 recordes pessoais',
      icon: require('../../assets/images/aiAtivo 24medals.svg'),
      requirement: '5 recordes quebrados',
      category: 'Superação',
      rarity: 'Épica',
      color: '#D35400'
    },
    {
      id: 15,
      name: 'Ídolo',
      description: 'Seja mencionado 20 vezes no chat',
      icon: require('../../assets/images/aiAtivo 25medals.svg'),
      requirement: '20 menções positivas',
      category: 'Reconhecimento',
      rarity: 'Lendária',
      color: '#C0392B'
    },
    {
      id: 16,
      name: 'Lenda Eterna',
      description: 'Complete todas as conquistas',
      icon: require('../../assets/images/aiAtivo 26medals.svg'),
      requirement: 'Todas as conquistas',
      category: 'Supremo',
      rarity: 'Mítica',
      color: '#8E44AD'
    }
  ];

  // Simular conquistas obtidas pelo usuário (em produção, viria da API)
  useEffect(() => {
    // Simular algumas conquistas já obtidas
    const obtainedAchievements = [1, 2, 5, 8, 11]; // IDs das conquistas obtidas
    setUserAchievements(obtainedAchievements);
    setAllAchievements(availableAchievements);
  }, []);

  const isAchievementObtained = (achievementId) => {
    return userAchievements.includes(achievementId);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Comum': return '#95A5A6';
      case 'Rara': return '#3498DB';
      case 'Épica': return '#9B59B6';
      case 'Lendária': return '#F39C12';
      case 'Mítica': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const renderAchievementCard = (achievement) => {
    const obtained = isAchievementObtained(achievement.id);
    
    return (
      <View key={achievement.id} style={[styles.achievementCard, obtained && styles.achievementCardObtained]}>
        <View style={styles.achievementIconContainer}>
          <Image 
            source={achievement.icon} 
            style={[styles.achievementIcon, !obtained && styles.achievementIconLocked]} 
            resizeMode="contain"
          />
          {obtained && (
            <View style={styles.obtainedBadge}>
              <Text style={styles.obtainedText}>✓</Text>
            </View>
          )}
        </View>
        
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementName, !obtained && styles.achievementNameLocked]}>
            {achievement.name}
          </Text>
          <Text style={[styles.achievementDescription, !obtained && styles.achievementDescriptionLocked]}>
            {achievement.description}
          </Text>
          <Text style={[styles.achievementRequirement, !obtained && styles.achievementRequirementLocked]}>
            {achievement.requirement}
          </Text>
          
          <View style={styles.achievementTags}>
            <View style={[styles.achievementTag, { backgroundColor: achievement.color }]}>
              <Text style={styles.achievementTagText}>{achievement.category}</Text>
            </View>
            <View style={[styles.achievementTag, { backgroundColor: getRarityColor(achievement.rarity) }]}>
              <Text style={styles.achievementTagText}>{achievement.rarity}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const obtainedCount = userAchievements.length;
  const totalCount = allAchievements.length;

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
        <Text style={styles.title}>Conquistas</Text>
        <Text style={styles.subtitle}>
          {obtainedCount} de {totalCount} conquistas obtidas
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

      {/* Achievements Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.achievementsGrid}>
          {allAchievements.map(renderAchievementCard)}
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
  achievementsGrid: {
    paddingBottom: 20,
  },
  achievementCard: {
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
  achievementCardObtained: {
    borderWidth: 2,
    borderColor: '#F9BB55',
  },
  achievementIconContainer: {
    position: 'relative',
    marginRight: 15,
  },
  achievementIcon: {
    width: 60,
    height: 60,
  },
  achievementIconLocked: {
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
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  achievementNameLocked: {
    color: '#999',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  achievementDescriptionLocked: {
    color: '#CCC',
  },
  achievementRequirement: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  achievementRequirementLocked: {
    color: '#DDD',
  },
  achievementTags: {
    flexDirection: 'row',
    gap: 8,
  },
  achievementTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementTagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
});

export default AchievementsScreen;
