import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import SideMenu from './SideMenu';

const { width, height } = Dimensions.get('window');

const RankingScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser }) => {
  const rankingData = [
    { position: 1, name: 'Nome do Aluno', hasGradient: true, gradientType: 'gold' },
    { position: 2, name: 'Nome do Aluno', hasGradient: true, gradientType: 'blue' },
    { position: 3, name: 'Nome do Aluno', hasGradient: true, gradientType: 'orange' },
    { position: 4, name: 'Nome do Aluno', hasGradient: false },
    { position: 5, name: 'Nome do Aluno', hasGradient: false },
    { position: 6, name: 'Nome do Aluno', hasGradient: false },
    { position: 7, name: 'Nome do Aluno', hasGradient: false },
    { position: 8, name: 'Nome do Aluno', hasGradient: false },
    { position: 9, name: 'Nome do Aluno', hasGradient: false },
    { position: 10, name: 'Nome do Aluno', hasGradient: false },
  ];

  const topPerformers = [
    { size: 'small', color: '#D9D9D9' },
    { size: 'small', color: '#D9D9D9' },
    { size: 'large', color: '#B5B5B5' },
    { size: 'small', color: '#F0F0F0' },
  ];

  const getGradientStyle = (gradientType) => {
    switch (gradientType) {
      case 'gold':
        return {
          backgroundColor: '#F9BB55',
          shadowColor: '#F19341',
        };
      case 'blue':
        return {
          backgroundColor: '#D3E6EB',
          shadowColor: '#ACACAC',
        };
      case 'orange':
        return {
          backgroundColor: '#FFCF91',
          shadowColor: '#E5B373',
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          shadowColor: '#000000',
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

        {/* Title */}
        <Text style={styles.title}>Seu ranking dessa semana</Text>

        {/* Top Performers Section */}
        <View style={styles.topPerformersContainer}>
          {topPerformers.map((performer, index) => (
            <View
              key={index}
              style={[
                styles.performerCircle,
                {
                  width: performer.size === 'large' ? 81 : 55,
                  height: performer.size === 'large' ? 81 : 55,
                  backgroundColor: performer.color,
                },
              ]}
            />
          ))}
        </View>

        <Text style={styles.categoryText}>Nome Categoria</Text>

        {/* Ranking List */}
        <View style={styles.rankingList}>
          {rankingData.map((item, index) => (
            <View
              key={index}
              style={[
                styles.rankingItem,
                item.hasGradient && getGradientStyle(item.gradientType),
              ]}
            >
              <Text style={styles.positionText}>{item.position}</Text>
              <View style={styles.avatar} />
              <Text style={styles.studentName}>{item.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Side Menu */}
      <SideMenu 
        isVisible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)}
        onNavigate={onNavigate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDEE',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins',
  },
  topPerformersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  performerCircle: {
    borderRadius: 50,
    marginHorizontal: 10,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins',
  },
  rankingList: {
    paddingBottom: 20,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 11.4,
    elevation: 8,
  },
  positionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    width: 30,
    fontFamily: 'Poppins',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 15,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    fontFamily: 'Poppins',
  },
});

export default RankingScreen;
