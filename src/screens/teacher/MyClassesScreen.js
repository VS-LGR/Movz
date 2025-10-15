import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import apiService from '../../services/apiService';
import SideMenu from '../../components/SideMenu';
import HamburgerButton from '../../components/HamburgerButton';
import useResponsive from '../../hooks/useResponsive';

const { width, height } = Dimensions.get('window');

const MyClassesScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    averageStudentsPerClass: 0
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadClasses();
  }, []);

  // Filtrar turmas quando searchText mudar
  useEffect(() => {
    filterClasses();
  }, [classes, searchText]);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      console.log('🔵 MyClassesScreen - Carregando turmas do professor...');
      console.log('🔵 MyClassesScreen - CurrentUser:', currentUser);
      
      const response = await apiService.getClasses();
      console.log('🔵 MyClassesScreen - Resposta da API:', response);
      
      if (response.success) {
        console.log('🔵 MyClassesScreen - Dados recebidos:', response.data);
        console.log('🔵 MyClassesScreen - Tipo dos dados:', typeof response.data);
        console.log('🔵 MyClassesScreen - É array?', Array.isArray(response.data));
        
        if (response.data && Array.isArray(response.data)) {
          console.log('🔵 MyClassesScreen - Processando cada turma:');
          response.data.forEach((classItem, index) => {
            console.log(`🔵 MyClassesScreen - Turma ${index}:`, {
              id: classItem?.id,
              name: classItem?.name,
              school: classItem?.school,
              grade: classItem?.grade,
              students: classItem?.students?.length || 0
            });
          });
          
          setClasses(response.data);
          calculateStats(response.data);
        } else {
          console.error('🔵 MyClassesScreen - Dados inválidos recebidos:', response.data);
          setClasses([]);
          calculateStats([]);
        }
      } else {
        console.error('🔵 MyClassesScreen - Erro na resposta:', response.message);
        Alert.alert('Erro', response.message || 'Erro ao carregar turmas');
      }
    } catch (error) {
      console.error('🔵 MyClassesScreen - Erro ao carregar turmas:', error);
      Alert.alert('Erro', 'Erro ao carregar turmas');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (classesData) => {
    if (!classesData || !Array.isArray(classesData)) {
      console.warn('🔵 MyClassesScreen - calculateStats recebeu dados inválidos:', classesData);
      setStats({
        totalClasses: 0,
        totalStudents: 0,
        averageStudentsPerClass: 0
      });
      return;
    }
    
    const totalClasses = classesData.length;
    const totalStudents = classesData.reduce((sum, classItem) => {
      if (!classItem) return sum;
      return sum + (classItem.students?.length || 0);
    }, 0);
    const averageStudentsPerClass = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
    
    setStats({
      totalClasses,
      totalStudents,
      averageStudentsPerClass
    });
  };

  const filterClasses = () => {
    if (!searchText.trim()) {
      setFilteredClasses(classes);
      return;
    }

    const filtered = classes.filter(classItem => {
      if (!classItem) {
        console.warn('🔵 MyClassesScreen - classItem é undefined:', classItem);
        return false;
      }
      
      return (
        (classItem.name && classItem.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (classItem.school && classItem.school.toLowerCase().includes(searchText.toLowerCase())) ||
        (classItem.grade && classItem.grade.toLowerCase().includes(searchText.toLowerCase()))
      );
    });
    
    setFilteredClasses(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const handleStartClass = (classItem) => {
    onNavigate('class', { classData: classItem });
  };

  const renderClassCard = (classItem) => {
    if (!classItem) {
      console.warn('🔵 MyClassesScreen - Tentando renderizar classItem undefined:', classItem);
      return null;
    }
    
    return (
      <View key={classItem.id} style={styles.classCard}>
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{classItem.name || 'Nome não disponível'}</Text>
            <Text style={styles.classDetails}>
              {classItem.school || 'Escola não informada'} - {classItem.grade || 'Série não informada'}
            </Text>
            {classItem.description && (
              <Text style={styles.classDescription}>{classItem.description}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.startClassButton}
            onPress={() => handleStartClass(classItem)}
          >
            <Text style={styles.startClassButtonText}>Iniciar Aula</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.studentsSection}>
          <Text style={styles.studentsTitle}>
            Alunos ({classItem.students?.length || 0})
          </Text>
          
          {classItem.students && classItem.students.length > 0 ? (
            <ScrollView 
              style={styles.studentsList} 
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {classItem.students.map((student, index) => {
                console.log(`🔵 MyClassesScreen - Processando estudante ${index}:`, student);
                
                // Verificar se student tem a estrutura esperada
                if (!student) {
                  console.warn(`🔵 MyClassesScreen - student ${index} é undefined`);
                  return null;
                }
                
                return (
                  <View key={student.id || index} style={styles.studentCard}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name || 'Nome não disponível'}</Text>
                      <Text style={styles.studentEmail}>{student.email || 'Email não disponível'}</Text>
                      {student.age && (
                        <Text style={styles.studentAge}>{student.age} anos</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.noStudentsText}>Nenhum aluno cadastrado</Text>
          )}
        </View>
      </View>
    );
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.totalClasses}</Text>
        <Text style={styles.statLabel}>Turmas</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.totalStudents}</Text>
        <Text style={styles.statLabel}>Alunos</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.averageStudentsPerClass}</Text>
        <Text style={styles.statLabel}>Média por Turma</Text>
      </View>
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
        userType="TEACHER"
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
            <Text style={styles.title}>Minhas Turmas</Text>
            <Text style={styles.subtitle}>Visualizar turmas e alunos</Text>
          </View>
          <HamburgerButton
            onPress={() => setIsMenuVisible(true)}
            style={styles.menuButton}
          />
        </View>

        {/* Estatísticas */}
        {renderStats()}

        {/* Barra de Pesquisa */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar turmas..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>

        {/* Lista de Turmas */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando turmas...</Text>
          </View>
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText ? 'Nenhuma turma encontrada' : 'Você ainda não possui turmas'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchText 
                ? 'Tente ajustar os termos de pesquisa' 
                : 'As turmas aparecerão aqui quando você for adicionado a elas pela instituição'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.classesList}>
            {filteredClasses.map(renderClassCard)}
          </View>
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9BB55',
    fontFamily: 'Poppins',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  classesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  classCard: {
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
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  classInfo: {
    flex: 1,
    marginRight: 10,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  classDescription: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
  startClassButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  startClassButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  studentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  studentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  studentsList: {
    maxHeight: 200,
  },
  studentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  studentAge: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'Poppins',
  },
  noStudentsText: {
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
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MyClassesScreen;
