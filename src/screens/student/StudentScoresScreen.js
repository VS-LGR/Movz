import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import apiService from '../../services/apiService';
import SideMenu from '../../components/SideMenu';
import HamburgerButton from '../../components/HamburgerButton';
import useResponsive from '../../hooks/useResponsive';
import { getCachedImage } from '../../utils/imageCache';

const { width, height } = Dimensions.get('window');

const StudentScoresScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();

  const [sportsData, setSportsData] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSportsScores();
  }, []);

  const loadSportsScores = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Configurar token de autenticação
      const token = localStorage.getItem('authToken');
      if (token) {
        apiService.setToken(token);
      } else {
        console.error('Token não encontrado');
        setError('Token de autenticação não encontrado');
        return;
      }
      
      const response = await apiService.getStudentSportsScores();
      if (response.success) {
        setSportsData(response.data);
      } else {
        setError(response.message || 'Erro ao carregar pontuações');
      }

      // Buscar dados do perfil para personalizações
      const profileResponse = await apiService.getStudentProfile();
      if (profileResponse.success) {
        setProfileData(profileResponse.data);
      }
    } catch (err) {
      console.error('Erro ao carregar pontuações:', err);
      setError('Não foi possível carregar suas pontuações. Tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSportsScores();
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50'; // Verde
    if (score >= 70) return '#FF9800'; // Laranja
    if (score >= 50) return '#FFC107'; // Amarelo
    return '#D9493C'; // Vermelho
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Bom';
    if (score >= 50) return 'Regular';
    return 'Precisa Melhorar';
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
    };
    return themes[bannerName] || themes['Banner Padrão'];
  };

  const getCardStyle = () => {
    if (!profileData) return styles.sportCard;

    const banner = profileData.student.cardBanner;
    let cardStyle = { ...styles.sportCard };

    // Usar cores temáticas baseadas no banner (sem imagem de fundo)
    if (banner && banner !== 'Banner Padrão') {
      const theme = getBannerThemeColors(banner);
      cardStyle.backgroundColor = theme.primary;
      cardStyle.borderColor = theme.secondary;
    } else {
      cardStyle.backgroundColor = '#E8EDED';
      cardStyle.borderColor = '#D0D0D0';
    }

    return cardStyle;
  };

  const getCardAnimationStyle = () => {
    if (!profileData) return {};

    const animation = profileData.student.cardAnimation;

    switch (animation) {
      case 'none':
        return {};
      case 'brilho':
        return {
          boxShadow: '0px 0px 20px rgba(249, 187, 85, 0.5)',
          elevation: 8,
        };
      case 'sparkle':
        return {
          boxShadow: '0px 0px 25px rgba(255, 215, 0, 0.8)',
          elevation: 10,
        };
      case 'arco-íris':
        return {
          borderWidth: 3,
          borderColor: '#EC4899',
          boxShadow: '0px 0px 15px rgba(236, 72, 153, 0.6)',
          elevation: 6,
        };
      default:
        return {};
    }
  };

  const getMedalIcon = (score) => {
    if (score >= 90) return '🥇'; // Ouro
    if (score >= 70) return '🥈'; // Prata
    if (score >= 50) return '🥉'; // Bronze
    return '🏅'; // Participação
  };

  const getMedalColor = (score) => {
    if (score >= 90) return '#FFD700'; // Dourado
    if (score >= 70) return '#C0C0C0'; // Prateado
    if (score >= 50) return '#CD7F32'; // Bronze
    return '#E0E0E0'; // Cinza
  };

  const getAchievementLevel = (totalClasses) => {
    if (totalClasses >= 10) return { level: 'Mestre', icon: '👑', color: '#8B5CF6' };
    if (totalClasses >= 5) return { level: 'Expert', icon: '⭐', color: '#F59E0B' };
    if (totalClasses >= 3) return { level: 'Avançado', icon: '🔥', color: '#EF4444' };
    if (totalClasses >= 1) return { level: 'Iniciante', icon: '🌱', color: '#10B981' };
    return { level: 'Novato', icon: '🌱', color: '#6B7280' };
  };

  const renderSportCard = (sportData) => {
    const hasScores = sportData.totalClasses > 0;
    const achievement = getAchievementLevel(sportData.totalClasses);
    const medalIcon = hasScores ? getMedalIcon(sportData.averageScore) : '🏅';
    const medalColor = hasScores ? getMedalColor(sportData.averageScore) : '#E0E0E0';

    return (
      <TouchableOpacity 
        key={sportData.sport.id} 
        style={[
          styles.sportCard,
          getCardAnimationStyle(),
          { 
            opacity: hasScores ? 1 : 0.7,
            borderColor: hasScores ? medalColor : '#E0E0E0',
            borderWidth: hasScores ? 2 : 1
          }
        ]}
        activeOpacity={0.8}
      >
        {/* Header com ícone do esporte e medalha */}
        <View style={styles.sportHeader}>
          <View style={styles.sportIconContainer}>
            <View style={[styles.sportIcon, { backgroundColor: sportData.sport.color || '#F9BB55' }]}>
              <Text style={styles.sportIconText}>
                {sportData.sport.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.medalBadge, { backgroundColor: medalColor }]}>
              <Text style={styles.medalIcon}>{medalIcon}</Text>
            </View>
          </View>
          
          <View style={styles.sportInfo}>
            <Text style={[
              styles.sportName, 
              { color: hasScores ? '#364859' : '#9CA3AF' }
            ]}>
              {sportData.sport.name}
            </Text>
            <Text style={styles.achievementLevel}>
              {achievement.icon} {achievement.level}
            </Text>
          </View>
        </View>

        {/* Estatísticas */}
        <View style={styles.sportStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sportData.totalClasses}</Text>
            <Text style={styles.statLabel}>Aulas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sportData.totalScore}</Text>
            <Text style={styles.statLabel}>Pontos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sportData.averageScore}</Text>
            <Text style={styles.statLabel}>Média</Text>
          </View>
        </View>

        {/* Progresso visual */}
        {hasScores && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min((sportData.averageScore / 100) * 100, 100)}%`,
                    backgroundColor: medalColor
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {getScoreLabel(sportData.averageScore)}
            </Text>
          </View>
        )}

        {/* Estado vazio */}
        {!hasScores && (
          <View style={styles.emptySportContainer}>
            <Text style={styles.emptySportText}>
              Ainda não há pontuações para este esporte
            </Text>
            <Text style={styles.emptySportSubtext}>
              Participe das aulas para conquistar medalhas! 🏆
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    const totalSports = sportsData.length;
    const sportsWithScores = sportsData.filter(sport => sport.totalClasses > 0).length;
    const totalClasses = sportsData.reduce((sum, sport) => sum + sport.totalClasses, 0);
    const totalScore = sportsData.reduce((sum, sport) => sum + sport.totalScore, 0);
    const averageScore = sportsWithScores > 0 
      ? Math.round(sportsData.filter(sport => sport.totalClasses > 0).reduce((sum, sport) => sum + sport.averageScore, 0) / sportsWithScores)
      : 0;

    const getOverallLevel = () => {
      if (totalClasses >= 20) return { level: 'Lenda', icon: '👑', color: '#8B5CF6' };
      if (totalClasses >= 15) return { level: 'Mestre', icon: '⭐', color: '#F59E0B' };
      if (totalClasses >= 10) return { level: 'Expert', icon: '🔥', color: '#EF4444' };
      if (totalClasses >= 5) return { level: 'Avançado', icon: '🌱', color: '#10B981' };
      if (totalClasses >= 1) return { level: 'Iniciante', icon: '🌱', color: '#6B7280' };
      return { level: 'Novato', icon: '🌱', color: '#6B7280' };
    };

    const overallLevel = getOverallLevel();

    return (
      <View style={styles.statsContainer}>
        {/* Card Principal de Conquistas */}
        <View style={[styles.achievementCard, getCardStyle()]}>
          {profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && (
            <Image 
              source={getCachedImage(profileData.student.cardBanner, 'banner')}
              style={styles.achievementCardBackground}
              resizeMode="cover"
            />
          )}
          {profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && (
            <View style={[
              styles.achievementCardOverlay,
              { backgroundColor: getBannerThemeColors(profileData.student.cardBanner).overlay }
            ]} />
          )}
          
          <View style={styles.achievementHeader}>
            <Text style={[
              styles.achievementTitle,
              profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && {
                color: getBannerThemeColors(profileData.student.cardBanner).text,
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              },
              profileData?.student.cardBanner === 'Banner Padrão' && {
                color: '#1F2937',
                fontWeight: 'bold'
              }
            ]}>🏆 Suas Pontuações</Text>
            <View style={[styles.levelBadge, { backgroundColor: overallLevel.color }]}>
              <Text style={styles.levelIcon}>{overallLevel.icon}</Text>
            </View>
          </View>
          
          <View style={styles.achievementContent}>
            <Text style={[
              styles.levelText,
              profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && {
                color: getBannerThemeColors(profileData.student.cardBanner).text,
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              },
              profileData?.student.cardBanner === 'Banner Padrão' && {
                color: '#1F2937',
                fontWeight: 'bold'
              }
            ]}>{overallLevel.level}</Text>
            <Text style={[
              styles.levelSubtext,
              profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && {
                color: getBannerThemeColors(profileData.student.cardBanner).text,
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              },
              profileData?.student.cardBanner === 'Banner Padrão' && {
                color: '#374151',
                fontWeight: '600'
              }
            ]}>Nível Geral</Text>
          </View>

          <View style={styles.achievementStats}>
            <View style={styles.achievementStat}>
              <Text style={[
                styles.achievementStatNumber,
                profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && {
                  color: (profileData.student.cardBanner === 'Banner Void' || 
                          profileData.student.cardBanner === 'Banner Ouro' || 
                          profileData.student.cardBanner === 'Banner Rose Gold')
                    ? getBannerThemeColors(profileData.student.cardBanner).numbers || getBannerThemeColors(profileData.student.cardBanner).text
                    : getBannerThemeColors(profileData.student.cardBanner).secondary,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                },
                profileData?.student.cardBanner === 'Banner Padrão' && {
                  color: '#1F2937',
                  fontWeight: 'bold'
                }
              ]}>{sportsWithScores}</Text>
              <Text style={[
                styles.achievementStatLabel,
                profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && {
                  color: getBannerThemeColors(profileData.student.cardBanner).text,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                },
                profileData?.student.cardBanner === 'Banner Padrão' && {
                  color: '#374151',
                  fontWeight: '600'
                }
              ]}>Esportes Ativos</Text>
            </View>
            <View style={styles.achievementStat}>
              <Text style={[
                styles.achievementStatNumber,
                profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && {
                  color: (profileData.student.cardBanner === 'Banner Void' || 
                          profileData.student.cardBanner === 'Banner Ouro' || 
                          profileData.student.cardBanner === 'Banner Rose Gold')
                    ? getBannerThemeColors(profileData.student.cardBanner).numbers || getBannerThemeColors(profileData.student.cardBanner).text
                    : getBannerThemeColors(profileData.student.cardBanner).secondary,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                },
                profileData?.student.cardBanner === 'Banner Padrão' && {
                  color: '#1F2937',
                  fontWeight: 'bold'
                }
              ]}>{totalClasses}</Text>
              <Text style={[
                styles.achievementStatLabel,
                profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && {
                  color: getBannerThemeColors(profileData.student.cardBanner).text,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                },
                profileData?.student.cardBanner === 'Banner Padrão' && {
                  color: '#374151',
                  fontWeight: '600'
                }
              ]}>Aulas Completas</Text>
            </View>
            <View style={styles.achievementStat}>
              <Text style={[
                styles.achievementStatNumber,
                profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && {
                  color: (profileData.student.cardBanner === 'Banner Void' || 
                          profileData.student.cardBanner === 'Banner Ouro' || 
                          profileData.student.cardBanner === 'Banner Rose Gold')
                    ? getBannerThemeColors(profileData.student.cardBanner).numbers || getBannerThemeColors(profileData.student.cardBanner).text
                    : getBannerThemeColors(profileData.student.cardBanner).secondary,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                },
                profileData?.student.cardBanner === 'Banner Padrão' && {
                  color: '#1F2937',
                  fontWeight: 'bold'
                }
              ]}>{totalScore}</Text>
              <Text style={[
                styles.achievementStatLabel,
                profileData?.student.cardBanner && profileData.student.cardBanner !== 'Banner Padrão' && {
                  color: getBannerThemeColors(profileData.student.cardBanner).text,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                },
                profileData?.student.cardBanner === 'Banner Padrão' && {
                  color: '#374151',
                  fontWeight: '600'
                }
              ]}>Pontos Totais</Text>
            </View>
          </View>

          {averageScore > 0 && (
            <View style={styles.averageContainer}>
              <Text style={styles.averageLabel}>Média Geral:</Text>
              <View style={[styles.averageBadge, { backgroundColor: getScoreColor(averageScore) }]}>
                <Text style={styles.averageNumber}>{averageScore}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Cards de Estatísticas Detalhadas */}
        <View style={styles.detailedStats}>
          <View style={styles.detailedStatCard}>
            <Text style={styles.detailedStatIcon}>🏅</Text>
            <Text style={styles.detailedStatNumber}>{sportsWithScores}/{totalSports}</Text>
            <Text style={styles.detailedStatLabel}>Esportes com Medalhas</Text>
          </View>
          <View style={styles.detailedStatCard}>
            <Text style={styles.detailedStatIcon}>📚</Text>
            <Text style={styles.detailedStatNumber}>{totalClasses}</Text>
            <Text style={styles.detailedStatLabel}>Aulas Participadas</Text>
          </View>
          <View style={styles.detailedStatCard}>
            <Text style={styles.detailedStatIcon}>🎯</Text>
            <Text style={styles.detailedStatNumber}>{totalScore}</Text>
            <Text style={styles.detailedStatLabel}>Pontos Conquistados</Text>
          </View>
        </View>
      </View>
    );
  };

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>🏆 Pontuações</Text>
            <Text style={styles.subtitle}>Seu progresso em todos os esportes</Text>
          </View>
          <HamburgerButton
            onPress={() => setIsMenuVisible(true)}
            style={styles.menuButton}
          />
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#F9BB55" style={styles.loadingIndicator} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadSportsScores}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : sportsData.length > 0 ? (
          <View style={styles.content}>
            {/* Estatísticas */}
            {renderStats()}

            {/* Lista de Esportes */}
            <View style={styles.sportsList}>
              {sportsData.map(renderSportCard)}
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🏅</Text>
            <Text style={styles.emptyStateText}>
              Suas medalhas aparecerão aqui!
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Participe das aulas para conquistar medalhas em todos os esportes! 🏆
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadSportsScores}>
              <Text style={styles.retryButtonText}>Atualizar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9BB55',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'center',
  },
  menuButton: {
    marginLeft: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D9493C',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins',
  },
  retryButton: {
    backgroundColor: '#364859',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#364859',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins',
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginBottom: 25,
  },
  // Card Principal de Conquistas
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#F9BB55',
    position: 'relative',
    overflow: 'hidden',
  },
  achievementCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  achievementCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  levelIcon: {
    fontSize: 24,
  },
  achievementContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  levelSubtext: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  achievementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  achievementStat: {
    alignItems: 'center',
  },
  achievementStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2FD4CD',
    fontFamily: 'Poppins',
  },
  achievementStatLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 4,
    textAlign: 'center',
  },
  averageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  averageLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  averageBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  averageNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  // Cards de Estatísticas Detalhadas
  detailedStats: {
    flexDirection: 'row',
    gap: 12,
  },
  detailedStatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  detailedStatIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  detailedStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  detailedStatLabel: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 14,
  },
  // Lista de Esportes
  sportsList: {
    gap: 15,
  },
  sportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sportIconContainer: {
    position: 'relative',
    marginRight: 15,
  },
  sportIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sportIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  medalBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  medalIcon: {
    fontSize: 14,
  },
  sportInfo: {
    flex: 1,
  },
  sportName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  achievementLevel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  sportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  emptySportContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptySportText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  emptySportSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
});

export default StudentScoresScreen;
