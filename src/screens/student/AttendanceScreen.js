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
import { getCachedImage } from '../../utils/imageCache';
import Storage from '../../utils/storage';
import useResponsive from '../../hooks/useResponsive';

const { width, height } = Dimensions.get('window');

const AttendanceScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();

  // Função para formatar data corretamente
  const formatDate = (date) => {
    if (typeof date === 'string') {
      // Converter string YYYY-MM-DD para formato brasileiro DD/MM/YYYY
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    } else if (date instanceof Date) {
      // Fallback para objetos Date
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return 'Data inválida';
  };

  const [attendanceData, setAttendanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
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
      
      console.log('🔵 StudentAttendance - Carregando dados de presença...');
      const response = await apiService.getStudentAttendance();
      console.log('🔵 StudentAttendance - Resposta da API:', response);
      
      if (response.success) {
        console.log('🔵 StudentAttendance - Dados recebidos:', response.data);
        console.log('🔵 StudentAttendance - Total de aulas:', response.data.totalClasses);
        console.log('🔵 StudentAttendance - Presentes:', response.data.presentClasses);
        console.log('🔵 StudentAttendance - Faltas:', response.data.absentClasses);
        console.log('🔵 StudentAttendance - Histórico:', response.data.recentAttendance?.length || 0, 'registros');
        
        setAttendanceData(response.data);
      } else {
        console.error('🔴 StudentAttendance - Erro na resposta:', response.message);
        setError(response.message || 'Erro ao carregar dados de presença');
      }
    } catch (err) {
      console.error('🔴 StudentAttendance - Erro ao carregar presenças:', err);
      setError('Não foi possível carregar suas presenças. Tente novamente.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendanceData();
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return '#4CAF50'; // Verde
    if (rate >= 70) return '#FF9800'; // Laranja
    if (rate >= 50) return '#FFC107'; // Amarelo
    return '#D9493C'; // Vermelho
  };

  const getAttendanceLabel = (rate) => {
    if (rate >= 90) return 'Excelente';
    if (rate >= 70) return 'Bom';
    if (rate >= 50) return 'Regular';
    return 'Precisa Melhorar';
  };

  const renderAttendanceStats = () => {
    if (!attendanceData) return null;

    return (
      <View style={styles.statsContainer}>
        {/* Card Principal de Presença */}
        <View style={styles.mainStatsCard}>
          <View style={styles.mainStatsHeader}>
            <Text style={styles.mainStatsTitle}>📊 Sua Presença</Text>
            <View style={[styles.attendanceBadge, { backgroundColor: getAttendanceColor(attendanceData.attendanceRate) }]}>
              <Text style={styles.attendanceRate}>{attendanceData.attendanceRate}%</Text>
            </View>
          </View>
          
          <View style={styles.mainStatsContent}>
            <Text style={styles.attendanceLabel}>{getAttendanceLabel(attendanceData.attendanceRate)}</Text>
            <Text style={styles.attendanceSubtext}>Taxa de Presença</Text>
          </View>

          <View style={styles.mainStatsDetails}>
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatNumber}>{attendanceData.presentClasses}</Text>
              <Text style={styles.mainStatLabel}>Presentes</Text>
            </View>
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatNumber}>{attendanceData.absentClasses}</Text>
              <Text style={styles.mainStatLabel}>Faltas</Text>
            </View>
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatNumber}>{attendanceData.totalClasses}</Text>
              <Text style={styles.mainStatLabel}>Total</Text>
            </View>
          </View>

          {attendanceData.streak > 0 && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakLabel}>🔥 Sequência atual:</Text>
              <Text style={styles.streakNumber}>{attendanceData.streak} aulas</Text>
            </View>
          )}
        </View>

        {/* Cards de Estatísticas Detalhadas */}
        <View style={styles.detailedStats}>
          <View style={styles.detailedStatCard}>
            <Text style={styles.detailedStatIcon}>✅</Text>
            <Text style={styles.detailedStatNumber}>{attendanceData.presentClasses}</Text>
            <Text style={styles.detailedStatLabel}>Aulas Presentes</Text>
          </View>
          <View style={styles.detailedStatCard}>
            <Text style={styles.detailedStatIcon}>❌</Text>
            <Text style={styles.detailedStatNumber}>{attendanceData.absentClasses}</Text>
            <Text style={styles.detailedStatLabel}>Aulas Faltadas</Text>
          </View>
          <View style={styles.detailedStatCard}>
            <Text style={styles.detailedStatIcon}>📚</Text>
            <Text style={styles.detailedStatNumber}>{attendanceData.totalClasses}</Text>
            <Text style={styles.detailedStatLabel}>Total de Aulas</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderClassInfo = () => {
    if (!attendanceData?.classInfo) return null;

    return (
      <View style={styles.classInfoCard}>
        <Text style={styles.classInfoTitle}>📚 Informações da Turma</Text>
        <View style={styles.classInfoContent}>
          <View style={styles.classInfoItem}>
            <Text style={styles.classInfoLabel}>Turma:</Text>
            <Text style={styles.classInfoValue}>{attendanceData.classInfo.name}</Text>
          </View>
          <View style={styles.classInfoItem}>
            <Text style={styles.classInfoLabel}>Escola:</Text>
            <Text style={styles.classInfoValue}>{attendanceData.classInfo.school}</Text>
          </View>
          <View style={styles.classInfoItem}>
            <Text style={styles.classInfoLabel}>Série:</Text>
            <Text style={styles.classInfoValue}>{attendanceData.classInfo.grade}</Text>
          </View>
          <View style={styles.classInfoItem}>
            <Text style={styles.classInfoLabel}>Professor:</Text>
            <Text style={styles.classInfoValue}>{attendanceData.classInfo.teacher}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentAttendance = () => {
    if (!attendanceData?.recentAttendance || attendanceData.recentAttendance.length === 0) {
      return (
        <View style={styles.emptyAttendanceContainer}>
          <Text style={styles.emptyAttendanceIcon}>📅</Text>
          <Text style={styles.emptyAttendanceText}>Nenhuma aula registrada ainda</Text>
          <Text style={styles.emptyAttendanceSubtext}>
            Suas presenças e faltas aparecerão aqui conforme as aulas forem realizadas
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.recentAttendanceContainer}>
        <Text style={styles.recentAttendanceTitle}>📅 Histórico de Presenças</Text>
        <View style={styles.attendanceList}>
          {attendanceData.recentAttendance.map((attendance, index) => (
            <View key={index} style={styles.attendanceItem}>
              <View style={styles.attendanceItemLeft}>
                <View style={[
                  styles.attendanceStatusIcon,
                  { backgroundColor: attendance.isPresent ? '#4CAF50' : '#D9493C' }
                ]}>
                  <Text style={styles.attendanceStatusText}>
                    {attendance.isPresent ? '✓' : '✗'}
                  </Text>
                </View>
                <View style={styles.attendanceItemInfo}>
                  <Text style={styles.attendanceDate}>
                    {formatDate(attendance.date)}
                  </Text>
                  <Text style={styles.attendanceSubject}>{attendance.classSubject}</Text>
                  <Text style={styles.attendanceTeacher}>Prof. {attendance.teacherName}</Text>
                </View>
              </View>
              <View style={styles.attendanceItemRight}>
                <Text style={[
                  styles.attendanceStatusLabel,
                  { color: attendance.isPresent ? '#4CAF50' : '#D9493C' }
                ]}>
                  {attendance.isPresent ? 'Presente' : 'Faltou'}
                </Text>
              </View>
            </View>
          ))}
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => onNavigate('home')}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Image
                source={getCachedImage('Attendance Icon', 'icon')}
                style={styles.titleIcon}
                resizeMode="contain"
              />
              <Text style={styles.title}>Presenças</Text>
            </View>
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
            <TouchableOpacity style={styles.retryButton} onPress={loadAttendanceData}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Estatísticas */}
            {renderAttendanceStats()}

            {/* Informações da Turma */}
            {renderClassInfo()}

            {/* Histórico de Presenças */}
            {renderRecentAttendance()}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  debugInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
    color: '#000',
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
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
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
  content: {
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginBottom: 25,
  },
  // Card Principal de Presença
  mainStatsCard: {
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
  },
  mainStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainStatsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
  },
  attendanceBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  attendanceRate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  mainStatsContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  attendanceLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  attendanceSubtext: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  mainStatsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  mainStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  mainStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2FD4CD',
    fontFamily: 'Poppins',
  },
  mainStatLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 4,
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9BB55',
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
  // Informações da Turma
  classInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  classInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 15,
  },
  classInfoContent: {
    gap: 10,
  },
  classInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  classInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#364859',
    fontFamily: 'Poppins',
  },
  // Histórico de Presenças
  recentAttendanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  recentAttendanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 15,
  },
  attendanceList: {
    gap: 12,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
  },
  attendanceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attendanceStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  attendanceStatusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  attendanceItemInfo: {
    flex: 1,
  },
  attendanceDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  attendanceSubject: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  attendanceTeacher: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins',
  },
  attendanceItemRight: {
    alignItems: 'flex-end',
  },
  attendanceStatusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  // Estado Vazio
  emptyAttendanceContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyAttendanceIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyAttendanceText: {
    fontSize: 20,
    color: '#364859',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  emptyAttendanceSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins',
    lineHeight: 24,
  },
});

export default AttendanceScreen;
