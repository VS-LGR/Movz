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
  ActivityIndicator,
} from 'react-native';
import SideMenu from '../../components/SideMenu';
import apiService from '../../services/apiService';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [sportsScores, setSportsScores] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar pontuações dos esportes
      const scoresResponse = await apiService.getStudentSportsScores();
      if (scoresResponse.success) {
        // Pegar os top 3 esportes com melhor pontuação
        const topSports = scoresResponse.data
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 3)
          .map(sport => ({
            score: sport.averageScore.toString(),
            label: sport.sport.name,
            sportId: sport.sport.id
          }));
        setSportsScores(topSports);
      }

      // Buscar dados de presença
      const attendanceResponse = await apiService.getStudentAttendance();
      if (attendanceResponse.success) {
        setAttendanceData(attendanceResponse.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceDays = () => {
    if (!attendanceData || !attendanceData.recentAttendance) {
      return [
        { day: 'seg', present: false },
        { day: 'ter', present: false },
        { day: 'qua', present: false },
        { day: 'qui', present: false },
        { day: 'sex', present: false },
      ];
    }

    // Converter dados de presença para formato de dias da semana
    const days = ['seg', 'ter', 'qua', 'qui', 'sex'];
    return days.map((day, index) => {
      const attendanceRecord = attendanceData.recentAttendance[index];
      return {
        day,
        present: attendanceRecord ? attendanceRecord.isPresent : false
      };
    });
  };

  const medals = [
    { month: 'Março', image: require('../../assets/images/Medalha_2.svg') },
    { month: 'Abril', image: require('../../assets/images/Medalha_4.svg') },
    { month: 'Maio', image: require('../../assets/images/Medalha_5.svg') },
  ];

  const achievements = [
    { month: 'Março', image: require('../../assets/images/aiAtivo 5medals.svg') },
    { month: 'Abril', image: require('../../assets/images/aiAtivo 9medals.svg') },
    { month: 'Maio', image: require('../../assets/images/aiAtivo 10medals.svg') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Movz</Text>
          <View style={styles.headerRight}>
            {currentUser && (
              <Text style={styles.welcomeText}>Olá, {currentUser.name}!</Text>
            )}
            <TouchableOpacity 
              style={styles.menuIcon} 
              onPress={() => setIsMenuVisible(true)}
            >
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </TouchableOpacity>
          </View>
        </View>

        {/* XP Progress Section */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpTitle}>Seu XP até agora</Text>
            <Text style={styles.xpValue}>2.500</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground} />
            <View style={styles.progressBarFill} />
          </View>
        </View>

        {/* Sports Score Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sua pontuação nos Esportes</Text>
          <View style={styles.sportsContainer}>
            {sportsScores.map((sport, index) => (
              <View key={index} style={styles.sportCard}>
                <View style={styles.scoreCardContainer}>
                  <Image 
                    source={require('../../assets/images/CardScores.svg')} 
                    style={styles.scoreCardBackground}
                    resizeMode="contain"
                  />
                  <View style={styles.scoreTextContainer}>
                    <Text style={styles.sportScore}>{sport.score}</Text>
                    <Text style={styles.sportLabel}>{sport.label}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.seeMoreButton}
            onPress={() => onNavigate('studentScores')}
          >
            <Text style={styles.seeMoreText}>Ver Mais</Text>
          </TouchableOpacity>
        </View>

        {/* Attendance Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Presença nas aulas</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F9BB55" />
              <Text style={styles.loadingText}>Carregando dados...</Text>
            </View>
          ) : (
            <>
              <View style={styles.attendanceContainer}>
                {getAttendanceDays().map((day, index) => (
                  <View key={index} style={styles.dayContainer}>
                    <View style={[styles.dayCircle, day.present && styles.dayCirclePresent]}>
                      {day.present && (
                        <View style={styles.checkmark}>
                          <View style={styles.checkmarkOuter} />
                          <View style={styles.checkmarkInner} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.dayLabel}>{day.day}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.attendanceStreak}>
                {attendanceData ? (
                  `Taxa de presença: ${attendanceData.attendanceRate}% • Sequência: ${attendanceData.streak} aulas`
                ) : (
                  'Carregando dados de presença...'
                )}
              </Text>
            </>
          )}
        </View>

        {/* Medals Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Suas medalhas</Text>
          <View style={styles.medalBannerContainer}>
            <Image source={require('../../assets/images/FundoMedalhas.svg')} style={styles.medalBannerBackground} resizeMode="cover" />
            <View style={styles.medalBanner}>
              {medals.map((medal, index) => (
                <View key={index} style={styles.medalContainer}>
                  <Image source={medal.image} style={styles.medalIcon} resizeMode="contain" />
                  <Text style={styles.medalMonth}>{medal.month}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.seeMoreButton}
            onPress={() => onNavigate('medals')}
          >
            <Text style={styles.seeMoreText}>Ver mais</Text>
          </TouchableOpacity>
        </View>

        {/* Achievements Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Suas conquistas</Text>
          <View style={styles.medalBannerContainer}>
            <Image source={require('../../assets/images/FundoMedalhas.svg')} style={styles.medalBannerBackground} resizeMode="cover" />
            <View style={styles.medalBanner}>
              {achievements.map((achievement, index) => (
                <View key={index} style={styles.medalContainer}>
                  <Image source={achievement.image} style={styles.medalIcon} resizeMode="contain" />
                  <Text style={styles.medalMonth}>{achievement.month}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.seeMoreButton}
            onPress={() => onNavigate('achievements')}
          >
            <Text style={styles.seeMoreText}>Ver mais</Text>
          </TouchableOpacity>
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
    backgroundColor: '#E9EEEE',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#000',
    marginRight: 15,
    fontFamily: 'Poppins',
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
  xpSection: {
    marginBottom: 20,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  xpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111426',
    fontFamily: 'Poppins',
  },
  xpValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111426',
    fontFamily: 'Poppins',
  },
  progressBarContainer: {
    position: 'relative',
    height: 12,
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#0B3850',
    borderRadius: 6,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '44%', // 133/304 * 100
    height: 12,
    backgroundColor: '#2ED4CC',
    borderRadius: 6,
    boxShadow: '0px 0px 12.3px 0px rgba(255, 255, 255, 0.32)',
    elevation: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111426',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  seeMoreButton: {
    alignItems: 'center',
  },
  seeMoreText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins',
  },
  sportsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sportCard: {
    alignItems: 'center',
  },
  scoreCardContainer: {
    width: 69, // Largura original do chevron
    height: 92, // Altura original do chevron
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  scoreCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 69,
    height: 92,
  },
  scoreTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  sportScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#392B2B',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 2,
  },
  sportLabel: {
    fontSize: 10,
    color: '#392B2B',
    fontWeight: '500',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  attendanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#D94A3C',
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCirclePresent: {
    backgroundColor: '#D94A3C',
  },
  checkmark: {
    position: 'absolute',
    width: 7,
    height: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkOuter: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  checkmarkInner: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  dayLabel: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Poppins',
  },
  attendanceStreak: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontFamily: 'Poppins',
  },
  medalBannerContainer: {
    position: 'relative',
    height: 82.18, // Altura exata do Figma
    marginTop: -10, // Sobe a faixa para centralizar as medalhas
    marginBottom: 15,
    marginHorizontal: -48, // Margin negativo para abraçar o card branco
    overflow: 'hidden',
  },
  medalBannerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%', // 100% para cobrir toda a largura
    height: '100%', // 100% para cobrir toda a altura
    resizeMode: 'stretch', // Estica para cobrir toda a largura
    // Configurações exatas do Figma
    opacity: 1, // 100% opacity
    borderRadius: 0, // Corner radius 0
  },
  medalBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribui as medalhas com espaçamento igual
    alignItems: 'center',
    paddingVertical: 30, // Aumentado para centralizar melhor as medalhas na faixa
    paddingHorizontal: 68, // Padding ajustado para compensar o margin negativo de -48
  },
  medalContainer: {
    alignItems: 'center',
    width: 39, // Largura exata do container (Group 4)
    height: 59, // Altura exata do container (Group 4)
  },
  medalIcon: {
    width: 39, // Tamanho exato do Figma (Ellipse 23)
    height: 39, // Tamanho exato do Figma (Ellipse 23)
    marginBottom: 5, // Espaçamento para o texto (719 + 39 + 5 = 763, posição do texto)
    borderRadius: 19.5, // Círculo perfeito (39/2)
    borderWidth: 1, // strokeWeight: 1
    borderColor: '#0B384E', // Cor exata do Figma (r: 0.043, g: 0.220, b: 0.306)
    // Drop shadow exato do Figma: radius: 8, offset: (0,0), opacity: 0.4, spread: 0
    boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.4)',
    elevation: 8, // Para Android
    backgroundColor: 'transparent', // Remove background to show SVG
  },
  medalMonth: {
    width: 32, // Largura exata do Figma (texto "Março")
    height: 15, // Altura exata do Figma (texto "Março")
    fontSize: 10, // Reduzido para evitar quebra de linha
    color: '#000000', // Cor exata do Figma (r: 0, g: 0, b: 0)
    fontWeight: '500',
    textAlign: 'center',
    numberOfLines: 1, // Força uma linha apenas
    fontFamily: 'Poppins',
  },
});

export default HomeScreen;
