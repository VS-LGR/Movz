import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Storage from './storage'; // Custom storage wrapper
import apiService from './apiService';
import LoginScreen from './LoginScreen';
import HomeScreen from './HomeScreen';
import RankingScreen from './RankingScreen';
import TutorialScreen from './TutorialScreen';
import ChatScreen from './ChatScreen';
import RegisterScreen from './RegisterScreen';
import TeacherRegisterScreen from './TeacherRegisterScreen';
import MedalsScreen from './MedalsScreen';
import AchievementsScreen from './AchievementsScreen';
import TeacherScheduleScreen from './TeacherScheduleScreen';
import TeacherClassesScreen from './TeacherClassesScreen';
import CreateClassScreen from './CreateClassScreen';
import ClassScreen from './ClassScreen';
import ClassManagementScreen from './ClassManagementScreen';
import InstitutionRegisterScreen from './InstitutionRegisterScreen';
import InstitutionLoginScreen from './InstitutionLoginScreen';
import InstitutionDashboardScreen from './InstitutionDashboardScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Verificar se há usuário logado ao iniciar o app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Verificar se há token salvo
      const token = await Storage.getItem('authToken');
      if (token) {
        apiService.setToken(token);
        
        // Verificar se o token ainda é válido
        const response = await apiService.verifyToken();
        if (response.success) {
          setCurrentUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Token inválido, limpar
          await Storage.removeItem('authToken');
          apiService.clearToken();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Em caso de erro, limpar token
      await Storage.removeItem('authToken');
      apiService.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (userData) => {
    try {
      const response = await apiService.login(userData.email, userData.password, userData.userType);
      if (response.success) {
        // Salvar token
        await Storage.setItem('authToken', response.data.token);
        apiService.setToken(response.data.token);
        
        setCurrentUser(response.data.user);
        setIsAuthenticated(true);
        setCurrentScreen('home');
      } else {
        // Se não foi sucesso, lançar erro com a mensagem da API
        throw new Error(response.message || 'Erro no login');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleInstitutionLogin = async (institutionData, userType) => {
    try {
      // Se institutionData já contém os dados da instituição (vem do login bem-sucedido)
      if (institutionData.id && institutionData.name) {
        // Configurar token do localStorage
        const token = localStorage.getItem('token');
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
        // Se não foi sucesso, lançar erro com a mensagem da API
        throw new Error(response.message || 'Erro no login da instituição');
      }
    } catch (error) {
      console.error('Institution login error:', error);
      throw error;
    }
  };

  const handleRegister = async (userData) => {
    console.log('🔵 App.js handleRegister chamado com:', userData);
    try {
      console.log('📡 Chamando apiService.register...');
      const response = await apiService.register(userData);
      console.log('📡 Resposta da API:', response);
      
      if (response.success) {
        console.log('✅ Cadastro bem-sucedido, redirecionando para login');
        // Após cadastro bem-sucedido, redirecionar para login
        setCurrentScreen('login');
        return { success: true, message: 'Cadastro realizado com sucesso! Agora você pode fazer login.' };
      } else {
        console.log('❌ Resposta não foi bem-sucedida:', response);
        throw new Error(response.message || 'Erro no cadastro');
      }
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      await Storage.removeItem('authToken');
      apiService.clearToken();
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('home');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navigateToScreen = (screen, params = {}) => {
    setCurrentScreen(screen);
    setIsMenuVisible(false);
    // Armazenar parâmetros para uso nas telas
    if (params && Object.keys(params).length > 0) {
      // Para este exemplo simples, vamos usar um estado global
      // Em uma aplicação real, você usaria React Navigation
      window.navigationParams = params;
    }
  };

  const navigateToRegister = () => {
    setCurrentScreen('register');
  };

  const navigateToTeacherRegister = () => {
    setCurrentScreen('teacherRegister');
  };

  const navigateToInstitutionRegister = () => {
    setCurrentScreen('institutionRegister');
  };

  const navigateToInstitutionLogin = () => {
    setCurrentScreen('institutionLogin');
  };

  const navigateToLogin = () => {
    setCurrentScreen('login');
    setShowSuccessMessage(true);
  };

  const renderScreen = () => {
    if (isLoading) {
      return null; // Ou um componente de loading
    }

    if (!isAuthenticated) {
      if (currentScreen === 'register') {
        return <RegisterScreen onRegister={handleRegister} onNavigateToLogin={navigateToLogin} />;
      }
      if (currentScreen === 'teacherRegister') {
        return <TeacherRegisterScreen onRegister={handleRegister} onNavigateToLogin={navigateToLogin} />;
      }
      if (currentScreen === 'institutionRegister') {
        return <InstitutionRegisterScreen onNavigate={navigateToScreen} onLogin={handleLogin} />;
      }
      if (currentScreen === 'institutionLogin') {
        return <InstitutionLoginScreen onNavigate={navigateToScreen} onLogin={handleInstitutionLogin} />;
      }
      return <LoginScreen 
        onLogin={handleLogin} 
        onNavigateToRegister={navigateToRegister} 
        onNavigateToTeacherRegister={navigateToTeacherRegister}
        onNavigateToInstitutionRegister={navigateToInstitutionRegister}
        onNavigateToInstitutionLogin={navigateToInstitutionLogin}
        showSuccessMessage={showSuccessMessage} 
        onSuccessMessageShown={() => setShowSuccessMessage(false)} 
      />;
    }

    switch (currentScreen) {
      case 'ranking':
        return <RankingScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} />;
      case 'tutorial':
        return <TutorialScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} />;
      case 'chat':
        return <ChatScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} />;
      case 'medals':
        return <MedalsScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} />;
      case 'achievements':
        return <AchievementsScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} />;
      case 'register':
        return <RegisterScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} onRegister={handleRegister} currentUser={currentUser} />;
      case 'schedule':
        return <TeacherScheduleScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} onLogout={handleLogout} />;
      case 'classes':
        return <TeacherClassesScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} onLogout={handleLogout} />;
      case 'createClass':
        return <CreateClassScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} onLogout={handleLogout} />;
      case 'class':
        return <ClassScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} onLogout={handleLogout} />;
      case 'classManagement':
        return <ClassManagementScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} onLogout={handleLogout} />;
      case 'institutionDashboard':
        return <InstitutionDashboardScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} onLogout={handleLogout} />;
      default:
        // Para professores, mostrar agenda como tela inicial
        if (currentUser && currentUser.userType === 'TEACHER') {
          return <TeacherScheduleScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} onLogout={handleLogout} />;
        }
        // Para instituições, mostrar dashboard
        if (currentUser && currentUser.userType === 'INSTITUTION') {
          return <InstitutionDashboardScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} onLogout={handleLogout} />;
        }
        return <HomeScreen isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onNavigate={navigateToScreen} currentUser={currentUser} onLogout={handleLogout} />;
    }
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor="#E9EEEE" />
      {renderScreen()}
    </>
  );
}