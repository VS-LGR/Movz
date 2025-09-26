import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import apiService from '../../services/apiService';
import useResponsive from '../../hooks/useResponsive';

const { width, height } = Dimensions.get('window');

const ClassDetailsScreen = ({ classId, onBack, currentUser }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();

  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClassDetails();
  }, [classId]);

  const loadClassDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getInstitutionClassDetails(classId);
      if (response.success) {
        setClassData(response.data);
      } else {
        setError(response.message || 'Erro ao carregar dados da turma');
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da turma:', err);
      setError('Não foi possível carregar os dados da turma. Tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClassDetails();
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return '#4CAF50'; // Verde
    if (rate >= 70) return '#FF9800'; // Laranja
    if (rate >= 50) return '#FFC107'; // Amarelo
    return '#D9493C'; // Vermelho
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50'; // Verde
    if (score >= 70) return '#FF9800'; // Laranja
    if (score >= 50) return '#FFC107'; // Amarelo
    return '#D9493C'; // Vermelho
  };

  const renderHeader = () => {
    if (!classData) return null;

    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.className}>{classData.classInfo.name}</Text>
          <Text style={styles.classDetails}>
            {classData.classInfo.school} - {classData.classInfo.grade}
          </Text>
          <Text style={styles.teacherName}>
            Professor: {classData.classInfo.teacher.name}
          </Text>
        </View>
      </View>
    );
  };

  const renderStatistics = () => {
    if (!classData) return null;

    const { statistics } = classData;

    return (
      <View style={styles.statisticsContainer}>
        <Text style={styles.sectionTitle}>📊 Estatísticas da Turma</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.totalStudents}</Text>
            <Text style={styles.statLabel}>Alunos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.totalSessions}</Text>
            <Text style={styles.statLabel}>Aulas Realizadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#D9493C' }]}>
              {statistics.totalAbsences}
            </Text>
            <Text style={styles.statLabel}>Total de Faltas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: getScoreColor(statistics.averageScore) }]}>
              {statistics.averageScore}
            </Text>
            <Text style={styles.statLabel}>Média Geral</Text>
          </View>
        </View>

        <View style={styles.highlightStats}>
          <View style={styles.highlightCard}>
            <Text style={styles.highlightTitle}>🎯 Aluno com Mais Faltas</Text>
            <Text style={styles.highlightValue}>
              {statistics.studentWithMostAbsences}
            </Text>
            <Text style={styles.highlightSubtext}>
              {statistics.studentWithMostAbsencesCount} faltas
            </Text>
          </View>
          
          <View style={styles.highlightCard}>
            <Text style={styles.highlightTitle}>📈 Média de Presença</Text>
            <Text style={[styles.highlightValue, { color: getAttendanceColor(statistics.averageAttendanceRate) }]}>
              {statistics.averageAttendanceRate}%
            </Text>
            <Text style={styles.highlightSubtext}>
              Frequência da turma
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStudentsList = () => {
    if (!classData || !classData.students) return null;

    return (
      <View style={styles.studentsContainer}>
        <Text style={styles.sectionTitle}>👥 Alunos da Turma</Text>
        
        <View style={styles.studentsList}>
          {classData.students.map((student, index) => (
            <View key={student.studentId} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.studentName}</Text>
                <View style={styles.studentStats}>
                  <View style={styles.studentStatItem}>
                    <Text style={styles.studentStatLabel}>Presentes:</Text>
                    <Text style={[styles.studentStatValue, { color: '#4CAF50' }]}>
                      {student.presentCount}
                    </Text>
                  </View>
                  <View style={styles.studentStatItem}>
                    <Text style={styles.studentStatLabel}>Faltas:</Text>
                    <Text style={[styles.studentStatValue, { color: '#D9493C' }]}>
                      {student.absentCount}
                    </Text>
                  </View>
                  <View style={styles.studentStatItem}>
                    <Text style={styles.studentStatLabel}>Presença:</Text>
                    <Text style={[
                      styles.studentStatValue, 
                      { color: getAttendanceColor(student.attendanceRate) }
                    ]}>
                      {student.attendanceRate}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSportStats = () => {
    if (!classData || !classData.sportStats) return null;

    const sportEntries = Object.entries(classData.sportStats);

    if (sportEntries.length === 0) {
      return (
        <View style={styles.sportStatsContainer}>
          <Text style={styles.sectionTitle}>🏆 Estatísticas por Esporte</Text>
          <Text style={styles.emptyText}>Nenhuma pontuação registrada ainda</Text>
        </View>
      );
    }

    return (
      <View style={styles.sportStatsContainer}>
        <Text style={styles.sectionTitle}>🏆 Estatísticas por Esporte</Text>
        
        <View style={styles.sportStatsList}>
          {sportEntries.map(([sportName, stats]) => (
            <View key={sportName} style={styles.sportCard}>
              <Text style={styles.sportName}>{sportName}</Text>
              <View style={styles.sportStats}>
                <View style={styles.sportStatItem}>
                  <Text style={styles.sportStatLabel}>Média:</Text>
                  <Text style={[styles.sportStatValue, { color: getScoreColor(stats.averageScore) }]}>
                    {stats.averageScore}
                  </Text>
                </View>
                <View style={styles.sportStatItem}>
                  <Text style={styles.sportStatLabel}>Alunos:</Text>
                  <Text style={styles.sportStatValue}>{stats.totalStudents}</Text>
                </View>
                <View style={styles.sportStatItem}>
                  <Text style={styles.sportStatLabel}>Avaliações:</Text>
                  <Text style={styles.sportStatValue}>{stats.totalScores}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRecentSessions = () => {
    if (!classData || !classData.recentSessions) return null;

    return (
      <View style={styles.sessionsContainer}>
        <Text style={styles.sectionTitle}>📅 Aulas Recentes</Text>
        
        {classData.recentSessions.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma aula realizada ainda</Text>
        ) : (
          <View style={styles.sessionsList}>
            {classData.recentSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>
                    {new Date(session.date).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                </View>
                <View style={[
                  styles.sessionStatus,
                  { backgroundColor: session.isCompleted ? '#4CAF50' : '#FF9800' }
                ]}>
                  <Text style={styles.sessionStatusText}>
                    {session.isCompleted ? 'Concluída' : 'Pendente'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F9BB55" />
          <Text style={styles.loadingText}>Carregando dados da turma...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadClassDetails}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F9BB55']} />
        }
      >
        {renderHeader()}
        {renderStatistics()}
        {renderStudentsList()}
        {renderSportStats()}
        {renderRecentSessions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  // Header
  header: {
    backgroundColor: '#F9BB55',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  headerContent: {
    alignItems: 'center',
  },
  className: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  classDetails: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  teacherName: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Poppins',
  },
  // Statistics
  statisticsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  highlightStats: {
    gap: 15,
  },
  highlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  highlightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  highlightSubtext: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  // Students
  studentsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  studentsList: {
    gap: 12,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studentStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  studentStatLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  studentStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  // Sport Stats
  sportStatsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sportStatsList: {
    gap: 12,
  },
  sportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  sportName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 15,
  },
  sportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sportStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  sportStatLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  sportStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  // Sessions
  sessionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  sessionSubject: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  sessionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sessionStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
});

export default ClassDetailsScreen;
