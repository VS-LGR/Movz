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
  Modal,
  Image,
} from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import useCustomAlert from '../../hooks/useCustomAlert';
import apiService from '../../services/apiService';
import SideMenu from '../../components/SideMenu';
import CustomModal from '../../components/CustomModal';
import ClassSelector from '../../components/ClassSelector';

const { width, height } = Dimensions.get('window');

// Mapeamento de esportes para suas imagens
const getSportIcon = (sportName) => {
  const iconMap = {
    'Basquete': require('../../assets/images/Basquete_sports.svg'),
    'Handball': require('../../assets/images/Handball_sports.svg'),
    'Vôlei': require('../../assets/images/Voley_sports.svg'),
    'Ping-Pong': require('../../assets/images/pingPong_sports.svg'),
    'Natação': require('../../assets/images/Swimming_sports.svg'),
    'Futebol': require('../../assets/images/futebol_sports.svg'),
    'Exercícios': require('../../assets/images/Exercise_sports.svg'),
    'Queimada': require('../../assets/images/queimada_sports.svg'),
    'Aula Livre': require('../../assets/images/Exercise_sports.svg'),
  };
  return iconMap[sportName] || null;
};

const CreateClassScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();
  
  // Step 1: Sport Selection
  const [selectedSport, setSelectedSport] = useState(null);
  const [sports, setSports] = useState([]);
  const [favoriteSports, setFavoriteSports] = useState([]);
  
  // Step 2: Class Selection
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Step 3: Class Type
  const [classType, setClassType] = useState('');
  
  // Step 4: Date, Time and Additional Info
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  // Load sports from API
  useEffect(() => {
    loadSports();
    loadFavoriteSports();
  }, [currentUser]);

  const loadSports = async () => {
    try {
      const response = await apiService.getSports();
      if (response.success) {
        // A API retorna {success: true, data: {sports: [...]}}
        setSports(response.data?.sports || []);
      } else {
        setSports([]);
      }
    } catch (error) {
      console.error('Erro ao carregar esportes:', error);
      setSports([]);
    }
  };

  const loadFavoriteSports = async () => {
    try {
      // Carregar esportes favoritos do usuário atual
      if (currentUser && currentUser.id) {
        const response = await apiService.getFavoriteSports();
        
        if (response.success && response.data?.sports) {
          const favoriteIds = response.data.sports.map(sport => sport.id);
          setFavoriteSports(favoriteIds);
        } else {
          setFavoriteSports([]);
        }
      } else {
        setFavoriteSports([]);
      }
    } catch (error) {
      console.error('Erro ao carregar esportes favoritos:', error);
      setFavoriteSports([]);
    }
  };

  const showModal = (config) => {
    setModalConfig(config);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setModalConfig({});
  };

  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
    // Auto-advance to next step after selection
    setTimeout(() => {
      setCurrentStep(2);
    }, 500);
  };

  const toggleFavorite = async (sportId, event) => {
    event.stopPropagation(); // Evitar que o clique na estrela selecione o esporte
    
    try {
      const isCurrentlyFavorite = favoriteSports.includes(sportId);
      
      if (isCurrentlyFavorite) {
        // Remover dos favoritos
        await apiService.removeFavoriteSport(sportId);
        setFavoriteSports(prev => prev.filter(id => id !== sportId));
      } else {
        // Adicionar aos favoritos
        await apiService.addFavoriteSport(sportId);
        setFavoriteSports(prev => [...prev, sportId]);
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      showError('❌ Erro', 'Não foi possível atualizar os favoritos');
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveClass = async () => {
    console.log('=== INICIANDO SALVAMENTO DA AULA ===');
    console.log('selectedSport:', selectedSport);
    console.log('selectedClass:', selectedClass);
    console.log('classType:', classType);
    console.log('startTime:', startTime);
    console.log('endTime:', endTime);
    console.log('selectedDate:', selectedDate);

    // Validation
    if (!selectedSport) {
      showError('❌ Erro', 'Selecione um esporte');
      return;
    }
    if (!selectedClass) {
      showError('❌ Erro', 'Selecione uma turma');
      return;
    }
    if (!classType) {
      showError('❌ Erro', 'Selecione o tipo da aula');
      return;
    }
    if (!startTime || !endTime) {
      showError('❌ Erro', 'Preencha o horário de início e fim');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Iniciando requisição para API...');
      
      // CORREÇÃO DEFINITIVA: Usar string de data para evitar problemas de fuso horário
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); // +1 porque getMonth() retorna 0-11
      const day = String(selectedDate.getDate()).padStart(2, '0');
      
      // Criar string de data no formato YYYY-MM-DD
      const dateString = `${year}-${month}-${day}`;
      
      const classData = {
        date: dateString, // Usar string ao invés de Date object
        school: selectedClass.school,
        grade: selectedClass.grade,
        classId: selectedClass.id, // ID da turma selecionada
        subject: `${selectedSport.name} - ${classType}`,
        time: `${startTime} - ${endTime}`,
        notes: notes.trim() || null
      };
      
      console.log('🔵 CreateClass - Data original:', selectedDate);
      console.log('🔵 CreateClass - Ano:', year, 'Mês:', month, 'Dia:', day);
      console.log('🔵 CreateClass - Data string:', dateString);
      console.log('🔵 CreateClass - Dados finais:', classData);

      console.log('Dados da aula a serem enviados:', classData);

      const response = await apiService.createOrUpdateClass(classData);
      
      console.log('Resposta da API:', response);
      
      if (response.success) {
        console.log('Aula criada com sucesso!');
        showModal({
          type: 'success',
          title: 'Sucesso!',
          message: 'Aula criada com sucesso! Ela foi automaticamente adicionada ao seu calendário.',
          buttons: [
            {
              text: 'Ver Minhas Aulas',
              style: 'primary',
              onPress: () => {
                console.log('Navegando para teacherClasses...');
                hideModal();
                onNavigate('teacherClasses');
              }
            }
          ]
        });
      } else {
        console.log('Erro na resposta da API:', response.message);
        throw new Error(response.message || 'Erro ao criar aula');
      }
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      showModal({
        type: 'error',
        title: 'Erro',
        message: error.message || 'Não foi possível criar a aula. Tente novamente.',
        buttons: [
          {
            text: 'Tentar Novamente',
            style: 'primary',
            onPress: () => {
              hideModal();
              handleSaveClass();
            }
          },
          {
            text: 'Cancelar',
            style: 'secondary',
            onPress: hideModal
          }
        ]
      });
    } finally {
      setIsLoading(false);
      console.log('=== FIM DO SALVAMENTO ===');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            currentStep >= step && styles.stepDotActive
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Escolha o Esporte</Text>
      <Text style={styles.stepDescription}>
        Escolha qual será o esporte praticado nessa aula. Deixamos favoritado os esportes preferidos dos alunos dessa turma.
      </Text>
      
      <View style={styles.sportsGrid}>
        {Array.isArray(sports) && sports.length > 0 ? (
          sports.map((sport, index) => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.sportCard,
                selectedSport?.id === sport.id && styles.sportCardSelected
              ]}
              onPress={() => handleSportSelect(sport)}
            >
              <View style={styles.sportCardContent}>
                <View style={styles.sportIndicator} />
                {getSportIcon(sport.name) && (
                  <Image 
                    source={getSportIcon(sport.name)} 
                    style={styles.sportIcon}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.sportName}>{sport.name}</Text>
                <TouchableOpacity 
                  style={styles.favoriteStar}
                  onPress={(event) => toggleFavorite(sport.id, event)}
                >
                  <Text style={[
                    styles.starText,
                    favoriteSports.includes(sport.id) && styles.starTextActive
                  ]}>
                    ★
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando esportes...</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Selecionar Turma</Text>
      <Text style={styles.stepDescription}>
        Escolha a turma para a qual você está criando esta aula. Apenas turmas onde você foi adicionado pela instituição aparecerão aqui.
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Turma *</Text>
          <ClassSelector
            selectedClass={selectedClass}
            onClassSelect={setSelectedClass}
            placeholder="Selecione uma turma"
          />
        </View>
      </View>
      
      {selectedClass && (
        <View style={styles.selectedClassInfo}>
          <Text style={styles.selectedClassTitle}>Turma Selecionada:</Text>
          <Text style={styles.selectedClassName}>{selectedClass.name}</Text>
          <Text style={styles.selectedClassDetails}>
            {selectedClass.school} - {selectedClass.grade}
          </Text>
          {selectedClass.description && (
            <Text style={styles.selectedClassDescription}>{selectedClass.description}</Text>
          )}
          <Text style={styles.selectedClassStudents}>
            {selectedClass.students?.length || 0} alunos cadastrados
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tipo da Aula</Text>
      <Text style={styles.stepDescription}>
        Selecione o tipo de atividade que será realizada.
      </Text>
      
      <View style={styles.classTypeContainer}>
        {[
          { key: 'TREINO', label: 'Treino', description: 'Sessão de treinamento técnico' },
          { key: 'PRATICA', label: 'Prática', description: 'Aplicação prática dos conhecimentos' },
          { key: 'AMISTOSO', label: 'Amistoso', description: 'Jogo ou competição amistosa' }
        ].map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.classTypeCard,
              classType === type.key && styles.classTypeCardSelected
            ]}
            onPress={() => setClassType(type.key)}
          >
            <Text style={[
              styles.classTypeTitle,
              classType === type.key && styles.classTypeTitleSelected
            ]}>
              {type.label}
            </Text>
            <Text style={[
              styles.classTypeDescription,
              classType === type.key && styles.classTypeDescriptionSelected
            ]}>
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Data e Horário</Text>
      <Text style={styles.stepDescription}>
        Defina quando a aula será realizada e informações adicionais.
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Data *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDateModal(true)}
          >
            <Text style={styles.dateButtonText}>
              {selectedDate.toLocaleDateString('pt-BR')}
            </Text>
            <Text style={styles.dateButtonIcon}>📅</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.timeContainer}>
          <View style={styles.timeInputGroup}>
            <Text style={styles.inputLabel}>Início *</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="14:00"
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.timeInputGroup}>
            <Text style={styles.inputLabel}>Fim *</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="15:00"
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numeric"
            />
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Informações adicionais sobre a aula..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Modal de Seleção de Data */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Data</Text>
            
            <View style={styles.datePickerContainer}>
              <Text style={styles.currentDateText}>
                Data atual: {selectedDate.toLocaleDateString('pt-BR')}
              </Text>
              
              <View style={styles.dateButtonsContainer}>
                <TouchableOpacity
                  style={styles.dateActionButton}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <Text style={styles.dateActionButtonText}>← Ontem</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dateActionButton}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <Text style={styles.dateActionButtonText}>Amanhã →</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateButtonsContainer}>
                <TouchableOpacity
                  style={styles.dateActionButton}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 7);
                    setSelectedDate(newDate);
                  }}
                >
                  <Text style={styles.dateActionButtonText}>← Semana</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dateActionButton}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 7);
                    setSelectedDate(newDate);
                  }}
                >
                  <Text style={styles.dateActionButtonText}>Semana →</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
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

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < 4 ? (
            <TouchableOpacity 
              style={[
                styles.nextButton,
                (!selectedSport || (currentStep === 2 && !selectedClass)) && styles.nextButtonDisabled
              ]}
              onPress={handleNext}
              disabled={!selectedSport || (currentStep === 2 && !selectedClass)}
            >
              <Text style={styles.nextButtonText}>Próximo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled
              ]}
              onPress={handleSaveClass}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Salvando...' : 'Criar Aula'}
              </Text>
            </TouchableOpacity>
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
        </View>
      </ScrollView>
      
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: '#F9BB55',
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  stepDescription: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  sportCard: {
    width: (width - 70) / 3,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sportCardSelected: {
    backgroundColor: '#F9BB55',
    borderColor: '#364859',
    shadowColor: '#F9BB55',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  sportCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sportIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#364859',
    position: 'absolute',
    top: 8,
    left: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  sportIcon: {
    width: 38,
    height: 38,
    marginBottom: 8,
    marginTop: 12,
  },
  sportName: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
    paddingHorizontal: 6,
    lineHeight: 16,
  },
  favoriteStar: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  starText: {
    fontSize: 12,
    color: '#666666',
    opacity: 0.8,
  },
  starTextActive: {
    color: '#F9BB55',
    opacity: 1,
    textShadow: '0px 1px 2px rgba(0, 0, 0, 1)',
  },
  formContainer: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  input: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  classTypeContainer: {
    marginTop: 20,
  },
  classTypeCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  classTypeCardSelected: {
    backgroundColor: '#F9BB55',
    borderColor: '#364859',
  },
  classTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  classTypeTitleSelected: {
    color: '#000',
  },
  classTypeDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  classTypeDescriptionSelected: {
    color: '#000',
  },
  selectedClassInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedClassTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  selectedClassName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  selectedClassDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  selectedClassDescription: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  selectedClassStudents: {
    fontSize: 12,
    color: '#F9BB55',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputGroup: {
    flex: 1,
    marginRight: 10,
  },
  timeInput: {
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#F9BB55',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  nextButtonDisabled: {
    backgroundColor: '#D9D9D9',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#D9D9D9',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
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
  // Estilos do Modal de Data
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
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  currentDateText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  dateButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateActionButton: {
    backgroundColor: '#F9BB55',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  dateActionButtonText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  // Estilos do Botão de Data
  dateButton: {
    backgroundColor: '#FFFFFF',
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins',
  },
  dateButtonIcon: {
    fontSize: 20,
  },
});

export default CreateClassScreen;
