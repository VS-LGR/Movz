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
  Image,
} from 'react-native';
import apiService from '../../services/apiService';
import SideMenu from '../../components/SideMenu';
import HamburgerButton from '../../components/HamburgerButton';
import useResponsive from '../../hooks/useResponsive';

const MyClassScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  const [classData, setClassData] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadClassData();
  }, []);

  const loadClassData = async () => {
    try {
      setIsLoading(true);
      console.log('🔵 Carregando dados da turma do aluno...');
      
      const response = await apiService.getStudentClass();
      console.log('🔵 Resposta da turma:', response);
      
      if (response.success) {
        if (response.data) {
          setClassData(response.data.class);
          setTeacher(response.data.teacher);
          setClassmates(response.data.classmates || []);
        } else {
          setClassData(null);
          setTeacher(null);
          setClassmates([]);
        }
      } else {
        Alert.alert('Erro', response.message || 'Erro ao carregar dados da turma');
      }
    } catch (error) {
      console.error('Erro ao carregar dados da turma:', error);
      Alert.alert('Erro', 'Erro ao carregar dados da turma');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClassData();
    setRefreshing(false);
  };

  const renderTeacherCard = () => (
    <View style={styles.teacherCard}>
      <Text style={styles.sectionTitle}>Professor</Text>
      <View style={styles.teacherInfo}>
        <View style={styles.teacherAvatar}>
          <Text style={styles.teacherInitial}>
            {teacher?.name?.charAt(0)?.toUpperCase() || 'P'}
          </Text>
        </View>
        <View style={styles.teacherDetails}>
          <Text style={styles.teacherName}>{teacher?.name || 'Nome não disponível'}</Text>
          <Text style={styles.teacherEmail}>{teacher?.email || 'Email não disponível'}</Text>
        </View>
      </View>
    </View>
  );

  const renderClassmatesCard = () => (
    <View style={styles.classmatesCard}>
      <Text style={styles.sectionTitle}>
        Colegas de Turma ({classmates.length})
      </Text>
      
      {classmates.length > 0 ? (
        <ScrollView 
          style={styles.classmatesList} 
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {classmates.map((classmate) => (
            <View key={classmate.id} style={styles.classmateCard}>
              <View style={styles.classmateAvatar}>
                <Text style={styles.classmateInitial}>
                  {classmate.name?.charAt(0)?.toUpperCase() || 'A'}
                </Text>
              </View>
              <View style={styles.classmateInfo}>
                <Text style={styles.classmateName}>{classmate.name}</Text>
                <Text style={styles.classmateEmail}>{classmate.email}</Text>
                {classmate.age && (
                  <Text style={styles.classmateAge}>{classmate.age} anos</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noClassmatesText}>Nenhum colega cadastrado</Text>
      )}
    </View>
  );

  const renderClassInfo = () => (
    <View style={styles.classInfoCard}>
      <Text style={styles.sectionTitle}>Informações da Turma</Text>
      <View style={styles.classDetails}>
        <Text style={styles.className}>{classData?.name || 'Nome não disponível'}</Text>
        <Text style={styles.classSchool}>{classData?.school || 'Escola não informada'}</Text>
        <Text style={styles.classGrade}>{classData?.grade || 'Série não informada'}</Text>
        {classData?.description && (
          <Text style={styles.classDescription}>{classData.description}</Text>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Você não está em nenhuma turma</Text>
      <Text style={styles.emptySubtitle}>
        Entre em contato com sua instituição para ser adicionado a uma turma
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={loadClassData}
      >
        <Image 
          source={require('../../assets/images/Refresh.svg')}
          style={styles.refreshIcon}
          resizeMode="contain"
        />
        <Text style={styles.refreshButtonText}>Tentar Novamente</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        userType="STUDENT"
      />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Minha Turma</Text>
          </View>
          <HamburgerButton
            onPress={() => setIsMenuVisible(true)}
            style={styles.menuButton}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando dados da turma...</Text>
          </View>
        ) : classData ? (
          <View style={styles.contentContainer}>
            {renderClassInfo()}
            {renderTeacherCard()}
            {renderClassmatesCard()}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EDED',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
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
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  classInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 15,
  },
  classDetails: {
    gap: 8,
  },
  className: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9BB55',
    fontFamily: 'Poppins',
  },
  classSchool: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  classGrade: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Poppins',
  },
  classDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
    marginTop: 8,
  },
  teacherCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F9BB55',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  teacherInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  classmatesCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classmatesList: {
    maxHeight: 300,
  },
  classmateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  classmateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classmateInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: 'Poppins',
  },
  classmateInfo: {
    flex: 1,
  },
  classmateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  classmateEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  classmateAge: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins',
  },
  noClassmatesText: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  refreshIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
});

export default MyClassScreen;
