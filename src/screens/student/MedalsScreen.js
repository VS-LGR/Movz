import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import SideMenu from '../../components/SideMenu';
import apiService from '../../services/apiService';
import { getCachedImage } from '../../utils/imageCache';
import Storage from '../../utils/storage';

const { width, height } = Dimensions.get('window');

const MedalsScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMedalsData();
  }, []);

  const loadMedalsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Configurar token de autenticação
      const token = await Storage.getItem('authToken');
      if (token) {
        apiService.setToken(token);
      } else {
        console.error('Token não encontrado');
        setError('Token de autenticação não encontrado');
        return;
      }
      
      const response = await apiService.getStudentProfile();
      if (response.success) {
        setProfileData(response.data.user);
      } else {
        setError(response.message || 'Erro ao carregar medalhas');
      }
    } catch (err) {
      console.error('Erro ao carregar medalhas:', err);
      setError('Não foi possível carregar as medalhas. Tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMedalsData();
  };

  const isMedalObtained = (medal) => {
    if (!profileData) return false;
    return getUnlockedMedals.some(unlockedMedal => unlockedMedal.id === medal.id);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#95A5A6';
      case 'rare': return '#3498DB';
      case 'epic': return '#9B59B6';
      case 'legendary': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  // Usar useMemo para otimizar o cálculo das medalhas
  const medalsData = useMemo(() => {
    // 6 medalhas originais com objetivos reais
    const mockMedals = [
      { id: '1', name: 'Primeira Aula', description: 'Complete sua primeira aula', rarity: 'common', requirement: '1 aula', xpReward: 25, icon: 'Medalha_1.svg' },
      { id: '2', name: 'Dedicado', description: 'Complete 10 aulas', rarity: 'rare', requirement: '10 aulas', xpReward: 100, icon: 'Medalha_2.svg' },
      { id: '3', name: 'Esforçado', description: 'Complete 25 aulas', rarity: 'rare', requirement: '25 aulas', xpReward: 200, icon: 'Medalha_3.svg' },
      { id: '4', name: 'Determinado', description: 'Complete 50 aulas', rarity: 'epic', requirement: '50 aulas', xpReward: 400, icon: 'Medalha_4.svg' },
      { id: '5', name: 'Mestre', description: 'Complete 100 aulas', rarity: 'legendary', requirement: '100 aulas', xpReward: 800, icon: 'Medalha_5.svg' },
      { id: '6', name: 'Lenda Viva', description: 'Complete 200 aulas', rarity: 'mythic', requirement: '200 aulas', xpReward: 1500, icon: 'Medalha_6.svg' }
    ];
    return mockMedals;
  }, []);

  // Calcular medalhas desbloqueadas baseado no perfil do usuário
  const getUnlockedMedals = useMemo(() => {
    if (!profileData) return [];
    
    const unlocked = [];
    const totalClasses = profileData?.totalClasses || 0;
    
    // Medalhas de Participação (6 medalhas)
    if (totalClasses >= 1) unlocked.push({ id: '1', name: 'Primeira Aula' });
    if (totalClasses >= 10) unlocked.push({ id: '2', name: 'Dedicado' });
    if (totalClasses >= 25) unlocked.push({ id: '3', name: 'Esforçado' });
    if (totalClasses >= 50) unlocked.push({ id: '4', name: 'Determinado' });
    if (totalClasses >= 100) unlocked.push({ id: '5', name: 'Mestre' });
    if (totalClasses >= 200) unlocked.push({ id: '6', name: 'Lenda Viva' });
    
    return unlocked;
  }, [profileData]);

  const renderMedalCard = (medal) => {
    const obtained = isMedalObtained(medal);
    
    return (
      <View key={medal.id} style={[styles.medalCard, obtained && styles.medalCardObtained]}>
        <View style={styles.medalIconContainer}>
          <Image 
            source={getCachedImage(medal.name, 'medal')} 
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F9BB55" />
          <Text style={styles.loadingText}>Carregando medalhas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMedalsData}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const obtainedCount = getUnlockedMedals.length;
  const totalCount = medalsData.length;

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
                { width: `${totalCount > 0 ? (obtainedCount / totalCount) * 100 : 0}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {totalCount > 0 ? Math.round((obtainedCount / totalCount) * 100) : 0}% completo
          </Text>
        </View>
      </View>

      {/* Medals Grid */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F9BB55']} />
        }
      >
        <View style={styles.medalsGrid}>
          {medalsData.map(renderMedalCard)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D9493C',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  retryButton: {
    backgroundColor: '#F9BB55',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontFamily: 'Poppins',
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
