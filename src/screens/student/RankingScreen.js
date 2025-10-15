import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import SideMenu from '../../components/SideMenu';
import HamburgerButton from '../../components/HamburgerButton';
import apiService from '../../services/apiService';
import useResponsive from '../../hooks/useResponsive';
import { getCachedImage } from '../../utils/imageCache';
import Storage from '../../utils/storage';
import AnimatedBanner from '../../components/AnimatedBanner';

const { width, height } = Dimensions.get('window');

const RankingScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  const [rankingData, setRankingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRankingData();
  }, []);

  const loadRankingData = async () => {
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
      
      console.log('🔵 RankingScreen - Carregando dados do ranking...');
      const response = await apiService.getStudentRanking();
      console.log('🔵 RankingScreen - Resposta da API:', response);
      
      if (response.success) {
        console.log('🔵 RankingScreen - Dados recebidos:', response.data);
        setRankingData(response.data);
      } else {
        console.error('🔴 RankingScreen - Erro na resposta:', response.message);
        setError(response.message || 'Erro ao carregar ranking');
      }
    } catch (err) {
      console.error('🔴 RankingScreen - Erro ao carregar ranking:', err);
      setError('Não foi possível carregar o ranking. Tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRankingData();
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${position}`;
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1:
        return '#FFD700'; // Ouro
      case 2:
        return '#C0C0C0'; // Prata
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#2FD4CD'; // Azul padrão
    }
  };

  const getBannerImage = (bannerName) => {
    if (!bannerName || bannerName === 'Banner Padrão') {
      return getCachedImage('Banner Padrão', 'banner');
    }
    return getCachedImage(bannerName, 'banner');
  };

  const getBannerThemeColors = (bannerName) => {
    // Cores temáticas baseadas no banner para melhor legibilidade
    const themes = {
      'Banner Padrão': { primary: '#F8F9FA', secondary: '#E9ECEF', text: '#1F2937', overlay: 'rgba(255,255,255,0.1)' },
      'Banner Ouro': { primary: '#FFD700', secondary: '#FFA500', text: '#FFF', overlay: 'rgba(0,0,0,0.6)', numbers: '#FFE55C' },
      'Banner Fogo': { primary: '#FF6B35', secondary: '#FF8E53', text: '#FFF', overlay: 'rgba(0,0,0,0.4)' },
      'Banner NBA': { primary: '#1D428A', secondary: '#C8102E', text: '#FFF', overlay: 'rgba(0,0,0,0.4)' },
      'Banner Futebol': { primary: '#228B22', secondary: '#32CD32', text: '#FFF', overlay: 'rgba(0,0,0,0.4)' },
      'Banner Vôlei': { primary: '#FF4500', secondary: '#FF6347', text: '#FFF', overlay: 'rgba(0,0,0,0.4)' },
      'Banner Basquete': { primary: '#FF8C00', secondary: '#FFA500', text: '#FFF', overlay: 'rgba(0,0,0,0.4)' },
      'Banner Cap': { primary: '#8B4513', secondary: '#A0522D', text: '#FFF', overlay: 'rgba(0,0,0,0.4)' },
      'Banner Cap 2': { primary: '#2F4F4F', secondary: '#708090', text: '#FFF', overlay: 'rgba(0,0,0,0.4)' },
      'Banner Gato': { primary: '#FF69B4', secondary: '#FFB6C1', text: '#FFF', overlay: 'rgba(0,0,0,0.4)' },
      'Banner Rose Gold': { primary: '#E8B4B8', secondary: '#F5C6CB', text: '#FFF', overlay: 'rgba(0,0,0,0.5)', numbers: '#FFF' },
      'Banner Espaço': { primary: '#191970', secondary: '#4169E1', text: '#FFF', overlay: 'rgba(0,0,0,0.4)' },
      'Banner Void': { primary: '#2C2C2C', secondary: '#404040', text: '#FFF', overlay: 'rgba(0,0,0,0.3)', numbers: '#F0F0F0' },
      'Banner Aim': { primary: '#FF4444', secondary: '#FF6666', text: '#FFF', overlay: 'rgba(0,0,0,0.4)', numbers: '#FFAAAA' },
      'Banner Capivara': { primary: '#8B4513', secondary: '#A0522D', text: '#FFF', overlay: 'rgba(0,0,0,0.4)', numbers: '#D2B48C' },
      'Banner Capivara Gorda': { primary: '#654321', secondary: '#8B4513', text: '#FFF', overlay: 'rgba(0,0,0,0.5)', numbers: '#DEB887' },
      'Banner Gatinhos': { primary: '#FF69B4', secondary: '#FFB6C1', text: '#FFF', overlay: 'rgba(0,0,0,0.4)', numbers: '#FFC0CB' },
    };
    return themes[bannerName] || themes['Banner Padrão'];
  };

  const renderHeader = () => (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => onNavigate('home')}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Image
                source={getCachedImage('Ranking Icon', 'icon')}
                style={styles.titleIcon}
                resizeMode="contain"
              />
              <Text style={styles.title}>Ranking</Text>
            </View>
          </View>
          <HamburgerButton
            onPress={() => setIsMenuVisible(true)}
            style={styles.menuButton}
          />
        </View>
  );

  const renderTopThree = () => {
    if (!rankingData || rankingData.ranking.length < 3) return null;

    const topThree = rankingData.ranking.slice(0, 3);
    
    return (
      <View style={styles.topThreeContainer}>
        <Text style={styles.topThreeTitle}>🏅 Top 3</Text>
        <View style={styles.topThreeList}>
          {topThree.map((student, index) => (
            <View key={student.studentId} style={styles.topThreeItem}>
              <View style={[
                styles.topThreePosition,
                { backgroundColor: getPositionColor(student.position) }
              ]}>
                <Text style={styles.topThreePositionText}>
                  {getPositionIcon(student.position)}
                </Text>
              </View>
              <View style={styles.topThreeInfo}>
                <Text style={styles.topThreeName}>{student.name}</Text>
                <Text style={styles.topThreeScore}>{student.totalScore} pontos</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRankingList = () => {
    if (!rankingData) return null;

    return (
      <View style={styles.rankingContainer}>
        <Text style={styles.rankingTitle}>Classificação Completa</Text>
        <View style={styles.rankingList}>
          {rankingData.ranking.map((student, index) => {
            const isCurrentStudent = student.isCurrentUser;
            
            return (
            <AnimatedBanner
                key={student.id}
                bannerName={student.cardBanner}
                style={[
                  styles.rankingItem,
                  isCurrentStudent && styles.currentStudentItem
                ]}
              >
                {student.cardBanner && student.cardBanner !== 'Banner Padrão' && (
                  <Image 
                    source={getBannerImage(student.cardBanner)}
                    style={styles.studentCardBackground}
                    resizeMode="cover"
                  />
                )}
                {student.cardBanner && student.cardBanner !== 'Banner Padrão' && (
                  <View style={[
                    styles.studentCardOverlay,
                    { backgroundColor: getBannerThemeColors(student.cardBanner).overlay }
                  ]} />
                )}
                
                <View style={styles.rankingPosition}>
                  <Text style={[
                    styles.positionText,
                    { color: getPositionColor(student.position) },
                    student.cardBanner && {
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }
                  ]}>
                    {getPositionIcon(student.position)}
                  </Text>
                </View>
                
                <View style={styles.studentInfo}>
                  <Text style={[
                    styles.studentName,
                    isCurrentStudent && styles.currentStudentName,
                    student.cardBanner && student.cardBanner !== 'Banner Padrão' && {
                      color: getBannerThemeColors(student.cardBanner).text,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    },
                    student.cardBanner === 'Banner Padrão' && {
                      color: '#1F2937',
                      fontWeight: 'bold'
                    }
                  ]}>
                    {student.name}
                    {isCurrentStudent && ' (Você)'}
                  </Text>
                  <Text style={[
                    styles.studentEmail,
                    student.cardBanner && student.cardBanner !== 'Banner Padrão' && {
                      color: getBannerThemeColors(student.cardBanner).text,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    },
                    student.cardBanner === 'Banner Padrão' && {
                      color: '#374151',
                      fontWeight: '600'
                    }
                  ]}>{student.email}</Text>
                </View>
                
                <View style={styles.scoreInfo}>
                  <Text style={[
                    styles.totalScore,
                    student.cardBanner && student.cardBanner !== 'Banner Padrão' && {
                  color: (student.cardBanner === 'Banner Void' || 
                          student.cardBanner === 'Banner Ouro' || 
                          student.cardBanner === 'Banner Rose Gold')
                    ? getBannerThemeColors(student.cardBanner).numbers || getBannerThemeColors(student.cardBanner).text
                    : getBannerThemeColors(student.cardBanner).secondary,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    },
                    student.cardBanner === 'Banner Padrão' && {
                      color: '#1F2937',
                      fontWeight: 'bold'
                    }
                  ]}>{student.totalScore}</Text>
                  <Text style={[
                    styles.scoreLabel,
                    student.cardBanner && student.cardBanner !== 'Banner Padrão' && {
                      color: getBannerThemeColors(student.cardBanner).text,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    },
                    student.cardBanner === 'Banner Padrão' && {
                      color: '#374151',
                      fontWeight: '600'
                    }
                  ]}>pontos</Text>
                  <Text style={[
                    styles.classesCount,
                    student.cardBanner && student.cardBanner !== 'Banner Padrão' && {
                      color: getBannerThemeColors(student.cardBanner).text,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    },
                    student.cardBanner === 'Banner Padrão' && {
                      color: '#374151',
                      fontWeight: '600'
                    }
                  ]}>{student.totalClasses} aulas</Text>
                </View>
            </AnimatedBanner>
            );
          })}
        </View>
            </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image
        source={getCachedImage('Ranking Icon', 'icon')}
        style={styles.emptyStateIcon}
        resizeMode="contain"
      />
      <Text style={styles.emptyStateText}>
        Ranking não disponível
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Você precisa estar matriculado em uma turma para ver o ranking
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadRankingData}>
        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
      </TouchableOpacity>
        </View>
  );
      
  return (
    <SafeAreaView style={styles.safeArea}>
      <SideMenu 
        isVisible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        userType="STUDENT"
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F9BB55']} />
        }
      >
        {renderHeader()}

        {isLoading ? (
          <ActivityIndicator size="large" color="#F9BB55" style={styles.loadingIndicator} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadRankingData}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : !rankingData || rankingData.ranking.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.content}>
            {renderTopThree()}
            {renderRankingList()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8EDED',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#F9BB55',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  backArrow: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Poppins',
  },
  classInfo: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  menuButton: {
    marginLeft: 5,
  },
  content: {
    paddingHorizontal: 20,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
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
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  emptyStateIcon: {
    width: 48,
    height: 48,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins',
  },
  topThreeContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  topThreeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins',
  },
  topThreeList: {
    gap: 10,
  },
  topThreeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  topThreePosition: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  topThreePositionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  topThreeInfo: {
    flex: 1,
  },
  topThreeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
    fontFamily: 'Poppins',
  },
  topThreeScore: {
    fontSize: 14,
    color: '#2FD4CD',
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  rankingContainer: {
    marginBottom: 20,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    fontFamily: 'Poppins',
  },
  rankingList: {
    gap: 8,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1, // Garantir que o conteúdo fique acima da animação
  },
  currentStudentItem: {
    borderWidth: 2,
    borderColor: '#D9493C',
    backgroundColor: '#FFF5F5',
  },
  rankingPosition: {
    width: 40,
    alignItems: 'center',
    marginRight: 15,
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  studentInfo: {
    flex: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Poppins',
    flex: 1,
  },
  studentBanner: {
    width: 40,
    height: 25,
    marginLeft: 10,
  },
  studentCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  studentCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  currentStudentName: {
    color: '#D9493C',
    fontWeight: 'bold',
  },
  studentEmail: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  totalScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2FD4CD',
    fontFamily: 'Poppins',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
  },
  classesCount: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'Poppins',
  },
});

export default RankingScreen;