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
} from 'react-native';
import apiService from './apiService';
import SideMenu from './SideMenu';
import CustomModal from './CustomModal';

const { width, height } = Dimensions.get('window');

const CreateClassScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  
  // Step 1: Sport Selection
  const [selectedSport, setSelectedSport] = useState(null);
  const [sports, setSports] = useState([]);
  
  // Step 2: Institution and Class
  const [institution, setInstitution] = useState('');
  const [grade, setGrade] = useState('');
  
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
  }, []);

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
    console.log('institution:', institution);
    console.log('grade:', grade);
    console.log('classType:', classType);
    console.log('startTime:', startTime);
    console.log('endTime:', endTime);
    console.log('selectedDate:', selectedDate);

    // Validation
    if (!selectedSport) {
      Alert.alert('Erro', 'Selecione um esporte');
      return;
    }
    if (!institution.trim() || !grade.trim()) {
      Alert.alert('Erro', 'Preencha a instituição e turma');
      return;
    }
    if (!classType) {
      Alert.alert('Erro', 'Selecione o tipo da aula');
      return;
    }
    if (!startTime || !endTime) {
      Alert.alert('Erro', 'Preencha o horário de início e fim');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Iniciando requisição para API...');
      
      const classData = {
        date: selectedDate.toISOString(),
        school: institution.trim(),
        grade: grade.trim(),
        subject: `${selectedSport.name} - ${classType}`,
        time: `${startTime} - ${endTime}`,
        notes: notes.trim() || null
      };

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
                console.log('Navegando para classes...');
                hideModal();
                onNavigate('classes');
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
                <Text style={styles.sportName}>{sport.name}</Text>
                {index < 3 && (
                  <View style={styles.favoriteStar}>
                    <Text style={styles.starText}>★</Text>
                  </View>
                )}
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
      <Text style={styles.stepTitle}>Instituição e Turma</Text>
      <Text style={styles.stepDescription}>
        Informe a instituição de ensino e a turma que participará da aula.
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Instituição de Ensino *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome da escola/universidade"
            value={institution}
            onChangeText={setInstitution}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Turma/Série *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 5ª série, 1º ano, Turma A"
            value={grade}
            onChangeText={setGrade}
          />
        </View>
      </View>
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
                (!selectedSport || (currentStep === 2 && (!institution.trim() || !grade.trim()))) && styles.nextButtonDisabled
              ]}
              onPress={handleNext}
              disabled={!selectedSport || (currentStep === 2 && (!institution.trim() || !grade.trim()))}
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
  },
  sportCard: {
    width: (width - 60) / 3,
    height: 91,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sportCardSelected: {
    backgroundColor: '#F9BB55',
    borderColor: '#364859',
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
    top: 7,
    left: 8,
  },
  sportName: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginTop: 20,
  },
  favoriteStar: {
    position: 'absolute',
    top: 5,
    right: 8,
  },
  starText: {
    fontSize: 16,
    color: '#F9BB55',
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
