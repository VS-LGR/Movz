import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import apiService from './apiService';
import SideMenu from './SideMenu';
import CustomModal from './CustomModal';

const InstitutionDashboardScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeClasses: 0
  });
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [cpfSearch, setCpfSearch] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    teacherId: '',
    school: '',
    grade: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadStats();
    loadUsers();
    loadClasses();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.getInstitutionStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getInstitutionUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await apiService.getInstitutionClasses();
      if (response.success) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const handleSearchUserByCPF = async () => {
    if (!cpfSearch.trim()) {
      Alert.alert('Erro', 'Digite um CPF para buscar');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.searchUserByCPF(cpfSearch);
      
      if (response.success) {
        setFoundUser(response.data);
      } else {
        setFoundUser(null);
        Alert.alert('Usuário não encontrado', 'Nenhum usuário encontrado com este CPF');
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      Alert.alert('Erro', 'Erro ao buscar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (userId) => {
    try {
      setIsLoading(true);
      const response = await apiService.addUserToInstitution(userId);
      
      if (response.success) {
        Alert.alert('Sucesso', 'Usuário adicionado à instituição!');
        setShowAddUserModal(false);
        setFoundUser(null);
        setCpfSearch('');
        loadUsers();
        loadStats();
      } else {
        Alert.alert('Erro', response.message || 'Erro ao adicionar usuário');
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      Alert.alert('Erro', 'Erro ao adicionar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = (user) => {
    setModalConfig({
      title: 'Remover Usuário',
      message: `Tem certeza que deseja remover ${user.name} da instituição?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      onConfirm: () => confirmRemoveUser(user.id),
      onCancel: () => setModalVisible(false)
    });
    setModalVisible(true);
  };

  const confirmRemoveUser = async (userId) => {
    try {
      setIsLoading(true);
      const response = await apiService.removeUserFromInstitution(userId);
      
      if (response.success) {
        Alert.alert('Sucesso', 'Usuário removido da instituição!');
        setModalVisible(false);
        loadUsers();
        loadStats();
      } else {
        Alert.alert('Erro', response.message || 'Erro ao remover usuário');
      }
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      Alert.alert('Erro', 'Erro ao remover usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    const { name, teacherId, school, grade } = newClass;

    if (!name.trim() || !teacherId || !school.trim() || !grade.trim()) {
      Alert.alert('Erro', 'Todos os campos obrigatórios devem ser preenchidos');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.createInstitutionClass(newClass);
      
      if (response.success) {
        Alert.alert('Sucesso', 'Turma criada com sucesso!');
        setShowCreateClassModal(false);
        setNewClass({ name: '', description: '', teacherId: '', school: '', grade: '' });
        loadClasses();
        loadStats();
      } else {
        Alert.alert('Erro', response.message || 'Erro ao criar turma');
      }
    } catch (error) {
      console.error('Erro ao criar turma:', error);
      Alert.alert('Erro', 'Erro ao criar turma');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Visão Geral</Text>
      
      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Alunos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalTeachers}</Text>
          <Text style={styles.statLabel}>Professores</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalClasses}</Text>
          <Text style={styles.statLabel}>Turmas</Text>
        </View>
      </View>

      {/* Ações Rápidas */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowAddUserModal(true)}
        >
          <Text style={styles.actionButtonText}>+ Adicionar Usuário</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowCreateClassModal(true)}
        >
          <Text style={styles.actionButtonText}>+ Criar Turma</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUsers = () => {
    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      (user.cpf && user.cpf.includes(searchText))
    );

    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabTitle}>Usuários</Text>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar usuários..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />

        {filteredUsers.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
        ) : (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userType}>
                    {user.userType === 'STUDENT' ? 'Aluno' : 'Professor'}
                  </Text>
                  {user.cpf && (
                    <Text style={styles.userCpf}>CPF: {user.cpf}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveUser(user)}
                >
                  <Text style={styles.removeButtonText}>Remover</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderClasses = () => {
    const filteredClasses = classes.filter(cls =>
      cls.name.toLowerCase().includes(searchText.toLowerCase()) ||
      cls.school.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabTitle}>Turmas</Text>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar turmas..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />

        {filteredClasses.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma turma encontrada</Text>
        ) : (
          <View style={styles.classesList}>
            {filteredClasses.map((classItem) => (
              <View key={classItem.id} style={styles.classCard}>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  <Text style={styles.classDetails}>
                    {classItem.school} - {classItem.grade}
                  </Text>
                  <Text style={styles.classTeacher}>
                    Professor: {classItem.teacher.name}
                  </Text>
                  <Text style={styles.classStudents}>
                    {classItem.students.length} alunos
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setIsMenuVisible(true)}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
          <Text style={styles.title}>{currentUser?.name}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Visão Geral
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              Usuários
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'classes' && styles.activeTab]}
            onPress={() => setActiveTab('classes')}
          >
            <Text style={[styles.tabText, activeTab === 'classes' && styles.activeTabText]}>
              Turmas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo das Tabs */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'classes' && renderClasses()}
      </ScrollView>

      {/* Modal de Adicionar Usuário */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Usuário</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Digite o CPF do usuário"
              value={cpfSearch}
              onChangeText={setCpfSearch}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchUserByCPF}
              disabled={isLoading}
            >
              <Text style={styles.searchButtonText}>
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Text>
            </TouchableOpacity>

            {foundUser && (
              <View style={styles.foundUser}>
                <Text style={styles.foundUserName}>{foundUser.name}</Text>
                <Text style={styles.foundUserEmail}>{foundUser.email}</Text>
                <Text style={styles.foundUserType}>
                  {foundUser.userType === 'STUDENT' ? 'Aluno' : 'Professor'}
                </Text>
                
                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={() => handleAddUser(foundUser.id)}
                  disabled={isLoading}
                >
                  <Text style={styles.addUserButtonText}>
                    {isLoading ? 'Adicionando...' : 'Adicionar à Instituição'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddUserModal(false);
                setFoundUser(null);
                setCpfSearch('');
              }}
            >
              <Text style={styles.cancelButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Criar Turma */}
      <Modal
        visible={showCreateClassModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Nova Turma</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome da turma"
              value={newClass.name}
              onChangeText={(text) => setNewClass({ ...newClass, name: text })}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Escola"
              value={newClass.school}
              onChangeText={(text) => setNewClass({ ...newClass, school: text })}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Série"
              value={newClass.grade}
              onChangeText={(text) => setNewClass({ ...newClass, grade: text })}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="CPF do Professor"
              value={newClass.teacherId}
              onChangeText={(text) => setNewClass({ ...newClass, teacherId: text })}
              placeholderTextColor="#999"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição (opcional)"
              value={newClass.description}
              onChangeText={(text) => setNewClass({ ...newClass, description: text })}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateClass}
              disabled={isLoading}
            >
              <Text style={styles.createButtonText}>
                {isLoading ? 'Criando...' : 'Criar Turma'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCreateClassModal(false);
                setNewClass({ name: '', description: '', teacherId: '', school: '', grade: '' });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação */}
      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  menuButton: {
    flexDirection: 'column',
    gap: 3,
    marginRight: 15,
  },
  menuLine: {
    width: 25,
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#F9BB55',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins',
  },
  activeTabText: {
    color: '#000',
  },
  tabContent: {
    flex: 1,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
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
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  usersList: {
    gap: 15,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  userType: {
    fontSize: 12,
    color: '#F9BB55',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  userCpf: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins',
  },
  removeButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins',
  },
  classesList: {
    gap: 15,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  classTeacher: {
    fontSize: 12,
    color: '#F9BB55',
    fontFamily: 'Poppins',
  },
  classStudents: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  searchButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  foundUser: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  foundUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  foundUserEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  foundUserType: {
    fontSize: 12,
    color: '#F9BB55',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  addUserButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  addUserButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins',
  },
  createButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins',
  },
});

export default InstitutionDashboardScreen;
