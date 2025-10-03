import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Storage from './utils/storage'; // Custom storage wrapper
import apiService from './services/apiService';
import useCustomAlert from './hooks/useCustomAlert';
import CustomAlert from './components/CustomAlert';
import LoginScreen from './screens/auth/LoginScreen';
import HomeScreen from './screens/student/HomeScreen';
import MyClassScreen from './screens/student/MyClassScreen';
import StudentScoresScreen from './screens/student/StudentScoresScreen';
import AttendanceScreen from './screens/student/AttendanceScreen';
import RankingScreen from './screens/student/RankingScreen';
import TutorialScreen from './screens/student/TutorialScreen';
import ChatScreen from './screens/student/ChatScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import TeacherRegisterScreen from './screens/auth/TeacherRegisterScreen';
import InstitutionRegisterScreen from './screens/auth/InstitutionRegisterScreen';
import InstitutionLoginScreen from './screens/auth/InstitutionLoginScreen';
import InstitutionDashboardScreen from './screens/institution/InstitutionDashboardScreen';
import TeacherClassesScreen from './screens/teacher/TeacherClassesScreen';
import MyClassesScreen from './screens/teacher/MyClassesScreen';
import TeacherScheduleScreen from './screens/teacher/TeacherScheduleScreen';
import ClassManagementScreen from './screens/teacher/ClassManagementScreen';
import CreateClassScreen from './screens/teacher/CreateClassScreen';
import ClassScreen from './screens/teacher/ClassScreen';
import AttendanceListScreen from './screens/teacher/AttendanceListScreen';
import AchievementsScreen from './screens/student/AchievementsScreen';
import MedalsScreen from './screens/student/MedalsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { alert, showError, hideAlert } = useCustomAlert();

  // Verificar status de autenticação ao carregar o app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Sempre iniciar na página de login
      setCurrentScreen('login');
      setIsAuthenticated(false);
      setCurrentUser(null);
      
      // Limpar dados de autenticação antigos
      await clearAuthData();
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      showError('⚠️ Erro de Inicialização', 'Ocorreu um erro ao inicializar o aplicativo. Tente recarregar a página.');
      await clearAuthData();
    }
  };

  const clearAuthData = async () => {
    await Storage.removeItem('authToken');
    await Storage.removeItem('userType');
    await Storage.removeItem('currentUser');
    apiService.clearToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentScreen('login');
  };

  const handleLogin = async (userData, userType) => {
    try {
      // Garantir que userType não seja undefined
      const finalUserType = userType || userData.userType || 'STUDENT';
      
      let response;
      
      // Se for instituição, usar a API específica de login de instituição
      if (finalUserType === 'INSTITUTION') {
        response = await apiService.loginInstitution(userData.email, userData.password);
      } else {
        response = await apiService.login(userData.email, userData.password, finalUserType);
      }
      
      
      if (response.success) {
        const { token, user, institution } = response.data;
        
        // Salvar dados de autenticação
        await Storage.setItem('authToken', token);
        await Storage.setItem('userType', finalUserType);
        await Storage.setItem('currentUser', JSON.stringify(institution || user));
        
        // Configurar token no serviço
        apiService.setToken(token);
        
        setCurrentUser(institution || user);
        setIsAuthenticated(true);
        
        // Navegar para a tela apropriada
        switch (finalUserType) {
          case 'STUDENT':
            setCurrentScreen('home');
            break;
          case 'TEACHER':
            setCurrentScreen('teacherClasses');
            break;
          case 'INSTITUTION':
            setCurrentScreen('institutionDashboard');
            break;
          default:
            setCurrentScreen('home');
        }
      } else {
        // Mostrar erro específico baseado na resposta
        const errorMessage = response.message || 'Erro no login';
        showError('❌ Erro no Login', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Tratar diferentes tipos de erro
      if (error.message.includes('Failed to fetch')) {
        showError('🌐 Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        showError('🔐 Credenciais Inválidas', 'Email ou senha incorretos. Verifique seus dados e tente novamente.');
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        showError('⚠️ Erro do Servidor', 'Ocorreu um erro interno. Tente novamente em alguns minutos.');
      } else {
        showError('❌ Erro no Login', error.message || 'Ocorreu um erro inesperado. Tente novamente.');
      }
      
      throw error;
    }
  };

  const handleInstitutionLogin = async (institutionData, userType) => {
    try {
      // Se institutionData já contém os dados da instituição (vem do login bem-sucedido)
      if (institutionData.id && institutionData.name) {
        // Configurar token do localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (token) {
          apiService.setToken(token);
          // Também salvar no Storage para consistência
          await Storage.setItem('authToken', token);
        }
        
        // Adicionar userType ao objeto da instituição
        const institutionWithType = {
          ...institutionData,
          userType: 'INSTITUTION'
        };
        
        setCurrentUser(institutionWithType);
        setIsAuthenticated(true);
        setCurrentScreen('institutionDashboard');
        return;
      }
      
      // Se institutionData contém email e senha (login inicial)
      const response = await apiService.loginInstitution(institutionData.email, institutionData.password);
      if (response.success) {
        // Salvar token
        await Storage.setItem('authToken', response.data.token);
        apiService.setToken(response.data.token);
        
        // Adicionar userType ao objeto da instituição
        const institutionWithType = {
          ...response.data.institution,
          userType: 'INSTITUTION'
        };
        
        setCurrentUser(institutionWithType);
        setIsAuthenticated(true);
        setCurrentScreen('institutionDashboard');
      } else {
        throw new Error(response.message || 'Erro no login da instituição');
      }
    } catch (error) {
      console.error('Institution login error:', error);
      throw error;
    }
  };

  const handleRegister = async (userData) => {
    try {
      const response = await apiService.register(userData);
      
      if (response.success) {
        // Retornar sucesso sem fazer login automático
        return { success: true, message: 'Estudante cadastrado com sucesso! Agora você pode fazer login.' };
      } else {
        throw new Error(response.message || 'Erro no cadastro');
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const handleTeacherRegister = async (userData) => {
    try {
      const response = await apiService.register({ ...userData, userType: 'TEACHER' });
      
      if (response.success) {
        // Retornar sucesso sem fazer login automático
        return { success: true, message: 'Professor cadastrado com sucesso! Agora você pode fazer login.' };
      } else {
        throw new Error(response.message || 'Erro no cadastro do professor');
      }
    } catch (error) {
      console.error('Teacher register error:', error);
      throw error;
    }
  };

  const handleInstitutionRegister = async (institutionData) => {
    try {
      const response = await apiService.registerInstitution(institutionData);
      
      if (response.success) {
        // Retornar sucesso sem fazer login automático
        return { success: true, message: 'Instituição cadastrada com sucesso! Agora você pode fazer login.' };
      } else {
        throw new Error(response.message || 'Erro no cadastro da instituição');
      }
    } catch (error) {
      console.error('Institution register error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAuthData();
      setCurrentScreen('login');
    }
  };

  const handleNavigate = (screen, params = null) => {
    if (screen === 'logout') {
      handleLogout();
    } else {
      // Armazenar parâmetros de navegação
      if (params) {
        window.navigationParams = params;
      } else {
        window.navigationParams = null;
      }
      setCurrentScreen(screen);
      setIsMenuVisible(false);
    }
  };

  const handleNavigateToRegister = () => {
    setCurrentScreen('register');
  };

  const handleNavigateToTeacherRegister = () => {
    setCurrentScreen('teacherRegister');
  };

  const handleNavigateToInstitutionRegister = () => {
    setCurrentScreen('institutionRegister');
  };

  const handleNavigateToInstitutionLogin = () => {
    setCurrentScreen('institutionLogin');
  };

  const handleNavigateToLogin = () => {
    setCurrentScreen('login');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            onLogin={handleLogin}
            onNavigateToRegister={handleNavigateToRegister}
            onNavigateToTeacherRegister={handleNavigateToTeacherRegister}
            onNavigateToInstitutionRegister={handleNavigateToInstitutionRegister}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onNavigate={handleNavigate}
            onRegister={handleRegister}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
      case 'teacherRegister':
        return (
          <TeacherRegisterScreen
            onRegister={handleTeacherRegister}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
      case 'institutionRegister':
        return (
          <InstitutionRegisterScreen
            onRegister={handleInstitutionRegister}
            onNavigateToLogin={handleNavigateToLogin}
            onNavigate={handleNavigate}
          />
        );
      case 'institutionLogin':
        return (
          <InstitutionLoginScreen
            onNavigate={handleNavigate}
            onLogin={handleInstitutionLogin}
          />
        );
      case 'institutionDashboard':
        return (
          <InstitutionDashboardScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'home':
        return (
          <HomeScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'myClass':
        return (
          <MyClassScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'studentScores':
        return (
          <StudentScoresScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'attendance':
        return (
          <AttendanceScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'achievements':
        return (
          <AchievementsScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'medals':
        return (
          <MedalsScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'ranking':
        return (
          <RankingScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'tutorial':
        return (
          <TutorialScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'chat':
        return (
          <ChatScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'teacherClasses':
        return (
          <TeacherClassesScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'myClasses':
        return (
          <MyClassesScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'teacherSchedule':
        return (
          <TeacherScheduleScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'classManagement':
        return (
          <ClassManagementScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'createClass':
        return (
          <CreateClassScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'class':
        return (
          <ClassScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'teacherProfile':
        return (
          <TeacherClassesScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'attendanceList':
        return (
          <AttendanceListScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <LoginScreen
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            onNavigate={handleNavigate}
            onLogin={handleLogin}
            onNavigateToRegister={handleNavigateToRegister}
            onNavigateToTeacherRegister={handleNavigateToTeacherRegister}
            onNavigateToInstitutionRegister={handleNavigateToInstitutionRegister}
          />
        );
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      {renderScreen()}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
    </>
  );
}
