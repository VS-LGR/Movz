import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import CustomAlert from './CustomAlert';
import useCustomAlert from './useCustomAlert';
import useResponsive from './useResponsive';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ onLogin, onNavigateToRegister, onNavigateToTeacherRegister, onNavigateToInstitutionRegister, onNavigateToInstitutionLogin, showSuccessMessage, onSuccessMessageShown }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();

  // Mostrar mensagem de sucesso quando vier do cadastro
  useEffect(() => {
    if (showSuccessMessage) {
      showSuccess(
        'Cadastro Realizado!', 
        'Sua conta foi criada com sucesso. Agora você pode fazer login.'
      );
      onSuccessMessageShown && onSuccessMessageShown();
    }
  }, [showSuccessMessage, onSuccessMessageShown, showSuccess]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showError('❌ Campos Obrigatórios', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      await onLogin({ email, password, userType });
    } catch (error) {
      showError('❌ Erro no Login', error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Movz</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Bem-vindo de volta!</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>

        {/* User Type Selection */}
        <View style={styles.userTypeContainer}>
          <Text style={styles.userTypeLabel}>Tipo de usuário:</Text>
          <View style={styles.userTypeButtons}>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === 'STUDENT' && styles.userTypeButtonActive]}
              onPress={() => setUserType('STUDENT')}
            >
              <Text style={[styles.userTypeButtonText, userType === 'STUDENT' && styles.userTypeButtonTextActive]}>
                Estudante
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === 'TEACHER' && styles.userTypeButtonActive]}
              onPress={() => setUserType('TEACHER')}
            >
              <Text style={[styles.userTypeButtonText, userType === 'TEACHER' && styles.userTypeButtonTextActive]}>
                Professor
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Register Links */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Não tem uma conta? </Text>
          <View style={styles.registerButtons}>
            {/* Primeira linha - Estudante e Professor (topo do triângulo) */}
            <View style={[styles.registerRow, { gap: getSpacing(15, 20, 25) }]}>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={[styles.registerLink, { 
                  fontSize: getFontSize(16, 18, 20),
                  minWidth: getSpacing(120, 140, 160)
                }]}>Cadastre-se (Estudante)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onNavigateToTeacherRegister}>
                <Text style={[styles.registerLink, { 
                  fontSize: getFontSize(16, 18, 20),
                  minWidth: getSpacing(120, 140, 160)
                }]}>Cadastre-se (Professor)</Text>
              </TouchableOpacity>
            </View>
            
            {/* Segunda linha - Instituição (base do triângulo) */}
            <View style={styles.registerRow}>
              <TouchableOpacity onPress={onNavigateToInstitutionRegister}>
                <Text style={[styles.registerLink, { 
                  fontSize: getFontSize(16, 18, 20),
                  minWidth: getSpacing(160, 180, 200)
                }]}>Cadastre-se (Instituição)</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.institutionLogin}>
            <Text style={styles.institutionText}>Já tem uma instituição? </Text>
            <TouchableOpacity onPress={onNavigateToInstitutionLogin}>
              <Text style={styles.institutionLink}>Login da Instituição</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Poppins',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    height: 50,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  loginButton: {
    backgroundColor: '#F9BB55',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#D9D9D9',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  registerButtons: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  registerRow: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  registerLink: {
    fontSize: 14,
    color: '#F9BB55',
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
  },
  institutionLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  institutionText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  institutionLink: {
    color: '#F9BB55',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    textDecorationLine: 'underline',
  },
  userTypeContainer: {
    marginBottom: 30,
  },
  userTypeLabel: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  userTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
  },
  userTypeButtonActive: {
    backgroundColor: '#F9BB55',
    borderColor: '#F9BB55',
  },
  userTypeButtonText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  userTypeButtonTextActive: {
    color: '#000',
  },
});

export default LoginScreen;