import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import SideMenu from '../../components/SideMenu';
import HamburgerButton from '../../components/HamburgerButton';
import apiService from '../../services/apiService';
import useResponsive from '../../hooks/useResponsive';
import { getCachedImage } from '../../utils/imageCache';

const { width, height } = Dimensions.get('window');

const CardCustomizationScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [selectedAnimation, setSelectedAnimation] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
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
      
      console.log('🔵 CardCustomizationScreen - Carregando dados do perfil...');
      const response = await apiService.getStudentProfile();
      console.log('🔵 CardCustomizationScreen - Resposta da API:', response);
      
      if (response.success) {
        console.log('🔵 CardCustomizationScreen - Dados recebidos:', response.data);
        setProfileData(response.data);
        setSelectedBackground(response.data.student.cardBanner || 'Banner Padrão');
        setSelectedAnimation(response.data.student.cardAnimation || 'none');
      } else {
        console.error('🔴 CardCustomizationScreen - Erro na resposta:', response.message);
        setError(response.message || 'Erro ao carregar perfil');
      }
    } catch (err) {
      console.error('🔴 CardCustomizationScreen - Erro ao carregar perfil:', err);
      setError('Não foi possível carregar seu perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handleUpdateCustomization = async () => {
    if (!selectedBackground || !selectedAnimation) {
      Alert.alert('Atenção', 'Selecione um fundo e uma animação para continuar.');
      return;
    }

    setIsUpdating(true);
    try {
      console.log('🔵 CardCustomizationScreen - Atualizando personalização...');
      const response = await apiService.updateCardCustomization(selectedBackground, selectedAnimation, selectedBackground);
      console.log('🔵 CardCustomizationScreen - Resposta da atualização:', response);
      
      if (response.success) {
        Alert.alert('Sucesso', 'Personalização atualizada com sucesso!');
        // Atualizar dados locais
        setProfileData(prev => ({
          ...prev,
          student: {
            ...prev.student,
            cardBackground: selectedBackground,
            cardAnimation: selectedAnimation
          }
        }));
      } else {
        Alert.alert('Erro', response.message || 'Erro ao atualizar personalização');
      }
    } catch (err) {
      console.error('🔴 CardCustomizationScreen - Erro ao atualizar:', err);
      Alert.alert('Erro', 'Não foi possível atualizar a personalização. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'common': return '⚪';
      case 'rare': return '🔵';
      case 'epic': return '🟣';
      case 'legendary': return '🟡';
      default: return '⚪';
    }
  };

  const getBackgroundColor = (backgroundName) => {
    switch (backgroundName) {
      case 'default': return '#E8EDED';
      case 'champion': return '#FFD700';
      case 'legend': return '#8B5CF6';
      case 'golden': return '#F59E0B';
      case 'starry': return '#1E3A8A';
      case 'ocean': return '#0EA5E9';
      case 'forest': return '#10B981';
      case 'fire': return '#EF4444';
      case 'ice': return '#06B6D4';
      case 'rainbow': return '#EC4899';
      default: return '#E8EDED';
    }
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
    if (!selectedBackground) return {};
    
    // Se for um banner, usar cores temáticas com overlay
    if (selectedBackground && selectedBackground !== 'Banner Padrão') {
      const theme = getBannerThemeColors(selectedBackground);
      return {
        backgroundImage: `url(${getCachedImage(selectedBackground, 'banner')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      };
    }
    
    return {
      backgroundColor: '#F8F9FA', // Cor padrão lisa
    };
  };

  const getCardAnimationStyle = () => {
    if (!selectedAnimation) return {};
    
    // Aqui você pode adicionar estilos de animação baseados na seleção
    // Por enquanto, retornamos um objeto vazio
    return {};
  };

  const isCustomizationUnlocked = (customization) => {
    if (!profileData) return false;
    
    // Para admin, liberar tudo
    if (profileData.student.email === 'admin@aluno.com') {
      return true;
    }
    
    switch (customization.unlockType) {
      case 'xp':
        return profileData.student.totalXP >= customization.unlockValue;
      
      case 'achievement':
        if (!customization.unlockTarget) return false;
        return profileData.achievements.unlocked.some(ach => ach.name === customization.unlockTarget);
      
      case 'medal':
        if (!customization.unlockTarget) return false;
        return profileData.medals.unlocked.some(medal => medal.name === customization.unlockTarget);
      
      default:
        return false;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>🎨 Personalizar Card</Text>
        <Text style={styles.subtitle}>Customize seu card de pontuação</Text>
        {profileData && (
          <Text style={styles.xpInfo}>
            💎 Nível {profileData.student.level} • {profileData.student.totalXP} XP
          </Text>
        )}
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>
            {refreshing ? '🔄' : '🔄'}
          </Text>
        </TouchableOpacity>
        <HamburgerButton
          onPress={() => setIsMenuVisible(true)}
          style={styles.menuButton}
        />
      </View>
    </View>
  );

  const renderPreviewCard = () => {
    const cardStyle = getCardStyle();
    const animationStyle = getCardAnimationStyle();
    
    return (
      <View style={styles.previewBannerContainer}>
        <View style={styles.previewBannerHeader}>
          <Text style={styles.previewBannerTitle}>🎨 Preview do Seu Card</Text>
          <Text style={styles.previewBannerSubtitle}>Como outros alunos te verão no ranking</Text>
        </View>
        <View style={[styles.previewBanner, cardStyle, animationStyle]}>
          {selectedBackground && selectedBackground !== 'Banner Padrão' && (
            <Image 
              source={getCachedImage(selectedBackground, 'banner')}
              style={styles.previewBannerBackground}
              resizeMode="cover"
            />
          )}
          {selectedBackground && selectedBackground !== 'Banner Padrão' && (
            <View style={[
              styles.previewBannerOverlay,
              { backgroundColor: getBannerThemeColors(selectedBackground).overlay }
            ]} />
          )}
          <View style={styles.previewBannerContent}>
            <View style={styles.previewBannerLeft}>
              <View style={[
                styles.previewAvatar,
                selectedBackground && selectedBackground !== 'Banner Padrão' && {
                  backgroundColor: getBannerThemeColors(selectedBackground).primary
                }
              ]}>
                <Text style={[
                  styles.previewAvatarText,
                  selectedBackground && selectedBackground !== 'Banner Padrão' && {
                    color: getBannerThemeColors(selectedBackground).text
                  }
                ]}>A</Text>
              </View>
              <View style={styles.previewUserInfo}>
                <Text style={[
                  styles.previewUserName,
                  selectedBackground && selectedBackground !== 'Banner Padrão' && {
                    color: getBannerThemeColors(selectedBackground).text,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  },
                  selectedBackground === 'Banner Padrão' && {
                    color: '#1F2937',
                    fontWeight: 'bold'
                  }
                ]}>Admin Aluno</Text>
                <Text style={[
                  styles.previewUserClass,
                  selectedBackground && selectedBackground !== 'Banner Padrão' && {
                    color: getBannerThemeColors(selectedBackground).text,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  },
                  selectedBackground === 'Banner Padrão' && {
                    color: '#374151',
                    fontWeight: '600'
                  }
                ]}>5ª Série A</Text>
              </View>
            </View>
            <View style={styles.previewBannerRight}>
              <View style={styles.previewStats}>
                <Text style={[
                  styles.previewScoreLabel,
                  selectedBackground && selectedBackground !== 'Banner Padrão' && {
                    color: getBannerThemeColors(selectedBackground).text,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  },
                  selectedBackground === 'Banner Padrão' && {
                    color: '#374151',
                    fontWeight: '600'
                  }
                ]}>Pontuação Total</Text>
                <Text style={[
                  styles.previewScoreValue,
                  selectedBackground && selectedBackground !== 'Banner Padrão' && {
                  color: (selectedBackground === 'Banner Void' || 
                          selectedBackground === 'Banner Ouro' || 
                          selectedBackground === 'Banner Rose Gold')
                    ? getBannerThemeColors(selectedBackground).numbers || getBannerThemeColors(selectedBackground).text
                    : getBannerThemeColors(selectedBackground).secondary,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  },
                  selectedBackground === 'Banner Padrão' && {
                    color: '#1F2937',
                    fontWeight: 'bold',
                    fontSize: 24
                  }
                ]}>1,250</Text>
              </View>
              <View style={styles.previewLevel}>
                <Text style={[
                  styles.previewLevelText,
                  selectedBackground && selectedBackground !== 'Banner Padrão' && {
                    color: getBannerThemeColors(selectedBackground).text,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  },
                  selectedBackground === 'Banner Padrão' && {
                    color: '#1F2937',
                    fontWeight: 'bold'
                  }
                ]}>Nível 5</Text>
                <Text style={[
                  styles.previewXPText,
                  selectedBackground && selectedBackground !== 'Banner Padrão' && {
                    color: getBannerThemeColors(selectedBackground).text,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  },
                  selectedBackground === 'Banner Padrão' && {
                    color: '#374151',
                    fontWeight: '600'
                  }
                ]}>1,250 XP</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCustomizationSection = (title, type, customizations, selectedValue, onSelect) => (
    <View style={styles.customizationSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>Escolha seu estilo favorito</Text>
      </View>
      <View style={styles.customizationGrid}>
        {customizations.map((customization) => {
          const isUnlocked = isCustomizationUnlocked(customization);
          const isSelected = selectedValue === customization.name;
          
          return (
            <TouchableOpacity
              key={customization.id}
              style={[
                styles.customizationCard,
                isSelected && styles.customizationCardSelected,
                !isUnlocked && styles.customizationCardLocked
              ]}
              onPress={() => isUnlocked && onSelect(customization.name)}
              disabled={!isUnlocked}
              activeOpacity={0.7}
            >
              <View style={styles.customizationCardContent}>
                <View style={styles.customizationPreview}>
                  {type === 'BANNER' ? (
                    <View style={styles.bannerPreview}>
                      {customization.name !== 'Banner Padrão' ? (
                        <Image 
                          source={getCachedImage(customization.name, 'banner')}
                          style={styles.bannerPreviewImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.bannerPreviewImage, { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF' }]}>
                          <Text style={styles.bannerPreviewText}>Padrão</Text>
                        </View>
                      )}
                    </View>
                  ) : type === 'animation' ? (
                    <View style={styles.animationPreview}>
                      <Text style={styles.previewIcon}>✨</Text>
                    </View>
                  ) : (
                    <View style={styles.bannerPreview}>
                      <Text style={styles.previewIcon}>🎨</Text>
                    </View>
                  )}
                  
                  <View style={[
                    styles.rarityBadge,
                    { backgroundColor: getRarityColor(customization.rarity) }
                  ]}>
                    <Text style={styles.rarityText}>
                      {getRarityIcon(customization.rarity)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.customizationInfo}>
                  <Text style={[
                    styles.customizationName,
                    !isUnlocked && styles.customizationNameLocked
                  ]}>
                    {customization.name}
                  </Text>
                  
                  <Text style={[
                    styles.customizationDescription,
                    !isUnlocked && styles.customizationDescriptionLocked
                  ]} numberOfLines={2}>
                    {customization.description}
                  </Text>
                  
                  {!isUnlocked && (
                    <View style={styles.unlockRequirement}>
                      <Text style={styles.unlockText}>
                        🔒 {customization.unlockType === 'xp' 
                          ? `${customization.unlockValue} XP`
                          : customization.unlockTarget || 'Requisito especial'
                        }
                      </Text>
                    </View>
                  )}
                </View>
                
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStats = () => {
    if (!profileData) return null;

    return (
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>📊 Suas Conquistas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData.medals.stats.unlocked}</Text>
            <Text style={styles.statLabel}>Medalhas</Text>
            <Text style={styles.statSubtext}>
              {profileData.medals.stats.percentage}% desbloqueadas
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData.achievements.stats.unlocked}</Text>
            <Text style={styles.statLabel}>Conquistas</Text>
            <Text style={styles.statSubtext}>
              {profileData.achievements.stats.percentage}% desbloqueadas
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData.student.level}</Text>
            <Text style={styles.statLabel}>Nível</Text>
            <Text style={styles.statSubtext}>
              {profileData.xp.progress}/1000 XP
            </Text>
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
        {renderHeader()}

        {isLoading ? (
          <ActivityIndicator size="large" color="#F9BB55" style={styles.loadingIndicator} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : profileData ? (
          <View style={styles.content}>
            {renderStats()}
            
            {/* Preview Card em banner */}
            {renderPreviewCard()}
            
            {/* Customizações lado a lado */}
            <View style={styles.customizationsContainer}>
              {renderCustomizationSection(
                '🏆 Fundos (Banners)',
                'BANNER',
                profileData.customizations.filter(c => c.type === 'BANNER'),
                selectedBackground,
                setSelectedBackground
              )}
              
              {renderCustomizationSection(
                '✨ Animações',
                'animation',
                profileData.customizations.filter(c => c.type === 'animation'),
                selectedAnimation,
                setSelectedAnimation
              )}
            </View>
            
            <TouchableOpacity
              style={[
                styles.updateButton,
                isUpdating && styles.updateButtonDisabled
              ]}
              onPress={handleUpdateCustomization}
              disabled={isUpdating}
            >
              <Text style={styles.updateButtonText}>
                {isUpdating ? 'Atualizando...' : '🎨 Aplicar Personalização'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  xpInfo: {
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
  statsSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    fontFamily: 'Poppins',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2FD4CD',
    fontFamily: 'Poppins',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
    fontFamily: 'Poppins',
  },
  statSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    fontFamily: 'Poppins',
  },
  previewSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  customizationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  customizationCard: {
    width: width > 768 ? (width - 80) / 2 : width - 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  customizationCardSelected: {
    borderWidth: 3,
    borderColor: '#F9BB55',
    backgroundColor: '#FFF9F0',
    transform: [{ scale: 1.02 }],
    boxShadow: '0px 6px 20px rgba(249, 187, 85, 0.3)',
    elevation: 6,
  },
  customizationCardLocked: {
    opacity: 0.6,
  },
  customizationPreview: {
    position: 'relative',
    marginBottom: 10,
  },
  backgroundPreview: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  animationPreview: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerPreview: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  bannerPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerPreviewText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  previewIcon: {
    fontSize: 32,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  previewCard: {
    width: width - 40,
    maxWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  previewCardBackground: {
    padding: 20,
    borderRadius: 8,
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  previewCardSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  previewCardXP: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  rarityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 12,
  },
  customizationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    fontFamily: 'Poppins',
  },
  customizationNameLocked: {
    color: '#999',
  },
  customizationDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  customizationDescriptionLocked: {
    color: '#999',
  },
  unlockRequirement: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 8,
    marginTop: 5,
  },
  unlockText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F9BB55',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    boxShadow: '0px 4px 8px rgba(249, 187, 85, 0.3)',
    elevation: 6,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  
  // Preview Banner Styles
  previewBannerContainer: {
    marginBottom: 30,
  },
  previewBannerHeader: {
    marginBottom: 15,
    alignItems: 'center',
  },
  previewBannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  previewBannerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  previewBanner: {
    width: '100%',
    height: 120,
    borderRadius: 20,
    padding: 20,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  previewBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  previewBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  previewAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewUserInfo: {
    flex: 1,
  },
  previewUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  previewUserClass: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  previewBannerImage: {
    width: 60,
    height: 30,
    marginTop: 5,
  },
  previewBannerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  previewBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  previewBannerRight: {
    alignItems: 'flex-end',
  },
  previewStats: {
    alignItems: 'center',
    marginBottom: 10,
  },
  previewScoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  previewScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewLevel: {
    alignItems: 'center',
  },
  previewLevelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  previewXPText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Customizations Container
  customizationsContainer: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: width > 768 ? 20 : 15,
    marginBottom: 30,
  },
  customizationSection: {
    flex: width > 768 ? 1 : undefined,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  customizationCardContent: {
    flex: 1,
  },
  customizationInfo: {
    flex: 1,
    marginTop: 10,
  },
});

export default CardCustomizationScreen;
