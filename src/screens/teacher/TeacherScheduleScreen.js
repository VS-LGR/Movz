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
  Modal,
  TextInput,
} from 'react-native';
import apiService from '../../services/apiService';
import SideMenu from '../../components/SideMenu';

const { width, height } = Dimensions.get('window');

const TeacherScheduleScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [classes, setClasses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [classForm, setClassForm] = useState({
    school: '',
    grade: '',
    subject: '',
    time: '',
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Carregar aulas do banco de dados
  useEffect(() => {
    loadClasses();
  }, [currentDate]);

  const loadClasses = async () => {
    try {
      console.log('🔵 TeacherSchedule - Carregando aulas para:', currentDate);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      console.log('🔵 TeacherSchedule - Mês/Ano:', month, year);
      
      const response = await apiService.getTeacherClasses(month, year);
      console.log('🔵 TeacherSchedule - Resposta da API:', response);
      
      if (response.success) {
        // A API agora retorna um array de aulas, não um objeto agrupado por data
        const classesArray = response.data || [];
        console.log('🔵 TeacherSchedule - Array de aulas:', classesArray.length);
        
        // Agrupar aulas por data
        const classesMap = {};
        classesArray.forEach(classItem => {
          const dateStr = classItem.date; // Já vem como string YYYY-MM-DD
          console.log('🔵 TeacherSchedule - Processando aula:', {
            id: classItem.id,
            date: dateStr,
            subject: classItem.subject,
            school: classItem.school
          });
          
          if (!classesMap[dateStr]) {
            classesMap[dateStr] = [];
          }
          classesMap[dateStr].push(classItem);
        });
        
        console.log('🔵 TeacherSchedule - Classes agrupadas:', Object.keys(classesMap));
        setClasses(classesMap);
      } else {
        console.log('❌ TeacherSchedule - Erro na resposta:', response.message);
        setClasses({});
      }
    } catch (error) {
      console.error('❌ TeacherSchedule - Erro ao carregar aulas:', error);
      setClasses({});
    }
  };

  const months = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  const weekDays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

  // Gerar dias do mês
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = domingo, 1 = segunda, etc.

    const days = [];
    
    // Adicionar dias do mês anterior para preencher a primeira semana
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    // Preencher com dias do mês anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNumber = daysInPrevMonth - i;
      days.push({
        day: dayNumber,
        isCurrentMonth: false,
        date: new Date(year, month - 1, dayNumber)
      });
    }

    // Adicionar dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }

    // Adicionar dias do próximo mês para completar a grade (7 semanas x 7 dias = 49 dias)
    const remainingDays = 49 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  console.log('Total de dias gerados:', days.length);
  console.log('Primeiros 7 dias:', days.slice(0, 7).map(d => d.day));
  console.log('Dias 8-14:', days.slice(7, 14).map(d => d.day));

  // Verificar se uma data tem aula
  const hasClass = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return classes[dateStr] && classes[dateStr].length > 0;
  };

  // Obter informações da aula
  const getClassInfo = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return classes[dateStr] || [];
  };

  const getClassCount = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return classes[dateStr] ? classes[dateStr].length : 0;
  };

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Abrir modal para editar aula
  const openClassModal = (date) => {
    if (!date.isCurrentMonth) return;

    const dateStr = date.date.toISOString().split('T')[0];
    const hasClassOnDate = hasClass(date.date);

    setSelectedDate(date);
    setIsEditing(hasClassOnDate);

    if (hasClassOnDate) {
      // If there are existing classes, we'll show them in a list
      // For now, we'll just clear the form for adding a new class
      setClassForm({
        school: '',
        grade: '',
        subject: '',
        time: '',
        notes: ''
      });
    } else {
      // Limpar formulário
      setClassForm({
        school: '',
        grade: '',
        subject: '',
        time: '',
        notes: ''
      });
    }

    setIsModalVisible(true);
  };

  // Salvar aula
  const saveClass = async () => {
    if (!selectedDate) return;

    // Validação
    if (!classForm.school.trim() || !classForm.grade.trim()) {
      Alert.alert('Erro', 'Escola e série são obrigatórios');
      return;
    }

    const dateStr = selectedDate.date.toISOString().split('T')[0];
    
    try {
      // Salvar no banco de dados via API
      const classData = {
        date: selectedDate.date.toISOString(),
        school: classForm.school.trim(),
        grade: classForm.grade.trim(),
        subject: classForm.subject.trim() || null,
        time: classForm.time.trim() || null,
        notes: classForm.notes.trim() || null
      };

      const response = await apiService.createOrUpdateClass(classData);
      
      if (response.success) {
        // Atualizar estado local - adicionar nova aula às existentes para essa data
        const newClasses = { ...classes };
        if (!newClasses[dateStr]) {
          newClasses[dateStr] = [];
        }
        newClasses[dateStr].push(response.data);
        setClasses(newClasses);

        setIsModalVisible(false);
        setSelectedDate(null);
        
        Alert.alert('Sucesso', 'Aula salva com sucesso!');
      } else {
        throw new Error(response.message || 'Erro ao salvar aula');
      }
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar a aula');
    }
  };

  // Remover aula
  const removeClass = async (classId) => {
    if (!selectedDate || !classId) return;

    const dateStr = selectedDate.date.toISOString().split('T')[0];
    
    try {
      const response = await apiService.deleteClass(classId);
      
      if (response.success) {
        // Atualizar estado local - remover a aula específica
        const newClasses = { ...classes };
        if (newClasses[dateStr]) {
          newClasses[dateStr] = newClasses[dateStr].filter(cls => cls.id !== classId);
          if (newClasses[dateStr].length === 0) {
            delete newClasses[dateStr];
          }
        }
        setClasses(newClasses);

        Alert.alert('Sucesso', 'Aula removida com sucesso!');
      } else {
        throw new Error(response.message || 'Erro ao remover aula');
      }
    } catch (error) {
      console.error('Erro ao remover aula:', error);
      Alert.alert('Erro', error.message || 'Não foi possível remover a aula');
    }
  };

  // Obter ações importantes (aulas próximas não concluídas)
  const getImportantActions = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const actions = [];
    
    console.log('🔵 TeacherSchedule - Verificando ações importantes...');
    console.log('🔵 TeacherSchedule - Classes disponíveis:', Object.keys(classes));
    
    // Verificar aulas dos próximos 7 dias que não foram concluídas
    for (let i = 0; i <= 7; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      console.log('🔵 TeacherSchedule - Verificando data:', futureDateStr);
      
      if (classes[futureDateStr]) {
        const classesOnDate = classes[futureDateStr];
        console.log('🔵 TeacherSchedule - Aulas encontradas:', classesOnDate.length);
        
        // Verificar se há aulas não concluídas nesta data
        const incompleteClasses = classesOnDate.filter(classItem => !classItem.isCompleted);
        console.log('🔵 TeacherSchedule - Aulas não concluídas:', incompleteClasses.length);
        
        if (incompleteClasses.length > 0) {
          const dayName = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : `dia ${futureDate.getDate()}`;
          const classCount = incompleteClasses.length;
          const classText = classCount === 1 ? 'aula' : 'aulas';
          
          // Pegar informações da primeira aula não concluída
          const firstClass = incompleteClasses[0];
          const subject = firstClass.subject ? ` - ${firstClass.subject}` : '';
          
          actions.push({
            id: `day-${i}`,
            message: `Você tem ${classCount} ${classText} não concluída(s) ${dayName}${subject}. Preparar agora.`,
            date: futureDate,
            classes: incompleteClasses
          });
        }
      }
    }

    console.log('🔵 TeacherSchedule - Ações encontradas:', actions.length);
    return actions.slice(0, 3); // Máximo 3 ações
  };

  const importantActions = getImportantActions();

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
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>Muvz</Text>
            <View style={styles.logoAccent} />
          </View>
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
        <Text style={styles.title}>Agenda de aulas</Text>
        <Text style={styles.subtitle}>
          Veja quais dias você tem aulas para você se organizar melhor.
        </Text>

        {/* Important Actions - Moved up */}
        <Text style={styles.actionsTitle}>Ações importantes</Text>
        {importantActions.map((action) => (
          <TouchableOpacity 
            key={action.id} 
            style={styles.actionCard}
            onPress={() => {
              // Navegar para a aula específica quando clicado
              console.log('🔵 TeacherSchedule - Clicou na ação:', action);
              // Aqui você pode implementar navegação para a aula específica
            }}
          >
            <Text style={styles.actionText}>{action.message}</Text>
          </TouchableOpacity>
        ))}

        {importantActions.length === 0 && (
          <View style={styles.noActionsCard}>
            <Text style={styles.noActionsText}>
              Todas as suas aulas estão organizadas! 🎉
            </Text>
          </View>
        )}

        {/* Calendar Navigation */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {months[currentDate.getMonth()]}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendar}>
          {/* Week days header */}
          <View style={styles.weekDaysHeader}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                  const hasClassOnDate = hasClass(day.date);
                  const classInfo = getClassInfo(day.date);
                  const classCount = getClassCount(day.date);
                  
                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.dayCell,
                        !day.isCurrentMonth && styles.dayCellInactive,
                        hasClassOnDate && styles.dayCellWithClass,
                        hasClassOnDate && classInfo && styles.dayCellWithClassDark
                      ]}
                      onPress={() => openClassModal(day)}
                      disabled={!day.isCurrentMonth}
                    >
                      <Text style={[
                        styles.dayText,
                        !day.isCurrentMonth && styles.dayTextInactive,
                        hasClassOnDate && styles.dayTextWithClass
                      ]}>
                        {day.day}
                      </Text>
                      {hasClassOnDate && classInfo && (
                        <View style={styles.classInfo}>
                          {classCount > 1 ? (
                            <View style={styles.classCountContainer}>
                              <Text style={styles.classCountText}>
                                {classCount} aulas
                              </Text>
                            </View>
                          ) : (
                            <>
                              <Text style={styles.classText} numberOfLines={1}>
                                {classInfo[0]?.school}
                              </Text>
                              <Text style={styles.classText} numberOfLines={1}>
                                {classInfo[0]?.grade}
                              </Text>
                              {classInfo[0]?.time && (
                                <Text style={styles.classTimeText} numberOfLines={1}>
                                  {classInfo[0].time}
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>


                {/* Modal de Edição de Aula */}
                <Modal
                  visible={isModalVisible}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setIsModalVisible(false)}
                >
                  <View style={styles.modalOverlay}>
                    <ScrollView 
                      style={styles.modalScrollView}
                      contentContainerStyle={styles.modalScrollContent}
                      showsVerticalScrollIndicator={true}
                      indicatorStyle="black"
                      scrollEventThrottle={16}
                    >
                      <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>
                        {isEditing ? 'Gerenciar Aulas' : 'Nova Aula'}
                      </Text>
                      
                      {selectedDate && (
                        <Text style={styles.modalDate}>
                          {selectedDate.day} de {months[selectedDate.date.getMonth()]} de {selectedDate.date.getFullYear()}
                        </Text>
                      )}

                      {/* Lista de Aulas Existentes */}
                      {selectedDate && hasClass(selectedDate.date) && (
                        <View style={styles.existingClassesContainer}>
                          <Text style={styles.existingClassesTitle}>
                            Aulas existentes ({getClassCount(selectedDate.date)})
                          </Text>
                          <ScrollView style={styles.classesList} showsVerticalScrollIndicator={false}>
                            {getClassInfo(selectedDate.date).map((classItem, index) => (
                              <View key={index} style={styles.classItem}>
                                <View style={styles.classItemHeader}>
                                  <View style={styles.classItemInfo}>
                                    <Text style={styles.classItemSchool}>{classItem.school}</Text>
                                    <Text style={styles.classItemGrade}>{classItem.grade}</Text>
                                  </View>
                                  <TouchableOpacity
                                    style={styles.removeClassButton}
                                    onPress={() => removeClass(classItem.id)}
                                  >
                                    <Text style={styles.removeClassButtonText}>🗑️</Text>
                                  </TouchableOpacity>
                                </View>
                                {classItem.subject && (
                                  <Text style={styles.classItemSubject}>{classItem.subject}</Text>
                                )}
                                {classItem.time && (
                                  <Text style={styles.classItemTime}>🕐 {classItem.time}</Text>
                                )}
                                {classItem.notes && (
                                  <Text style={styles.classItemNotes} numberOfLines={2}>
                                    📝 {classItem.notes}
                                  </Text>
                                )}
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {/* Formulário para Nova Aula */}
                      <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Adicionar Nova Aula</Text>
                        
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Escola *</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Nome da escola"
                            value={classForm.school}
                            onChangeText={(text) => setClassForm(prev => ({ ...prev, school: text }))}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Série *</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ex: 5ª série, 1º ano"
                            value={classForm.grade}
                            onChangeText={(text) => setClassForm(prev => ({ ...prev, grade: text }))}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Matéria</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ex: Educação Física"
                            value={classForm.subject}
                            onChangeText={(text) => setClassForm(prev => ({ ...prev, subject: text }))}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Horário</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ex: 14:00 - 15:00"
                            value={classForm.time}
                            onChangeText={(text) => setClassForm(prev => ({ ...prev, time: text }))}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Observações</Text>
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Notas adicionais..."
                            value={classForm.notes}
                            onChangeText={(text) => setClassForm(prev => ({ ...prev, notes: text }))}
                            multiline
                            numberOfLines={3}
                          />
                        </View>
                      </View>

                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => setIsModalVisible(false)}
                        >
                          <Text style={styles.cancelButtonText}>Fechar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.saveButton}
                          onPress={saveClass}
                        >
                          <Text style={styles.saveButtonText}>Adicionar Aula</Text>
                        </TouchableOpacity>
                      </View>
                      </View>
                    </ScrollView>
                  </View>
                </Modal>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  logoAccent: {
    width: 4,
    height: 28,
    backgroundColor: '#F9BB55',
    marginLeft: 8,
    borderRadius: 2,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 3,
    backgroundColor: '#D9D9D9',
    borderRadius: 2,
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  calendar: {
    marginBottom: 30,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    width: (width - 40) / 7, // Largura fixa baseada na largura da tela
    textAlign: 'center',
    fontSize: 12,
    color: '#000',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dayCell: {
    width: (width - 40) / 7, // Largura fixa baseada na largura da tela
    aspectRatio: 1,
    backgroundColor: '#F9BB55',
    margin: 0.5,
    borderRadius: 7,
    padding: 4,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  dayCellInactive: {
    backgroundColor: '#F9BB55',
    opacity: 0.6,
  },
  dayCellWithClass: {
    backgroundColor: '#F9BB55',
  },
  dayCellWithClassDark: {
    backgroundColor: '#F2A154',
  },
  dayText: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  dayTextInactive: {
    opacity: 0.6,
  },
  dayTextWithClass: {
    color: '#000',
  },
  classInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  classText: {
    fontSize: 8,
    color: '#000',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 10,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    marginTop: 10,
    fontFamily: 'Poppins',
  },
  actionCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F9BB55',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 15,
    color: '#856404',
    fontFamily: 'Poppins',
    lineHeight: 20,
    fontWeight: '500',
  },
  noActionsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  noActionsText: {
    fontSize: 16,
    color: '#2E7D32',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollView: {
    maxHeight: '90%',
    width: '100%',
    maxWidth: 400,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalScrollContent: {
    flexGrow: 1,
    padding: 25,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  modalDate: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#000',
    marginBottom: 5,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F5F5F5',
    height: 45,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins',
    borderRadius: 8,
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
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#F9BB55',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  classTimeText: {
    fontSize: 7,
    color: '#000',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 8,
  },
  // Estilos para múltiplas aulas
  classCountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  classCountText: {
    fontSize: 8,
    color: '#000',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Estilos para lista de aulas existentes
  existingClassesContainer: {
    marginBottom: 20,
  },
  existingClassesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  classesList: {
    maxHeight: 150,
    marginBottom: 10,
  },
  classItem: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F9BB55',
  },
  classItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  classItemInfo: {
    flex: 1,
  },
  removeClassButton: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: '#FF4444',
    marginLeft: 10,
  },
  removeClassButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  classItemSchool: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  classItemGrade: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
  },
  classItemSubject: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 3,
  },
  classItemTime: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 3,
  },
  classItemNotes: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default TeacherScheduleScreen;
