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
} from 'react-native';
import SideMenu from '../../components/SideMenu';
import HamburgerButton from '../../components/HamburgerButton';
import apiService from '../../services/apiService';
import useResponsive from '../../hooks/useResponsive';

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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>🏆 Ranking</Text>
        <Text style={styles.subtitle}>Classificação da sua turma</Text>
        {rankingData && (
          <Text style={styles.classInfo}>
            📚 {rankingData.classInfo.name} - {rankingData.classInfo.grade}
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
                <Text style={styles.topThreeName}>{student.studentName}</Text>
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
        <Text style={styles.rankingTitle}>📊 Classificação Completa</Text>
        <View style={styles.rankingList}>
          {rankingData.ranking.map((student, index) => {
            const isCurrentStudent = student.studentId === rankingData.currentStudentId;
            
            return (
              <View
                key={student.studentId}
                style={[
                  styles.rankingItem,
                  isCurrentStudent && styles.currentStudentItem
                ]}
              >
                <View style={styles.rankingPosition}>
                  <Text style={[
                    styles.positionText,
                    { color: getPositionColor(student.position) }
                  ]}>
                    {getPositionIcon(student.position)}
                  </Text>
                </View>
                
                <View style={styles.studentInfo}>
                  <Text style={[
                    styles.studentName,
                    isCurrentStudent && styles.currentStudentName
                  ]}>
                    {student.studentName}
                    {isCurrentStudent && ' (Você)'}
                  </Text>
                  <Text style={styles.studentEmail}>{student.studentEmail}</Text>
                </View>
                
                <View style={styles.scoreInfo}>
                  <Text style={styles.totalScore}>{student.totalScore}</Text>
                  <Text style={styles.scoreLabel}>pontos</Text>
                  <Text style={styles.classesCount}>{student.totalClasses} aulas</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>🏆</Text>
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
    fontSize: 60,
    marginBottom: 20,
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
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
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
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
    fontFamily: 'Poppins',
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