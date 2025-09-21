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
import MedalsScreen from './MedalsScreen';
import AchievementsScreen from './AchievementsScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home');
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
      const response = await apiService.login(userData.email, userData.password);
      if (response.success) {
        // Salvar token
        await Storage.setItem('authToken', response.data.token);
        apiService.setToken(response.data.token);
        
        setCurrentUser(response.data.user);
        setIsAuthenticated(true);
        setCurrentScreen('home');
      }
    } catch (error) {
      console.error('Login error:', error);
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

  const navigateToScreen = (screen) => {
    setCurrentScreen(screen);
    setIsMenuVisible(false);
  };

  const navigateToRegister = () => {
    setCurrentScreen('register');
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
      return <LoginScreen onLogin={handleLogin} onNavigateToRegister={navigateToRegister} showSuccessMessage={showSuccessMessage} onSuccessMessageShown={() => setShowSuccessMessage(false)} />;
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
      default:
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