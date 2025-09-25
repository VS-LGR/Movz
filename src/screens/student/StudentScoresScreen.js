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
} from 'react-native';
import apiService from '../../services/apiService';
import SideMenu from '../../components/SideMenu';
import HamburgerButton from '../../components/HamburgerButton';
import useResponsive from '../../hooks/useResponsive';

const { width, height } = Dimensions.get('window');

const StudentScoresScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();

  const [sportsData, setSportsData] = useState([]);
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
      const response = await apiService.getStudentSportsScores();
      if (response.success) {
        setSportsData(response.data);
      } else {
        setError(response.message || 'Erro ao carregar pontuações');
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
    return '#F44336'; // Vermelho
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Bom';
    if (score >= 50) return 'Regular';
    return 'Precisa Melhorar';
  };

  const renderSportCard = (sportData) => (
    <View key={sportData.sport.id} style={styles.sportCard}>
      <View style={styles.sportHeader}>
        <View style={styles.sportInfo}>
          <Text style={styles.sportName}>{sportData.sport.name}</Text>
          <Text style={styles.sportStats}>
            {sportData.totalClasses} aula(s) • Média: {sportData.averageScore}pts
          </Text>
        </View>
        <View style={[styles.totalScoreBadge, { backgroundColor: getScoreColor(sportData.averageScore) }]}>
          <Text style={styles.totalScoreText}>{sportData.totalScore}</Text>
          <Text style={styles.totalScoreLabel}>Total</Text>
        </View>
      </View>

      {sportData.scores.length > 0 ? (
        <View style={styles.scoresList}>
          <Text style={styles.scoresTitle}>Histórico de Aulas:</Text>
          {sportData.scores.map((score, index) => (
            <View key={score.id} style={styles.scoreItem}>
              <View style={styles.scoreInfo}>
                <Text style={styles.className}>{score.class.name}</Text>
                <Text style={styles.classDetails}>
                  {score.class.school} - {score.class.grade}
                </Text>
                <Text style={styles.teacherName}>Prof. {score.teacher.name}</Text>
                {score.notes && (
                  <Text style={styles.scoreNotes}>"{score.notes}"</Text>
                )}
              </View>
              <View style={styles.scoreValue}>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score.score) }]}>
                  <Text style={styles.scoreNumber}>{score.score}</Text>
                </View>
                <Text style={[styles.scoreLabel, { color: getScoreColor(score.score) }]}>
                  {getScoreLabel(score.score)}
                </Text>
                <Text style={styles.scoreDate}>
                  {new Date(score.createdAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noScoresContainer}>
          <Text style={styles.noScoresText}>
            Nenhuma pontuação registrada para este esporte ainda.
          </Text>
        </View>
      )}
    </View>
  );

  const renderStats = () => {
    const totalSports = sportsData.length;
    const totalClasses = sportsData.reduce((sum, sport) => sum + sport.totalClasses, 0);
    const averageScore = sportsData.length > 0 
      ? Math.round(sportsData.reduce((sum, sport) => sum + sport.averageScore, 0) / sportsData.length)
      : 0;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalSports}</Text>
          <Text style={styles.statLabel}>Esportes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalClasses}</Text>
          <Text style={styles.statLabel}>Aulas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{averageScore}</Text>
          <Text style={styles.statLabel}>Média Geral</Text>
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
            <Text style={styles.title}>Minhas Pontuações</Text>
            <Text style={styles.subtitle}>Acompanhe seu desempenho nos esportes</Text>
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
            <Text style={styles.emptyStateText}>
              Você ainda não possui pontuações registradas.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Participe das aulas para começar a acumular pontos!
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
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins',
  },
  retryButton: {
    backgroundColor: '#364859',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
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
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  content: {
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    gap: 15,
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 5,
  },
  sportsList: {
    gap: 15,
  },
  sportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  sportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sportInfo: {
    flex: 1,
  },
  sportName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  sportStats: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  totalScoreBadge: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 60,
  },
  totalScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  totalScoreLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  scoresList: {
    marginTop: 10,
  },
  scoresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  scoreInfo: {
    flex: 1,
    marginRight: 15,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  classDetails: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  scoreNotes: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
  scoreValue: {
    alignItems: 'center',
  },
  scoreBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  scoreDate: {
    fontSize: 9,
    color: '#888',
    fontFamily: 'Poppins',
  },
  noScoresContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noScoresText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
});

export default StudentScoresScreen;
