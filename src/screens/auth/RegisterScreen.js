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
  Image,
  Alert,
} from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import useCustomAlert from '../../hooks/useCustomAlert';
import useResponsive from '../../hooks/useResponsive';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ onNavigate, onRegister, onNavigateToLogin }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    school: '',
    class: '',
    email: '',
    password: '',
    cpf: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();
  const [fieldErrors, setFieldErrors] = useState({});

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
    
    // Validar idade
    if (!formData.age.trim()) {
      errors.age = 'Idade é obrigatória';
    } else {
      const age = parseInt(formData.age, 10);
      if (isNaN(age) || age < 1 || age > 120) {
        errors.age = 'Idade deve ser entre 1 e 120 anos';
      }
    }
    
    // Validar escola
    if (!formData.school.trim()) {
      errors.school = 'Escola é obrigatória';
    } else if (formData.school.trim().length < 2) {
      errors.school = 'Nome da escola deve ter pelo menos 2 caracteres';
    }
    
    // Validar turma
    if (!formData.class.trim()) {
      errors.class = 'Turma é obrigatória';
    } else if (formData.class.trim().length < 1) {
      errors.class = 'Turma deve ter pelo menos 1 caractere';
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
      // Converter age para número
      const userDataToSend = {
        ...formData,
        age: parseInt(formData.age, 10)
      };
      
      const result = await onRegister(userDataToSend);
      
      if (result && result.success) {
        // Usar CustomAlert para manter consistência visual
        showSuccess('Cadastro Realizado! 🎉', result.message);
        
        // Redirecionar após 1.5 segundos (tempo suficiente para ler a mensagem)
        setTimeout(() => {
          onNavigateToLogin && onNavigateToLogin();
        }, 1500);
        
      } else {
        showError('Erro no Cadastro', result?.message || 'Resposta inesperada do servidor');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      showError('Erro no Cadastro', error.message || 'Erro ao salvar cadastro');
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
        <Text style={styles.title}>Cadastro de Estudante</Text>
        <Text style={styles.subtitle}>Preencha os dados para criar sua conta</Text>

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/Logo.svg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

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

          {/* Idade */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Idade</Text>
            <TextInput
              style={[styles.input, fieldErrors.age && styles.inputError]}
              placeholder="Digite sua idade"
              placeholderTextColor="#666"
              value={formData.age}
              onChangeText={(value) => handleInputChange('age', value)}
              keyboardType="numeric"
            />
            {fieldErrors.age && <Text style={styles.errorText}>{fieldErrors.age}</Text>}
          </View>

          {/* Escola */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Escola</Text>
            <TextInput
              style={[styles.input, fieldErrors.school && styles.inputError]}
              placeholder="Digite o nome da sua escola"
              placeholderTextColor="#666"
              value={formData.school}
              onChangeText={(value) => handleInputChange('school', value)}
            />
            {fieldErrors.school && <Text style={styles.errorText}>{fieldErrors.school}</Text>}
          </View>

          {/* Turma */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Turma</Text>
            <TextInput
              style={[styles.input, fieldErrors.class && styles.inputError]}
              placeholder="Digite sua turma"
              placeholderTextColor="#666"
              value={formData.class}
              onChangeText={(value) => handleInputChange('class', value)}
            />
            {fieldErrors.class && <Text style={styles.errorText}>{fieldErrors.class}</Text>}
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
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Salvando...' : 'Criar Conta'}
          </Text>
        </TouchableOpacity>

        {/* Link para Login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.loginLink}>Fazer Login</Text>
          </TouchableOpacity>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  logoWrapper: {
    backgroundColor: 'transparent',
    borderRadius: 75,
    padding: 10,
    mixBlendMode: 'multiply',
  },
  logoImage: {
    width: 120,
    height: 120,
    opacity: 0.9,
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

export default RegisterScreen;
