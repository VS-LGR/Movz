import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import useCustomAlert from '../../hooks/useCustomAlert';
import apiService from '../../services/apiService';
import useResponsive from '../../hooks/useResponsive';

const InstitutionRegisterScreen = ({ onNavigate, onLogin }) => {
  const { isMobile, isTablet, isDesktop, getPadding, getMargin, getFontSize, getSpacing } = useResponsive();
  
  // Função para obter estilos responsivos dos inputs
  const getInputStyle = () => ({
    ...styles.input,
    fontSize: getFontSize(14, 16, 18),
    paddingVertical: getSpacing(10, 12, 14),
    paddingHorizontal: getSpacing(12, 15, 18),
    marginBottom: getSpacing(12, 15, 18)
  });
  
  // Função para obter estilos responsivos das seções
  const getSectionStyle = () => ({
    ...styles.section,
    marginBottom: getSpacing(20, 30, 40)
  });
  
  // Função para obter estilos responsivos dos títulos
  const getSectionTitleStyle = () => ({
    ...styles.sectionTitle,
    fontSize: getFontSize(16, 18, 20),
    marginBottom: getSpacing(12, 15, 18)
  });
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { alert, showSuccess, showError, hideAlert } = useCustomAlert();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, cnpj, email, password, confirmPassword } = formData;

    if (!name.trim()) {
      showError('❌ Campo Obrigatório', 'Nome da instituição é obrigatório');
      return false;
    }

    if (!cnpj.trim()) {
      showError('❌ Campo Obrigatório', 'CNPJ é obrigatório');
      return false;
    }

    // Validar formato do CNPJ (básico)
    const cnpjNumbers = cnpj.replace(/\D/g, '');
    if (cnpjNumbers.length !== 14) {
      showError('❌ CNPJ Inválido', `CNPJ deve ter 14 dígitos. Você digitou ${cnpjNumbers.length} dígitos.`);
      return false;
    }

    if (!email.trim()) {
      showError('❌ Campo Obrigatório', 'Email é obrigatório');
      return false;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('❌ Email Inválido', 'Digite um email válido');
      return false;
    }

    if (!password.trim()) {
      showError('❌ Campo Obrigatório', 'Senha é obrigatória');
      return false;
    }

    if (password.length < 6) {
      showError('❌ Senha Fraca', 'Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (password !== confirmPassword) {
      showError('❌ Senhas Diferentes', 'As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const { confirmPassword, ...institutionData } = formData;

      const response = await apiService.registerInstitution(institutionData);

      if (response.success) {
        // Mostrar pop-up de sucesso
        showSuccess('Sucesso! 🎉', 'Instituição cadastrada com sucesso!\n\nAgora você pode fazer login com suas credenciais.');
        
        // Limpar formulário
        setFormData({
          name: '',
          cnpj: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          description: ''
        });
        
        // Navegar para login inicial após 1.5 segundos
        setTimeout(() => {
          onNavigate('login');
        }, 1500);
      } else {
        // Tratar erros específicos da API
        let errorMessage = 'Erro ao cadastrar instituição';
        
        if (response.message) {
          if (response.message.includes('CNPJ ou email já cadastrado')) {
            errorMessage = '❌ CNPJ ou email já cadastrado\n\nVerifique se os dados informados já não estão em uso.';
          } else if (response.message.includes('obrigatórios')) {
            errorMessage = '❌ Campos obrigatórios\n\n' + response.message;
          } else {
            errorMessage = '❌ ' + response.message;
          }
        }
        
        // Mostrar pop-up de erro
        showError('❌ Erro no Cadastro', errorMessage);
      }
    } catch (error) {
      console.error('Erro ao cadastrar instituição:', error);
      
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
      
      showError('❌ Erro no Cadastro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fixo */}
      <View style={[styles.header, { 
        paddingHorizontal: getPadding(),
        paddingTop: getSpacing(10, 15, 20),
        paddingBottom: getSpacing(15, 20, 25)
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate('login')}
        >
          <Text style={[styles.backButtonText, { fontSize: getFontSize(14, 16, 18) }]}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: getFontSize(24, 28, 32) }]}>Cadastro de Instituição</Text>
      </View>

      {/* Formulário com Scroll */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.formContent, { paddingHorizontal: getPadding() }]}>
          {/* Informações Básicas */}
          <View style={getSectionStyle()}>
            <Text style={getSectionTitleStyle()}>Informações Básicas</Text>
            
            <TextInput
              style={getInputStyle()}
              placeholder="Nome da Instituição *"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholderTextColor="#999"
            />

            <TextInput
              style={getInputStyle()}
              placeholder="CNPJ *"
              value={formData.cnpj}
              onChangeText={(text) => handleInputChange('cnpj', text)}
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <TextInput
              style={getInputStyle()}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={getInputStyle()}
              placeholder="Senha *"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              placeholderTextColor="#999"
              secureTextEntry
            />

            <TextInput
              style={getInputStyle()}
              placeholder="Confirmar Senha *"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>

          {/* Informações de Contato */}
          <View style={getSectionStyle()}>
            <Text style={getSectionTitleStyle()}>Informações de Contato</Text>
            
            <TextInput
              style={getInputStyle()}
              placeholder="Telefone"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />

            <TextInput
              style={getInputStyle()}
              placeholder="Endereço"
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholderTextColor="#999"
            />

            <View style={[styles.row, { gap: getSpacing(8, 10, 12) }]}>
              <TextInput
                style={[getInputStyle(), styles.halfInput]}
                placeholder="Cidade"
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholderTextColor="#999"
              />

              <TextInput
                style={[getInputStyle(), styles.halfInput]}
                placeholder="Estado"
                value={formData.state}
                onChangeText={(text) => handleInputChange('state', text)}
                placeholderTextColor="#999"
                maxLength={2}
              />
            </View>

            <TextInput
              style={getInputStyle()}
              placeholder="CEP"
              value={formData.zipCode}
              onChangeText={(text) => handleInputChange('zipCode', text)}
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Descrição */}
          <View style={getSectionStyle()}>
            <Text style={getSectionTitleStyle()}>Descrição</Text>
            
            <TextInput
              style={[getInputStyle(), styles.textArea, { 
                height: getSpacing(80, 100, 120),
                textAlignVertical: 'top'
              }]}
              placeholder="Descrição da instituição (opcional)"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Botão de Cadastro - Posicionamento absoluto */}
      <View style={[styles.buttonContainer, { 
        paddingHorizontal: getPadding(),
        paddingBottom: getSpacing(20, 30, 40)
      }]}>
        <TouchableOpacity
          style={[styles.registerButton, isLoading && styles.disabledButton, {
            paddingVertical: getSpacing(12, 15, 18)
          }]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={[styles.registerButtonText, { 
            fontSize: getFontSize(16, 18, 20) 
          }]}>
            {isLoading ? 'Cadastrando...' : 'Cadastrar Instituição'}
          </Text>
        </TouchableOpacity>

        {/* Link para Login */}
        <View style={[styles.loginLink, { marginTop: getSpacing(10, 15, 20) }]}>
          <Text style={[styles.loginText, { fontSize: getFontSize(14, 16, 18) }]}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={() => onNavigate('institutionLogin')}>
            <Text style={[styles.loginLinkText, { fontSize: getFontSize(14, 16, 18) }]}>Fazer Login</Text>
          </TouchableOpacity>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#E8EDED',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    zIndex: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F9BB55',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  form: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    marginBottom: 15,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  // Estilos responsivos
  '@media (max-width: 768px)': {
    row: {
      flexDirection: 'column',
      gap: 0,
    },
    halfInput: {
      flex: 1,
      marginBottom: 15,
    },
  },
  halfInput: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E8EDED',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  registerButton: {
    backgroundColor: '#F9BB55',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
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
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  loginLinkText: {
    fontSize: 16,
    color: '#F9BB55',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
});

export default InstitutionRegisterScreen;
