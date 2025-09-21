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

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ onLogin, onNavigateToRegister, showSuccessMessage, onSuccessMessageShown }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mostrar mensagem de sucesso quando vier do cadastro
  useEffect(() => {
    if (showSuccessMessage) {
      Alert.alert(
        'Cadastro Realizado!', 
        'Sua conta foi criada com sucesso. Agora você pode fazer login.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccessMessageShown && onSuccessMessageShown();
            }
          }
        ]
      );
    }
  }, [showSuccessMessage, onSuccessMessageShown]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      await onLogin({ email, password });
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao fazer login');
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

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Não tem uma conta? </Text>
          <TouchableOpacity onPress={onNavigateToRegister}>
            <Text style={styles.registerLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  registerLink: {
    fontSize: 16,
    color: '#F9BB55',
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
});

export default LoginScreen;