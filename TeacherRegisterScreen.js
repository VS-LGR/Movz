import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

const TeacherRegisterScreen = ({ onRegister, onNavigateToLogin }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    school: '',
    subject: '',
    cpf: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    
    // Formatar CPF enquanto digita
    if (field === 'cpf') {
      // Remove caracteres não numéricos
      const numbers = value.replace(/\D/g, '');
      // Aplica máscara XXX.XXX.XXX-XX
      if (numbers.length <= 11) {
        formattedValue = numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Função para validar CPF
  const isValidCPF = (cpf) => {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  const validateForm = () => {
    const errors = {};
    
    // Validar nome
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    // Validar email
    if (!formData.email.trim()) {
      errors.email = 'E-mail é obrigatório';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'E-mail inválido (exemplo: usuario@email.com)';
      }
    }
    
    // Validar senha
    if (!formData.password.trim()) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    } else if (formData.password.length > 50) {
      errors.password = 'Senha deve ter no máximo 50 caracteres';
    } else {
      const hasLetter = /[a-zA-Z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      
      if (!hasLetter || !hasNumber) {
        errors.password = 'Senha deve conter pelo menos uma letra e um número';
      }
    }
    
    // Validar CPF
    if (!formData.cpf.trim()) {
      errors.cpf = 'CPF é obrigatório';
    } else {
      const cpf = formData.cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
      if (cpf.length !== 11) {
        errors.cpf = 'CPF deve ter 11 dígitos';
      } else if (!isValidCPF(cpf)) {
        errors.cpf = 'CPF inválido';
      }
    }
    
    // Validar escola
    if (!formData.school.trim()) {
      errors.school = 'Escola é obrigatória';
    } else if (formData.school.trim().length < 2) {
      errors.school = 'Nome da escola deve ter pelo menos 2 caracteres';
    }
    
    // Validar matéria
    if (!formData.subject.trim()) {
      errors.subject = 'Matéria é obrigatória';
    } else if (formData.subject.trim().length < 2) {
      errors.subject = 'Matéria deve ter pelo menos 2 caracteres';
    }
    
    
    // Definir erros
    setFieldErrors(errors);
    
    // Se há erros, mostrar o primeiro
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      showError('❌ Dados inválidos', firstError);
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Adicionar userType
      const userDataToSend = {
        ...formData,
        userType: 'TEACHER'
      };
      
      const result = await onRegister(userDataToSend);
      
      if (result && result.success) {
        // Usar Alert para web
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`Sucesso: ${result.message}`);
        } else {
          showSuccess('Sucesso! 🎉', result.message);
          setTimeout(() => {
            onNavigateToLogin && onNavigateToLogin();
          }, 2000);
        }
        
        // Redirecionar automaticamente após 2 segundos
        setTimeout(() => {
          onNavigateToLogin && onNavigateToLogin();
        }, 2000);
        
      } else {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`Erro: Resposta inesperada do servidor - ${JSON.stringify(result)}`);
        } else {
          showError('❌ Erro', 'Resposta inesperada do servidor');
        }
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Erro: ${error.message || 'Erro ao salvar cadastro'}`);
      } else {
        showError('❌ Erro', error.message || 'Erro ao salvar cadastro');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Movz</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Cadastro de Professor</Text>
        <Text style={styles.subtitle}>Preencha os dados para criar sua conta</Text>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Nome */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome Completo</Text>
            <TextInput
              style={[styles.input, fieldErrors.name && styles.inputError]}
              placeholder="Digite seu nome completo"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
            {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
          </View>

          {/* E-mail */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={[styles.input, fieldErrors.email && styles.inputError]}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#666"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
          </View>

          {/* CPF */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CPF</Text>
            <TextInput
              style={[styles.input, fieldErrors.cpf && styles.inputError]}
              placeholder="Digite seu CPF"
              placeholderTextColor="#666"
              value={formData.cpf}
              onChangeText={(value) => handleInputChange('cpf', value)}
              keyboardType="numeric"
              maxLength={14}
            />
            {fieldErrors.cpf && <Text style={styles.errorText}>{fieldErrors.cpf}</Text>}
          </View>

          {/* Senha */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={[styles.input, fieldErrors.password && styles.inputError]}
              placeholder="Digite sua senha"
              placeholderTextColor="#666"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
            />
            {fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
          </View>

          {/* Escola */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Escola</Text>
            <TextInput
              style={[styles.input, fieldErrors.school && styles.inputError]}
              placeholder="Nome da escola onde leciona"
              placeholderTextColor="#666"
              value={formData.school}
              onChangeText={(value) => handleInputChange('school', value)}
            />
            {fieldErrors.school && <Text style={styles.errorText}>{fieldErrors.school}</Text>}
          </View>

          {/* Matéria */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Matéria</Text>
            <TextInput
              style={[styles.input, fieldErrors.subject && styles.inputError]}
              placeholder="Matéria que leciona (ex: Educação Física)"
              placeholderTextColor="#666"
              value={formData.subject}
              onChangeText={(value) => handleInputChange('subject', value)}
            />
            {fieldErrors.subject && <Text style={styles.errorText}>{fieldErrors.subject}</Text>}
          </View>

        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Cadastrando...' : 'Cadastrar Professor'}
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.loginLink}>Faça login</Text>
          </TouchableOpacity>
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
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
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
  saveButton: {
    backgroundColor: '#F9BB55',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#D9D9D9',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  inputError: {
    borderColor: '#FF4444',
    borderWidth: 2,
    backgroundColor: '#FFEEEE',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  loginLink: {
    fontSize: 16,
    color: '#F9BB55',
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
});

export default TeacherRegisterScreen;

