import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import useCustomAlert from '../../hooks/useCustomAlert';
import CustomAlert from '../../components/CustomAlert';
import apiService from '../../services/apiService';

const AttendanceListScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser, onLogout }) => {
  // Valores fixos para evitar problemas com useResponsive
  const getPadding = () => 16;
  const getMargin = () => 12;
  const getFontSize = (mobile) => mobile;
  const getSpacing = (mobile) => mobile;
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();
  
  const [classData, setClassData] = useState(null);

  // Função para formatar data corretamente
  const formatDate = (date) => {
    if (typeof date === 'string') {
      // Converter string YYYY-MM-DD para formato brasileiro DD/MM/YYYY
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    } else if (date instanceof Date) {
      // Fallback para objetos Date
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return 'Data inválida';
  };
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  // REMOVIDO: Seletor de data desnecessário - a data vem da aula criada
  const [loading, setLoading] = useState(false);
  const [attendanceTaken, setAttendanceTaken] = useState(false);

  useEffect(() => {
    // Obter dados da turma dos parâmetros de navegação
    const params = window.navigationParams;
    console.log('🔵 AttendanceListScreen - Parâmetros recebidos:', params);
    
    if (params && params.classData) {
      console.log('🔵 AttendanceListScreen - classData:', params.classData);
      console.log('🔵 AttendanceListScreen - classData.classId:', params.classData.classId);
      console.log('🔵 AttendanceListScreen - classData.id:', params.classData.id);
      setClassData(params.classData);
    } else {
      console.log('🔴 AttendanceListScreen - Nenhum classData encontrado nos parâmetros');
    }
  }, []);

  useEffect(() => {
    if (classData) {
      console.log('🔵 AttendanceListScreen - Carregando alunos para classData:', classData);
      loadStudents();
    }
  }, [classData]);

  const loadStudents = async () => {
    if (!classData?.classId) {
      console.log('🔴 AttendanceListScreen - classData.classId não encontrado:', classData);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔵 AttendanceListScreen - Buscando alunos da turma:', classData.classId);
      const response = await apiService.getClassStudents(classData.classId);
      console.log('🔵 AttendanceListScreen - Resposta da API:', response);
      
      if (response.success) {
        console.log('🔵 AttendanceListScreen - Dados brutos da API:', response.data);
        
        // A API retorna classStudents com student dentro, precisamos extrair apenas os students
        const studentsData = response.data.map(classStudent => classStudent.student);
        console.log('🔵 AttendanceListScreen - Alunos extraídos:', studentsData);
        
        setStudents(studentsData);
        // Inicializar todos como presentes por padrão
        const initialAttendance = {};
        studentsData.forEach(student => {
          initialAttendance[student.id] = 'present';
        });
        setAttendanceData(initialAttendance);
        console.log('🔵 AttendanceListScreen - AttendanceData inicializado:', initialAttendance);
      } else {
        console.error('🔴 AttendanceListScreen - Erro na resposta da API:', response);
        showError('❌ Erro', 'Erro ao carregar alunos da turma');
      }
    } catch (error) {
      console.error('🔴 AttendanceListScreen - Erro ao carregar alunos:', error);
      showError('❌ Erro', 'Erro ao carregar alunos da turma');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForDate = async (date) => {
    if (!classData?.classId) return;
    
    try {
      setLoading(true);
      const response = await apiService.getClassAttendance(classData.classId, date);
      
      if (response.success) {
        const attendanceList = response.data.attendanceList || [];
        const newAttendanceData = {};
        
        students.forEach(student => {
          const attendance = attendanceList.find(a => a.student.id === student.id);
          if (attendance) {
            newAttendanceData[student.id] = attendance.isPresent ? 'present' : 'absent';
          } else {
            newAttendanceData[student.id] = 'present'; // Default
          }
        });
        
        setAttendanceData(newAttendanceData);
        setAttendanceTaken(attendanceList.length > 0);
      }
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
    } finally {
      setLoading(false);
    }
  };

  // REMOVIDO: handleDateChange - não é mais necessário

  const toggleAttendance = (studentId) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const takeAttendance = async () => {
    try {
      setLoading(true);
      
      if (!classData?.id) {
        showError('❌ Erro', 'Aula não está associada a uma turma');
        return;
      }

      // Preparar dados de presença
      const attendances = students.map(student => ({
        studentId: student.id,
        isPresent: attendanceData[student.id] === 'present',
        notes: null
      }));
      
      console.log('🔵 AttendanceListScreen - Dados de presença preparados:', attendances);

              // CORREÇÃO: Usar a data da aula corretamente
              // O classData.date agora é uma string no formato YYYY-MM-DD
              const lessonDate = typeof classData.date === 'string' ? classData.date : classData.date.toISOString().split('T')[0];
              console.log('🔵 AttendanceListScreen - Usando lessonDate:', lessonDate, 'para aula:', classData.date);
              console.log('🔵 AttendanceListScreen - classData.date original:', classData.date);
              console.log('🔵 AttendanceListScreen - classData.date tipo:', typeof classData.date);
              console.log('🔵 AttendanceListScreen - lessonDate final:', lessonDate);
              console.log('🔵 AttendanceListScreen - lessonDate tipo:', typeof lessonDate);
      
      const response = await apiService.saveBatchAttendance(classData.id, attendances, lessonDate);
      
      if (response.success) {
        setAttendanceTaken(true);
        showSuccess('Sucesso! 🎉', response.data.summary ? 
          `Chamada realizada: ${response.data.summary.present} presentes, ${response.data.summary.absent} faltas` :
          'Chamada realizada com sucesso!'
        );
        
        // CORREÇÃO: Retornar para a página da aula após salvar presença
        setTimeout(() => {
          onNavigate('class', { classData });
        }, 1500); // Aguardar 1.5 segundos para mostrar o sucesso
      } else {
        throw new Error(response.message || 'Erro ao realizar chamada');
      }
    } catch (error) {
      console.error('Erro ao realizar chamada:', error);
      showError('❌ Erro', error.message || 'Erro ao realizar chamada');
    } finally {
      setLoading(false);
    }
  };

  const presentCount = Object.values(attendanceData).filter(status => status === 'present').length;
  const absentCount = Object.values(attendanceData).filter(status => status === 'absent').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onNavigate('class', { classData })}
          >
            <Text style={styles.backButtonText}>← Voltar para Aula</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>
            Lista de Presença
          </Text>
          
          {classData && (
            <View style={styles.classInfo}>
              <Text style={styles.className}>
                {classData.name}
              </Text>
              <Text style={styles.classDetails}>
                {classData.school} - {classData.grade}
              </Text>
            </View>
          )}
        </View>

        {/* Data da Aula (Somente Leitura) */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>
            Data da Aula:
          </Text>
          
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>
              {classData ? formatDate(classData.date) : 'Carregando...'}
            </Text>
            <Text style={styles.dateInfoText}>📅 Data fixa da aula</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Resumo da Chamada
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {presentCount}
                </Text>
                <Text style={styles.statLabel}>
                  Presentes
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {absentCount}
                </Text>
                <Text style={styles.statLabel}>
                  Faltas
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {students.length}
                </Text>
                <Text style={styles.statLabel}>
                  Total
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Students List */}
        <View style={styles.studentsSection}>
          <Text style={styles.sectionTitle}>
            Alunos ({students.length})
          </Text>
          
          {students.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={[
                styles.studentCard,
                attendanceData[student.id] === 'absent' && styles.studentCardAbsent
              ]}
              onPress={() => toggleAttendance(student.id)}
            >
              <View style={styles.studentInfo}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>
                    {student.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>
                    {student.name}
                  </Text>
                  <Text style={styles.studentEmail}>
                    {student.email}
                  </Text>
                </View>
              </View>
              
              <View style={styles.attendanceStatus}>
                {attendanceData[student.id] === 'present' ? (
                  <Text style={styles.statusPresent}>
                    ✅ Presente
                  </Text>
                ) : (
                  <Text style={styles.statusAbsent}>
                    ❌ Falta
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.takeAttendanceButton,
              loading && styles.takeAttendanceButtonDisabled
            ]}
            onPress={takeAttendance}
            disabled={loading}
          >
            <Text style={styles.takeAttendanceButtonText}>
              {loading ? 'Salvando...' : attendanceTaken ? 'Atualizar Chamada' : 'Realizar Chamada'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* REMOVIDO: Modal do DatePicker - não é mais necessário */}

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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F9BB55',
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  classInfo: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
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
  },
  dateSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins',
  },
  dateInfoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: 'Poppins',
  },
  dateButtonText: {
    fontSize: 20,
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryStats: {
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
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 5,
  },
  studentsSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentCardAbsent: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFE5E5',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9BB55',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
  },
  attendanceStatus: {
    alignItems: 'center',
  },
  statusPresent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontFamily: 'Poppins',
  },
  statusAbsent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E53E3E',
    fontFamily: 'Poppins',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  takeAttendanceButton: {
    backgroundColor: '#F9BB55',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  takeAttendanceButtonDisabled: {
    backgroundColor: '#D9D9D9',
  },
  takeAttendanceButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 15,
    textAlign: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Poppins',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonPrimary: {
    backgroundColor: '#F9BB55',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  modalButtonTextPrimary: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default AttendanceListScreen;
