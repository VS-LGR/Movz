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
import apiService from '../../services/apiService';
import useResponsive from '../../hooks/useResponsive';
import CustomModal from '../../components/CustomModal';
import ClassDetailsScreen from './ClassDetailsScreen';

const InstitutionDashboardScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeClasses: 0,
    recentRegistrations: 0,
    pendingApprovals: 0
  });
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
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
  
  // Estados para adicionar aluno à turma
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentsInInstitution, setStudentsInInstitution] = useState([]);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [selectedClassIdForDetails, setSelectedClassIdForDetails] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      // Configurar token de autenticação
      const token = localStorage.getItem('token');
      console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
      
      if (token) {
        apiService.setToken(token);
        console.log('✅ Token configurado no apiService');
      } else {
        console.log('❌ Token não encontrado no localStorage');
        Alert.alert('Erro', 'Token de autenticação não encontrado. Faça login novamente.');
        return;
      }
      
      // Carregar dados após configurar o token
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadClasses(),
        loadNotifications(),
        loadRecentActivities(),
        loadStudentsInInstitution()
      ]);
    };
    
    initializeData();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.getInstitutionStats();
      if (response.success) {
        // Adicionar dados simulados para as novas métricas
        const enhancedStats = {
          ...response.data,
          recentRegistrations: Math.floor(Math.random() * 10) + 1, // 1-10 novos cadastros
          pendingApprovals: Math.floor(Math.random() * 5) + 1, // 1-5 pendências
        };
        setStats(enhancedStats);
      } else {
        // Se a API falhar, usar dados simulados
        setStats({
          totalStudents: 0,
          totalTeachers: 0,
          totalClasses: 0,
          activeClasses: 0,
          recentRegistrations: 0,
          pendingApprovals: 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Usar dados simulados em caso de erro
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        activeClasses: 0,
        recentRegistrations: 0,
        pendingApprovals: 0
      });
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

  const loadNotifications = async () => {
    try {
      // Simular notificações por enquanto - depois implementar API
      const mockNotifications = [
        {
          id: 1,
          type: 'warning',
          title: 'Pendência de Aprovação',
          message: '5 novos usuários aguardam aprovação',
          time: '2 horas atrás',
          urgent: true
        },
        {
          id: 2,
          type: 'info',
          title: 'Nova Turma Criada',
          message: 'Turma "Educação Física - 8º Ano" foi criada',
          time: '1 dia atrás',
          urgent: false
        },
        {
          id: 3,
          type: 'success',
          title: 'Relatório Mensal',
          message: 'Relatório de atividades do mês está disponível',
          time: '3 dias atrás',
          urgent: false
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      // Simular atividades recentes por enquanto - depois implementar API
      const mockActivities = [
        {
          id: 1,
          type: 'user_registration',
          message: 'João Silva se cadastrou como aluno',
          time: '10 minutos atrás',
          icon: '👤'
        },
        {
          id: 2,
          type: 'class_creation',
          message: 'Professora Maria criou nova turma',
          time: '1 hora atrás',
          icon: '📚'
        },
        {
          id: 3,
          type: 'user_removal',
          message: 'Pedro foi removido da turma A',
          time: '2 horas atrás',
          icon: '❌'
        },
        {
          id: 4,
          type: 'score_submission',
          message: '15 alunos submeteram pontuações hoje',
          time: '3 horas atrás',
          icon: '🏆'
        }
      ];
      setRecentActivities(mockActivities);
    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error);
    }
  };

  const loadStudentsInInstitution = async () => {
    try {
      const response = await apiService.getInstitutionUsers();
      if (response.success) {
        // Filtrar apenas alunos
        const students = response.data.filter(user => user.userType === 'STUDENT');
        setStudentsInInstitution(students);
      }
    } catch (error) {
      console.error('Erro ao carregar alunos da instituição:', error);
    }
  };

  const handleSearchUserByCPF = async () => {
    if (!cpfSearch.trim()) {
      Alert.alert('Erro', 'Digite um CPF para buscar');
      return;
    }

    try {
      setIsLoading(true);
      
      // Verificar se o token está configurado
      const token = localStorage.getItem('token');
      console.log('🔑 Token atual:', token ? 'Presente' : 'Ausente');
      
      if (!token) {
        Alert.alert('Erro', 'Token de autenticação não encontrado. Faça login novamente.');
        return;
      }
      
      // Garantir que o token está configurado no apiService
      apiService.setToken(token);
      
      console.log('🔍 Buscando usuário com CPF:', cpfSearch);
      const response = await apiService.searchUserByCPF(cpfSearch);
      console.log('📡 Resposta da API:', response);
      
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

  // Função para selecionar aluno
  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId);
  };

  // Função para adicionar aluno à turma
  const handleAddStudentToClass = async () => {
    if (!selectedStudentId || !selectedClassId) {
      Alert.alert('Erro', 'Selecione um aluno e uma turma');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 Adicionando aluno à turma:', {
        studentId: selectedStudentId,
        classId: selectedClassId
      });
      
      const response = await apiService.addStudentToInstitutionClass(selectedClassId, selectedStudentId);
      console.log('📡 Resposta da API:', response);
      
      if (response.success) {
        Alert.alert('Sucesso', 'Aluno adicionado à turma com sucesso!');
        setShowAddStudentModal(false);
        setSelectedStudentId('');
        setSelectedClassId('');
        loadClasses();
        loadStats();
        loadStudentsInInstitution(); // Recarregar lista de alunos
      } else {
        Alert.alert('Erro', response.message || 'Erro ao adicionar aluno à turma');
      }
    } catch (error) {
      console.error('Erro ao adicionar aluno à turma:', error);
      Alert.alert('Erro', 'Erro ao adicionar aluno à turma');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = (user) => {
    console.log('🔴 handleRemoveUser chamado com:', user);
    setModalConfig({
      title: 'Remover Usuário',
      message: `Tem certeza que deseja remover ${user.name} da instituição?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      onConfirm: () => {
        console.log('🔴 onConfirm chamado');
        confirmRemoveUser(user.id);
      },
      onCancel: () => {
        console.log('🔴 onCancel chamado');
        setModalVisible(false);
      }
    });
    console.log('🔴 Abrindo modal...');
    setModalVisible(true);
  };

  const handleRemoveClass = (classItem) => {
    setModalConfig({
      title: 'Remover Turma',
      message: `Tem certeza que deseja remover a turma "${classItem.name}"?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      onConfirm: () => confirmRemoveClass(classItem.id),
      onCancel: () => setModalVisible(false)
    });
    setModalVisible(true);
  };

  const handleViewClassDetails = (classId) => {
    setSelectedClassIdForDetails(classId);
    setShowClassDetails(true);
  };

  const handleBackFromDetails = () => {
    setShowClassDetails(false);
    setSelectedClassIdForDetails(null);
  };

  const confirmRemoveClass = async (classId) => {
    try {
      setIsLoading(true);
      const response = await apiService.deleteInstitutionClass(classId);
      
      if (response.success) {
        Alert.alert('Sucesso', 'Turma removida com sucesso!');
        setModalVisible(false);
        loadClasses();
        loadStats();
      } else {
        Alert.alert('Erro', response.message || 'Erro ao remover turma');
      }
    } catch (error) {
      console.error('Erro ao remover turma:', error);
      Alert.alert('Erro', 'Erro ao remover turma');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRemoveUser = async (userId) => {
    console.log('🔴 confirmRemoveUser chamado com userId:', userId);
    try {
      setIsLoading(true);
      console.log('🔴 Chamando API para remover usuário...');
      const response = await apiService.removeUserFromInstitution(userId);
      console.log('🔴 Resposta da API:', response);
      
      if (response.success) {
        console.log('🔴 Sucesso! Fechando modal e recarregando dados...');
        Alert.alert('Sucesso', 'Usuário removido da instituição!');
        setModalVisible(false);
        loadUsers();
        loadStats();
      } else {
        console.log('🔴 Erro na resposta:', response.message);
        Alert.alert('Erro', response.message || 'Erro ao remover usuário');
      }
    } catch (error) {
      console.error('🔴 Erro ao remover usuário:', error);
      Alert.alert('Erro', 'Erro ao remover usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    const { name, teacherId, school, grade } = newClass;

    console.log('🔵 Dados da turma a ser criada:', newClass);
    console.log('🔵 Campos obrigatórios:', { name, teacherId, school, grade });

    if (!name.trim() || !teacherId || !school.trim() || !grade.trim()) {
      Alert.alert('Erro', 'Todos os campos obrigatórios devem ser preenchidos');
      return;
    }

    try {
      setIsLoading(true);
      
      // Buscar professor por CPF para obter o ID
      // Remover formatação do CPF (pontos e hífen)
      const cleanCPF = teacherId.replace(/\D/g, '');
      console.log('🔍 Buscando professor por CPF:', cleanCPF);
      const teacherResponse = await apiService.searchUserByCPF(cleanCPF);
      
      if (!teacherResponse.success || !teacherResponse.data) {
        Alert.alert('Erro', 'Professor não encontrado com este CPF');
        return;
      }
      
      const teacher = teacherResponse.data;
      
      // Verificar se é um professor
      if (teacher.userType !== 'TEACHER') {
        Alert.alert('Erro', 'O usuário encontrado não é um professor');
        return;
      }
      
      // Verificar se o professor pertence à instituição
      if (teacher.institutionId !== currentUser.id) {
        Alert.alert('Erro', 'Este professor não pertence à sua instituição');
        return;
      }
      
      console.log('✅ Professor encontrado:', teacher.name);
      console.log('🆔 ID do professor:', teacher.id);
      
      // Preparar dados da turma com o ID do professor
      const classData = {
        name: newClass.name,
        description: newClass.description,
        teacherId: teacher.id, // Usar o ID do professor, não o CPF
        school: newClass.school,
        grade: newClass.grade
      };
      
      console.log('🔵 Enviando dados para API:', classData);
      const response = await apiService.createInstitutionClass(classData);
      console.log('🔵 Resposta da API:', response);
      
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
      <Text style={styles.tabTitle}>Dashboard da Instituição</Text>
      
      {/* Estatísticas Principais */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Alunos Cadastrados</Text>
          <Text style={styles.statSubLabel}>Total na instituição</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalTeachers}</Text>
          <Text style={styles.statLabel}>Professores</Text>
          <Text style={styles.statSubLabel}>Ativos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalClasses}</Text>
          <Text style={styles.statLabel}>Turmas</Text>
          <Text style={styles.statSubLabel}>Criadas</Text>
        </View>
      </View>

      {/* Estatísticas Secundárias */}
      <View style={styles.secondaryStatsContainer}>
        <View style={styles.secondaryStatCard}>
          <Text style={styles.secondaryStatNumber}>{stats.recentRegistrations}</Text>
          <Text style={styles.secondaryStatLabel}>Novos Cadastros</Text>
          <Text style={styles.secondaryStatSubLabel}>Últimos 7 dias</Text>
        </View>
        <View style={styles.secondaryStatCard}>
          <Text style={styles.secondaryStatNumber}>{stats.pendingApprovals}</Text>
          <Text style={styles.secondaryStatLabel}>Pendências</Text>
          <Text style={styles.secondaryStatSubLabel}>Aguardando</Text>
        </View>
      </View>

      {/* Avisos Importantes */}
      <View style={styles.notificationsSection}>
        <Text style={styles.sectionTitle}>Avisos Importantes</Text>
        <View style={styles.notificationsContainer}>
          {notifications.map((notification) => (
            <View 
              key={notification.id} 
              style={[
                styles.notificationCard,
                notification.urgent && styles.urgentNotification
              ]}
            >
              <View style={styles.notificationHeader}>
                <Text style={[
                  styles.notificationTitle,
                  notification.urgent && styles.urgentText
                ]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Atividades Recentes */}
      <View style={styles.activitiesSection}>
        <Text style={styles.sectionTitle}>Atividades Recentes</Text>
        <View style={styles.activitiesContainer}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <Text style={styles.activityIcon}>{activity.icon}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityMessage}>{activity.message}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Ações Rápidas */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => setShowAddUserModal(true)}
          >
            <Text style={styles.actionButtonText}>+ Adicionar Usuário</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={() => setShowCreateClassModal(true)}
          >
            <Text style={styles.actionButtonText}>+ Criar Turma</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.tertiaryActionButton]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={styles.actionButtonText}>👥 Gerenciar Usuários</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.tertiaryActionButton]}
            onPress={() => setActiveTab('classes')}
          >
            <Text style={styles.actionButtonText}>📚 Gerenciar Turmas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderUsers = () => {
    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      (user.cpf && user.cpf.includes(searchText))
    );

    // Separar alunos e professores
    const students = filteredUsers.filter(user => user.userType === 'STUDENT');
    const teachers = filteredUsers.filter(user => user.userType === 'TEACHER');

    const renderUserCard = (user) => (
      <View key={user.id} style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
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
    );

    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabTitle}>Usuários da Instituição</Text>
        
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
          <ScrollView style={styles.usersContainer} showsVerticalScrollIndicator={false}>
            {/* Seção de Alunos */}
            <View style={styles.userSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>👥 Alunos ({students.length})</Text>
                <View style={styles.sectionDivider} />
              </View>
              {students.length === 0 ? (
                <Text style={styles.emptySectionText}>Nenhum aluno encontrado</Text>
              ) : (
                <View style={styles.usersList}>
                  {students.map(renderUserCard)}
                </View>
              )}
            </View>

            {/* Seção de Professores */}
            <View style={styles.userSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>👨‍🏫 Professores ({teachers.length})</Text>
                <View style={styles.sectionDivider} />
              </View>
              {teachers.length === 0 ? (
                <Text style={styles.emptySectionText}>Nenhum professor encontrado</Text>
              ) : (
                <View style={styles.usersList}>
                  {teachers.map(renderUserCard)}
                </View>
              )}
            </View>
          </ScrollView>
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
        
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { flex: 1 }]}
            placeholder="Pesquisar turmas..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton, { 
              flex: isMobile ? 0 : 1,
              minWidth: isMobile ? 'auto' : 200,
              paddingHorizontal: isMobile ? 12 : 20
            }]}
            onPress={() => setShowAddStudentModal(true)}
          >
            <Text style={[styles.actionButtonText, { 
              fontSize: isMobile ? 12 : 16,
              textAlign: 'center'
            }]}>
              {isMobile ? '➕ Adicionar' : '➕ Adicionar Aluno à Turma'}
            </Text>
          </TouchableOpacity>
        </View>

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
                <View style={styles.classActions}>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => handleViewClassDetails(classItem.id)}
                  >
                    <Text style={styles.detailsButtonText}>📋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeClassButton}
                    onPress={() => handleRemoveClass(classItem)}
                  >
                    <Text style={styles.removeClassButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Renderizar tela de detalhes da turma se selecionada
  if (showClassDetails && selectedClassIdForDetails) {
    return (
      <ClassDetailsScreen
        classId={selectedClassIdForDetails}
        onBack={handleBackFromDetails}
        currentUser={currentUser}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
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
              placeholder="CPF do Professor (ex: 111.222.333-44)"
              value={newClass.teacherId}
              onChangeText={(text) => {
                // Formatar CPF
                const formattedText = text
                  .replace(/\D/g, '') // Remove caracteres não numéricos
                  .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após 3 dígitos
                  .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após 6 dígitos
                  .replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // Adiciona hífen antes dos últimos 2 dígitos
                
                setNewClass({ ...newClass, teacherId: formattedText });
              }}
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={14}
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

      {/* Modal de Adicionar Aluno à Turma */}
      <Modal
        visible={showAddStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContentMobile,
            {
              margin: isMobile ? 15 : 30,
              padding: isMobile ? 20 : 25,
              maxWidth: isMobile ? '95%' : 500,
              width: isMobile ? '95%' : 'auto'
            }
          ]}>
            <Text style={styles.modalTitle}>Adicionar Aluno à Turma</Text>
            
            {/* Seleção de Aluno */}
            <View style={styles.selectionContainer}>
              <Text style={styles.selectionTitle}>Selecione o Aluno:</Text>
              <ScrollView style={[
                styles.studentPicker,
                { maxHeight: isMobile ? 150 : 200 }
              ]} showsVerticalScrollIndicator={false}>
                {studentsInInstitution.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.studentOption,
                      selectedStudentId === student.id && styles.selectedStudentOption
                    ]}
                    onPress={() => handleSelectStudent(student.id)}
                  >
                    <View style={styles.studentInfo}>
                      <Text style={[
                        styles.studentName,
                        selectedStudentId === student.id && styles.selectedStudentText
                      ]}>
                        {student.name}
                      </Text>
                      <Text style={[
                        styles.studentEmail,
                        selectedStudentId === student.id && styles.selectedStudentText
                      ]}>
                        {student.email}
                      </Text>
                      <Text style={[
                        styles.studentCPF,
                        selectedStudentId === student.id && styles.selectedStudentText
                      ]}>
                        CPF: {student.cpf}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Seleção de Turma */}
            {selectedStudentId && (
              <View style={styles.selectionContainer}>
                <Text style={styles.selectionTitle}>Selecione a Turma:</Text>
                <ScrollView style={[
                  styles.classPicker,
                  { maxHeight: isMobile ? 120 : 150 }
                ]} showsVerticalScrollIndicator={false}>
                  {classes.map((cls) => (
                    <TouchableOpacity
                      key={cls.id}
                      style={[
                        styles.classOption,
                        selectedClassId === cls.id && styles.selectedClassOption
                      ]}
                      onPress={() => setSelectedClassId(cls.id)}
                    >
                      <Text style={[
                        styles.classOptionText,
                        selectedClassId === cls.id && styles.selectedClassOptionText
                      ]}>
                        {cls.name} - {cls.school} ({cls.grade})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Botões */}
            <View style={[styles.modalButtons, { 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 12 : 15
            }]}>
              <TouchableOpacity
                style={[
                  styles.createButton, 
                  { 
                    flex: isMobile ? 0 : 1,
                    minHeight: isMobile ? 50 : 45,
                    paddingVertical: isMobile ? 15 : 12
                  },
                  !selectedStudentId || !selectedClassId ? styles.disabledButton : null
                ]}
                onPress={handleAddStudentToClass}
                disabled={isLoading || !selectedStudentId || !selectedClassId}
              >
                <Text style={[
                  styles.createButtonText,
                  { fontSize: isMobile ? 16 : 14 }
                ]}>
                  {isLoading ? 'Adicionando...' : 'Adicionar à Turma'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { 
                    flex: isMobile ? 0 : 1,
                    minHeight: isMobile ? 50 : 45,
                    paddingVertical: isMobile ? 15 : 12
                  }
                ]}
                onPress={() => {
                  setShowAddStudentModal(false);
                  setSelectedStudentId('');
                  setSelectedClassId('');
                }}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { fontSize: isMobile ? 16 : 14 }
                ]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação */}
      {console.log('🔴 Renderizando modal - visible:', modalVisible, 'config:', modalConfig)}
      <CustomModal
        visible={modalVisible}
        onClose={() => {
          console.log('🔴 Modal onClose chamado');
          setModalVisible(false);
        }}
        title={modalConfig.title}
        message={modalConfig.message}
        type="warning"
        buttons={[
          {
            text: modalConfig.cancelText || 'Cancelar',
            style: 'secondary',
            onPress: modalConfig.onCancel || (() => {
              console.log('🔴 Botão cancelar pressionado');
              setModalVisible(false);
            })
          },
          {
            text: modalConfig.confirmText || 'Confirmar',
            style: 'danger',
            onPress: modalConfig.onConfirm
          }
        ]}
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
    justifyContent: 'center',
    marginBottom: 20,
    paddingTop: 10,
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
  statSubLabel: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  secondaryStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  secondaryStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
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
    borderLeftWidth: 4,
    borderLeftColor: '#F9BB55',
  },
  secondaryStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9BB55',
    fontFamily: 'Poppins',
  },
  secondaryStatLabel: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 3,
    textAlign: 'center',
  },
  secondaryStatSubLabel: {
    fontSize: 9,
    color: '#999',
    fontFamily: 'Poppins',
    marginTop: 1,
    textAlign: 'center',
  },
  notificationsSection: {
    marginBottom: 30,
  },
  notificationsContainer: {
    gap: 10,
  },
  notificationCard: {
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
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  urgentNotification: {
    borderLeftColor: '#FF5722',
    backgroundColor: '#FFF3E0',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    flex: 1,
  },
  urgentText: {
    color: '#FF5722',
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Poppins',
  },
  notificationMessage: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    lineHeight: 16,
  },
  activitiesSection: {
    marginBottom: 30,
  },
  activitiesContainer: {
    gap: 8,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Poppins',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  primaryActionButton: {
    backgroundColor: '#F9BB55',
    flex: 1,
  },
  secondaryActionButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
  tertiaryActionButton: {
    backgroundColor: '#2196F3',
    flex: 1,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  usersContainer: {
    flex: 1,
  },
  userSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: '#F9BB55',
    borderRadius: 1,
  },
  emptySectionText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: 'Poppins',
  },
  usersList: {
    gap: 15,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
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
    borderLeftWidth: 4,
    borderLeftColor: '#F9BB55',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#364859',
    fontFamily: 'Poppins',
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  userCpf: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Poppins',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  removeButton: {
    backgroundColor: '#D9493C',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classInfo: {
    flex: 1,
  },
  removeClassButton: {
    backgroundColor: '#FF5722',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  removeClassButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  classActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailsButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailsButtonText: {
    fontSize: 16,
    color: '#fff',
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
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F9BB55',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
    flexWrap: 'wrap',
  },
  searchButton: {
    backgroundColor: '#F9BB55',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  foundUserContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  foundUserTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  foundUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  foundUserEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  foundUserCPF: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  classSelectionContainer: {
    marginVertical: 15,
  },
  classSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  classPicker: {
    maxHeight: 150,
  },
  classOption: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedClassOption: {
    backgroundColor: '#F9BB55',
    borderColor: '#F9BB55',
  },
  classOptionText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins',
  },
  selectedClassOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  // Estilos para responsividade mobile
  modalContentMobile: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
    alignSelf: 'center',
  },
  selectionContainer: {
    marginVertical: 15,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  studentPicker: {
    maxHeight: 200,
    marginBottom: 10,
  },
  studentOption: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedStudentOption: {
    backgroundColor: '#F9BB55',
    borderColor: '#F9BB55',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  studentCPF: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins',
  },
  selectedStudentText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    gap: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});

export default InstitutionDashboardScreen;
