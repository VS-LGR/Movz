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
  Dimensions,
  SafeAreaView,
} from 'react-native';
import apiService from './apiService';
import SideMenu from './SideMenu';
import CustomModal from './CustomModal';

const { width, height } = Dimensions.get('window');

const ClassManagementScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [studentSearchText, setStudentSearchText] = useState('');
  const [stats, setStats] = useState({ totalClasses: 0, totalStudents: 0, averageStudentsPerClass: 0 });

  // Formulário para nova turma
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    school: '',
    grade: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadClasses();
    loadStats();
  }, []);

  // Filtrar turmas quando searchText mudar
  useEffect(() => {
    filterClasses();
  }, [classes, searchText]);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getClasses();
      
      if (response.success) {
        setClasses(response.data);
      } else {
        Alert.alert('Erro', 'Erro ao carregar turmas');
      }
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      Alert.alert('Erro', 'Erro ao carregar turmas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getClassManagementStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filterClasses = () => {
    if (!searchText.trim()) {
      setFilteredClasses(classes);
      return;
    }

    const filtered = classes.filter(cls =>
      cls.name.toLowerCase().includes(searchText.toLowerCase()) ||
      cls.school.toLowerCase().includes(searchText.toLowerCase()) ||
      cls.grade.toLowerCase().includes(searchText.toLowerCase())
    );

    setFilteredClasses(filtered);
  };

  const handleCreateClass = () => {
    setNewClass({ name: '', description: '', school: '', grade: '' });
    setShowCreateModal(true);
  };

  const handleSaveClass = async () => {
    try {
      if (!newClass.name.trim() || !newClass.school.trim() || !newClass.grade.trim()) {
        Alert.alert('Erro', 'Nome, escola e série são obrigatórios');
        return;
      }

      setIsLoading(true);
      const response = await apiService.createClass(newClass);

      if (response.success) {
        Alert.alert('Sucesso', 'Turma criada com sucesso!');
        setShowCreateModal(false);
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

  const handleEditClass = (classItem) => {
    setNewClass({
      name: classItem.name,
      description: classItem.description || '',
      school: classItem.school,
      grade: classItem.grade
    });
    setSelectedClass(classItem);
    setShowCreateModal(true);
  };

  const handleUpdateClass = async () => {
    try {
      if (!newClass.name.trim() || !newClass.school.trim() || !newClass.grade.trim()) {
        Alert.alert('Erro', 'Nome, escola e série são obrigatórios');
        return;
      }

      setIsLoading(true);
      const response = await apiService.updateClass(selectedClass.id, newClass);

      if (response.success) {
        Alert.alert('Sucesso', 'Turma atualizada com sucesso!');
        setShowCreateModal(false);
        setSelectedClass(null);
        loadClasses();
      } else {
        Alert.alert('Erro', response.message || 'Erro ao atualizar turma');
      }
    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
      Alert.alert('Erro', 'Erro ao atualizar turma');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = (classItem) => {
    setModalConfig({
      title: 'Remover Turma',
      message: `Tem certeza que deseja remover a turma "${classItem.name}"?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      onConfirm: () => confirmDeleteClass(classItem.id),
      onCancel: () => setModalVisible(false)
    });
    setModalVisible(true);
  };

  const confirmDeleteClass = async (classId) => {
    try {
      setIsLoading(true);
      const response = await apiService.deleteClass(classId);

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

  const handleAddStudent = (classItem) => {
    setSelectedClass(classItem);
    setStudentSearchText('');
    loadAvailableStudents(classItem.id);
    setShowAddStudentModal(true);
  };

  const loadAvailableStudents = async (classId, search = '') => {
    try {
      const response = await apiService.getAvailableStudents(classId, search);
      if (response.success) {
        setAvailableStudents(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const handleAddStudentToClass = async (student) => {
    try {
      setIsLoading(true);
      const response = await apiService.addStudentToClass(selectedClass.id, student.id);

      if (response.success) {
        Alert.alert('Sucesso', `Aluno ${student.name} adicionado à turma!`);
        setShowAddStudentModal(false);
        loadClasses();
        loadStats();
      } else {
        Alert.alert('Erro', response.message || 'Erro ao adicionar aluno');
      }
    } catch (error) {
      console.error('Erro ao adicionar aluno:', error);
      Alert.alert('Erro', 'Erro ao adicionar aluno');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = (classItem, student) => {
    setModalConfig({
      title: 'Remover Aluno',
      message: `Tem certeza que deseja remover ${student.name} da turma?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      onConfirm: () => confirmRemoveStudent(classItem.id, student.id),
      onCancel: () => setModalVisible(false)
    });
    setModalVisible(true);
  };

  const confirmRemoveStudent = async (classId, studentId) => {
    try {
      setIsLoading(true);
      const response = await apiService.removeStudentFromClass(classId, studentId);

      if (response.success) {
        Alert.alert('Sucesso', 'Aluno removido da turma!');
        setModalVisible(false);
        loadClasses();
        loadStats();
      } else {
        Alert.alert('Erro', response.message || 'Erro ao remover aluno');
      }
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      Alert.alert('Erro', 'Erro ao remover aluno');
    } finally {
      setIsLoading(false);
    }
  };

  const renderClassCard = (classItem) => (
    <View key={classItem.id} style={styles.classCard}>
      <View style={styles.classHeader}>
        <View style={styles.classInfo}>
          <Text style={styles.className}>{classItem.name}</Text>
          <Text style={styles.classDetails}>
            {classItem.school} - {classItem.grade}
          </Text>
          {classItem.description && (
            <Text style={styles.classDescription}>{classItem.description}</Text>
          )}
        </View>
        <View style={styles.classActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditClass(classItem)}
          >
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteClass(classItem)}
          >
            <Text style={styles.actionButtonText}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.studentsSection}>
        <View style={styles.studentsHeader}>
          <Text style={styles.studentsTitle}>
            Alunos ({classItem.students.length})
          </Text>
          <TouchableOpacity
            style={styles.addStudentButton}
            onPress={() => handleAddStudent(classItem)}
          >
            <Text style={styles.addStudentButtonText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {classItem.students.length === 0 ? (
          <Text style={styles.noStudentsText}>Nenhum aluno nesta turma</Text>
        ) : (
          <View style={styles.studentsList}>
            {classItem.students.map((classStudent) => (
              <View key={classStudent.id} style={styles.studentItem}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{classStudent.student.name}</Text>
                  <Text style={styles.studentEmail}>{classStudent.student.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeStudentButton}
                  onPress={() => handleRemoveStudent(classItem, classStudent.student)}
                >
                  <Text style={styles.removeStudentButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
          <Text style={styles.title}>Gerenciar Turmas</Text>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalClasses}</Text>
            <Text style={styles.statLabel}>Turmas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Alunos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.averageStudentsPerClass}</Text>
            <Text style={styles.statLabel}>Média/Turma</Text>
          </View>
        </View>

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

        {/* Botão Criar Turma */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateClass}>
          <Text style={styles.createButtonText}>+ Nova Turma</Text>
        </TouchableOpacity>

        {/* Lista de Turmas */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando turmas...</Text>
          </View>
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText ? 'Nenhuma turma encontrada' : 'Nenhuma turma criada ainda'}
            </Text>
          </View>
        ) : (
          <View style={styles.classesList}>
            {filteredClasses.map(renderClassCard)}
          </View>
        )}
      </ScrollView>

      {/* Modal de Criar/Editar Turma */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedClass ? 'Editar Turma' : 'Nova Turma'}
            </Text>

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
              style={[styles.input, styles.textArea]}
              placeholder="Descrição (opcional)"
              value={newClass.description}
              onChangeText={(text) => setNewClass({ ...newClass, description: text })}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setSelectedClass(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={selectedClass ? handleUpdateClass : handleSaveClass}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Adicionar Aluno */}
      <Modal
        visible={showAddStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Adicionar Aluno - {selectedClass?.name}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Pesquisar alunos..."
              value={studentSearchText}
              onChangeText={(text) => {
                setStudentSearchText(text);
                loadAvailableStudents(selectedClass?.id, text);
              }}
              placeholderTextColor="#999"
            />

            <ScrollView style={styles.studentsModalList}>
              {availableStudents.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.studentModalItem}
                  onPress={() => handleAddStudentToClass(student)}
                >
                  <View style={styles.studentModalInfo}>
                    <Text style={styles.studentModalName}>{student.name}</Text>
                    <Text style={styles.studentModalEmail}>{student.email}</Text>
                    {student.school && (
                      <Text style={styles.studentModalSchool}>{student.school}</Text>
                    )}
                  </View>
                  <Text style={styles.addIcon}>+</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAddStudentModal(false)}
            >
              <Text style={styles.cancelButtonText}>Fechar</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
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
  searchContainer: {
    marginBottom: 20,
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
  createButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  classesList: {
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
  },
  className: {
    fontSize: 20,
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
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
  classActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins',
  },
  studentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  studentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  addStudentButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addStudentButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
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
  studentsList: {
    gap: 8,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Poppins',
  },
  studentEmail: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
  },
  removeStudentButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeStudentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Poppins',
    textAlign: 'center',
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#F9BB55',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Poppins',
  },
  studentsModalList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  studentModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  studentModalInfo: {
    flex: 1,
  },
  studentModalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Poppins',
  },
  studentModalEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  studentModalSchool: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins',
  },
  addIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default ClassManagementScreen;
