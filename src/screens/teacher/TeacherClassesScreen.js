import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import apiService from '../../services/apiService';
import SideMenu from '../../components/SideMenu';
import CustomModal from '../../components/CustomModal';

const { width, height } = Dimensions.get('window');

const TeacherClassesScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  // Carregar aulas do professor
  useEffect(() => {
    loadClasses();
  }, []);

  // Recarregar aulas quando voltar da tela de aula
  useEffect(() => {
    const handleFocus = () => {
      loadClasses();
    };

    // Simular evento de foco (em uma aplicação real usaria useFocusEffect do React Navigation)
    const interval = setInterval(() => {
      // Verificar se há mudanças nos parâmetros de navegação
      if (window.navigationParams && window.navigationParams.classCompleted) {
        loadClasses();
        // Limpar o parâmetro para evitar recarregamentos desnecessários
        window.navigationParams.classCompleted = false;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Filtrar aulas quando searchText ou selectedFilter mudar
  useEffect(() => {
    filterClasses();
  }, [classes, searchText, selectedFilter]);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTeacherClasses();
      
      if (response.success) {
        // Converter objeto para array e ordenar por data
        const classesArray = Object.entries(response.data).map(([date, classData]) => ({
          id: classData.id,
          classId: classData.classId, // ID da turma associada
          date: new Date(date),
          school: classData.school,
          grade: classData.grade,
          subject: classData.subject,
          time: classData.time,
          notes: classData.notes,
          isCompleted: classData.isCompleted
        })).sort((a, b) => a.date - b.date);
        
        setClasses(classesArray);
      }
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as aulas');
    } finally {
      setIsLoading(false);
    }
  };

  const filterClasses = () => {
    let filtered = classes;

    // Filtrar por texto de busca
    if (searchText.trim()) {
      filtered = filtered.filter(cls => 
        cls.school.toLowerCase().includes(searchText.toLowerCase()) ||
        cls.grade.toLowerCase().includes(searchText.toLowerCase()) ||
        (cls.subject && cls.subject.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // Filtrar por tipo
    switch (selectedFilter) {
      case 'completed':
        filtered = filtered.filter(cls => cls.isCompleted);
        break;
      case 'pending':
        filtered = filtered.filter(cls => !cls.isCompleted);
        break;
      case 'today':
        const today = new Date();
        filtered = filtered.filter(cls => 
          cls.date.toDateString() === today.toDateString()
        );
        break;
      case 'thisWeek':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        filtered = filtered.filter(cls => 
          cls.date >= startOfWeek && cls.date <= endOfWeek
        );
        break;
      default:
        // 'all' - não filtrar
        break;
    }

    setFilteredClasses(filtered);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  const getStatusColor = (isCompleted) => {
    return isCompleted ? '#4CAF50' : '#FF9800';
  };

  const getStatusText = (isCompleted) => {
    return isCompleted ? 'Concluída' : 'Pendente';
  };

  const handleCreateClass = () => {
    onNavigate('createClass');
  };

  const handleEditClass = (classId) => {
    onNavigate('editClass', { classId });
  };

  const handleStartClass = (classItem) => {
    onNavigate('class', { classData: classItem });
  };

  const showModal = (config) => {
    setModalConfig(config);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setModalConfig({});
  };

  const handleDeleteClass = async (classId) => {
    console.log('handleDeleteClass chamado com ID:', classId);
    
    showModal({
      type: 'warning',
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          style: 'secondary',
          onPress: () => {
            console.log('Exclusão cancelada pelo usuário');
            hideModal();
          }
        },
        {
          text: 'Excluir',
          style: 'danger',
          onPress: async () => {
            console.log('Confirmando exclusão da aula:', classId);
            try {
              const response = await apiService.deleteClass(classId);
              console.log('Resposta da API:', response);
              if (response.success) {
                await loadClasses();
                hideModal();
                showModal({
                  type: 'success',
                  title: 'Sucesso',
                  message: 'Aula excluída com sucesso!',
                  buttons: [
                    {
                      text: 'OK',
                      style: 'primary',
                      onPress: hideModal
                    }
                  ]
                });
              } else {
                hideModal();
                showModal({
                  type: 'error',
                  title: 'Erro',
                  message: response.message || 'Não foi possível excluir a aula',
                  buttons: [
                    {
                      text: 'OK',
                      style: 'primary',
                      onPress: hideModal
                    }
                  ]
                });
              }
            } catch (error) {
              console.error('Erro ao excluir aula:', error);
              hideModal();
              showModal({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível excluir a aula',
                buttons: [
                  {
                    text: 'OK',
                    style: 'primary',
                    onPress: hideModal
                  }
                ]
              });
            }
          }
        }
      ]
    });
  };

  const toggleClassStatus = async (classId, isCompleted) => {
    try {
      const response = await apiService.completeClass(classId, !isCompleted);
      if (response.success) {
        await loadClasses();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status da aula');
    }
  };

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
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Movz</Text>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setIsMenuVisible(!isMenuVisible)}
          >
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Minhas Aulas</Text>
        <Text style={styles.subtitle}>
          Gerencie suas aulas e acompanhe seu progresso
        </Text>

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por escola, série ou matéria..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'Todas' },
              { key: 'today', label: 'Hoje' },
              { key: 'thisWeek', label: 'Esta Semana' },
              { key: 'pending', label: 'Pendentes' },
              { key: 'completed', label: 'Concluídas' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Create Class Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateClass}>
          <Text style={styles.createButtonText}>+ Nova Aula</Text>
        </TouchableOpacity>

        {/* Classes List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando aulas...</Text>
          </View>
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nenhuma aula encontrada</Text>
            <Text style={styles.emptySubtitle}>
              {searchText || selectedFilter !== 'all' 
                ? 'Tente ajustar os filtros ou busca'
                : 'Crie sua primeira aula clicando no botão acima'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.classesList}>
            {filteredClasses.map((classItem) => (
              <View key={classItem.id} style={styles.classCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.classInfo}>
                    <Text style={styles.schoolName}>{classItem.school}</Text>
                    <Text style={styles.gradeText}>{classItem.grade}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(classItem.isCompleted) }
                    ]}>
                      <Text style={styles.statusText}>
                        {getStatusText(classItem.isCompleted)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <View style={styles.dateTimeContainer}>
                    <Text style={styles.dateText}>
                      📅 {formatDate(classItem.date)}
                    </Text>
                    {classItem.time && (
                      <Text style={styles.timeText}>
                        🕐 {formatTime(classItem.time)}
                      </Text>
                    )}
                  </View>
                  
                  {classItem.subject && (
                    <Text style={styles.subjectText}>
                      📚 {classItem.subject}
                    </Text>
                  )}

                  {classItem.notes && (
                    <Text style={styles.notesText} numberOfLines={2}>
                      📝 {classItem.notes}
                    </Text>
                  )}
                </View>

                {/* Card Actions */}
                <View style={styles.cardActions}>
                  {!classItem.isCompleted && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.startButton]}
                      onPress={() => handleStartClass(classItem)}
                    >
                      <Text style={styles.actionButtonText}>Iniciar Aula</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditClass(classItem.id)}
                  >
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      classItem.isCompleted ? styles.completeButton : styles.pendingButton
                    ]}
                    onPress={() => toggleClassStatus(classItem.id, classItem.isCompleted)}
                  >
                    <Text style={styles.actionButtonText}>
                      {classItem.isCompleted ? 'Marcar Pendente' : 'Marcar Concluída'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteClass(classItem.id)}
                  >
                    <Text style={styles.actionButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        {classes.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Resumo</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{classes.length}</Text>
                <Text style={styles.statLabel}>Total de Aulas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {classes.filter(c => c.isCompleted).length}
                </Text>
                <Text style={styles.statLabel}>Concluídas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {classes.filter(c => !c.isCompleted).length}
                </Text>
                <Text style={styles.statLabel}>Pendentes</Text>
              </View>
            </View>
          </View>
        )}

        {/* Modal Personalizado */}
        <CustomModal
          visible={modalVisible}
          onClose={hideModal}
          title={modalConfig.title || ''}
          message={modalConfig.message || ''}
          type={modalConfig.type || 'info'}
          buttons={modalConfig.buttons || []}
        />
      </ScrollView>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  menuButton: {
    padding: 10,
  },
  menuIcon: {
    width: 20,
    height: 15,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    backgroundColor: '#D9D9D9',
    borderRadius: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins',
    lineHeight: 22,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#F9BB55',
    borderColor: '#F9BB55',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#F9BB55',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 20,
  },
  classesList: {
    marginBottom: 20,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  classInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  gradeText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 15,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins',
    marginRight: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins',
  },
  subjectText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    flex: 1,
    maxWidth: '48%',
  },
  startButton: {
    backgroundColor: '#2196F3',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  pendingButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
});

export default TeacherClassesScreen;
