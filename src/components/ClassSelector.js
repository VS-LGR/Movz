import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

const ClassSelector = ({ 
  selectedClass, 
  onClassSelect, 
  placeholder = "Selecione uma turma",
  error = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Carregar turmas quando o componente monta
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
      const response = await apiService.getClasses();
      
      if (response.success) {
        setClasses(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterClasses = () => {
    if (!searchText.trim()) {
      setFilteredClasses(classes);
      return;
    }

    const filtered = classes.filter(classItem =>
      classItem.name.toLowerCase().includes(searchText.toLowerCase()) ||
      classItem.school.toLowerCase().includes(searchText.toLowerCase()) ||
      classItem.grade.toLowerCase().includes(searchText.toLowerCase())
    );
    
    setFilteredClasses(filtered);
  };

  const handleClassSelect = (classItem) => {
    onClassSelect(classItem);
    setIsOpen(false);
    setSearchText('');
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchText('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchText('');
  };

  const getDisplayText = () => {
    if (selectedClass) {
      return `${selectedClass.name} - ${selectedClass.school} (${selectedClass.grade})`;
    }
    return placeholder;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.selector,
          error && styles.selectorError
        ]}
        onPress={handleOpen}
      >
        <Text style={[
          styles.selectorText,
          !selectedClass && styles.placeholderText
        ]}>
          {getDisplayText()}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Turma</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar turma..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#999"
              />
            </View>

            <ScrollView style={styles.classesList} showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Carregando turmas...</Text>
                </View>
              ) : filteredClasses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchText ? 'Nenhuma turma encontrada' : 'Nenhuma turma disponível'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {searchText 
                      ? 'Tente ajustar os termos de busca' 
                      : 'Você precisa ser adicionado a uma turma pela instituição'
                    }
                  </Text>
                </View>
              ) : (
                filteredClasses.map((classItem) => (
                  <TouchableOpacity
                    key={classItem.id}
                    style={[
                      styles.classItem,
                      selectedClass?.id === classItem.id && styles.classItemSelected
                    ]}
                    onPress={() => handleClassSelect(classItem)}
                  >
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>{classItem.name}</Text>
                      <Text style={styles.classDetails}>
                        {classItem.school} - {classItem.grade}
                      </Text>
                      {classItem.description && (
                        <Text style={styles.classDescription}>{classItem.description}</Text>
                      )}
                      <Text style={styles.studentsCount}>
                        {classItem.students?.length || 0} alunos
                      </Text>
                    </View>
                    {selectedClass?.id === classItem.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 50,
  },
  selectorError: {
    borderColor: '#FF5722',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins',
  },
  placeholderText: {
    color: '#999',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '100%',
    maxWidth: 500,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  classesList: {
    maxHeight: 300,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  classItemSelected: {
    backgroundColor: '#F9BB55',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  classDescription: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  studentsCount: {
    fontSize: 12,
    color: '#F9BB55',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ClassSelector;
