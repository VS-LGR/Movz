import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import useCustomAlert from '../../hooks/useCustomAlert';
import apiService from '../../services/apiService';
import useResponsive from '../../hooks/useResponsive';

const InstitutionLoginScreen = ({ onNavigate, onLogin }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = async () => {
    const { email, password } = formData;

    if (!email.trim() || !password.trim()) {
      showError('❌ Campos Obrigatórios', 'Email e senha são obrigatórios');
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('❌ Email Inválido', 'Digite um email válido');
      return;
    }

    try {
      setIsLoading(true);

      console.log('🔵 Enviando dados para API:', { email, password });
      const response = await apiService.loginInstitution(email, password);
      console.log('🔵 Resposta da API:', response);

      if (response.success) {
        // Armazenar token e dados da instituição
        const { token, institution } = response.data;
        
        // Simular armazenamento do token (em uma app real, usar AsyncStorage)
        localStorage.setItem('token', token);
        localStorage.setItem('userType', 'INSTITUTION');
        localStorage.setItem('currentUser', JSON.stringify(institution));

        // Mostrar pop-up de sucesso
        showSuccess('Sucesso! 🎉', `Bem-vindo(a), ${institution.name}!\n\nLogin realizado com sucesso.`);
        
        // Navegar para a tela principal da instituição
        setTimeout(() => {
          // Navegar diretamente sem fazer nova chamada à API
          onLogin(institution, 'INSTITUTION');
        }, 2000); // Aguardar 2 segundos para mostrar a mensagem de sucesso
      } else {
        // Tratar erros específicos da API
        let errorMessage = 'Erro ao fazer login';
        
        if (response.message) {
          if (response.message.includes('credenciais inválidas') || response.message.includes('senha incorreta')) {
            errorMessage = '❌ Credenciais inválidas\n\nVerifique seu email e senha.';
          } else if (response.message.includes('não encontrada') || response.message.includes('não existe')) {
            errorMessage = '❌ Instituição não encontrada\n\nVerifique se o email está correto.';
          } else if (response.message.includes('inativa') || response.message.includes('desativada')) {
            errorMessage = '❌ Conta inativa\n\nEntre em contato com o suporte.';
          } else {
            errorMessage = '❌ ' + response.message;
          }
        }
        
        // Mostrar pop-up de erro
        showError('❌ Erro no Login', errorMessage);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Tratar erros de rede ou outros erros
      let errorMessage = 'Erro ao conectar com o servidor';
      
      if (error.message) {
        if (error.message.includes('Network Error') || error.message.includes('fetch')) {
          errorMessage = '❌ Erro de conexão\n\nVerifique sua internet e tente novamente.';
        } else if (error.message.includes('timeout')) {
          errorMessage = '❌ Tempo esgotado\n\nO servidor demorou para responder. Tente novamente.';
        } else {
          errorMessage = '❌ ' + error.message;
        }
      }
      
      showError('❌ Erro no Login', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/Logo.svg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onNavigate('login')}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Login da Instituição</Text>
          <Text style={styles.subtitle}>
            Acesse sua conta institucional
          </Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            placeholderTextColor="#999"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          {/* Links */}
          <View style={styles.links}>
            <TouchableOpacity onPress={() => onNavigate('institutionRegister')}>
              <Text style={styles.linkText}>Não tem uma conta? Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logoWrapper: {
    backgroundColor: 'transparent',
    borderRadius: 65,
    padding: 8,
    // Aplicar multiply blend mode no container
    mixBlendMode: 'multiply',
  },
  logoImage: {
    width: 130,
    height: 130,
    opacity: 0.9,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F9BB55',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loginButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  links: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    color: '#F9BB55',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
});

export default InstitutionLoginScreen;
