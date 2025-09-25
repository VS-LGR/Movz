import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

const CustomAlert = ({ visible, title, message, onClose, type = 'info' }) => {
  if (!visible) return null;

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: styles.successContainer,
          title: styles.successTitle,
          icon: '✅',
          button: styles.successButton
        };
      case 'error':
        return {
          container: styles.errorContainer,
          title: styles.errorTitle,
          icon: '',
          button: styles.errorButton
        };
      case 'warning':
        return {
          container: styles.warningContainer,
          title: styles.warningTitle,
          icon: '⚠️',
          button: styles.warningButton
        };
      default:
        return {
          container: styles.infoContainer,
          title: styles.infoTitle,
          icon: 'ℹ️',
          button: styles.infoButton
        };
    }
  };

  const alertStyles = getAlertStyles();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.alertContainer, alertStyles.container]}>
        <View style={styles.header}>
          {alertStyles.icon && <Text style={styles.icon}>{alertStyles.icon}</Text>}
          <Text style={[styles.title, alertStyles.title]}>{title}</Text>
        </View>
          
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, alertStyles.button]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    minWidth: 300,
    maxWidth: 400,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    fontFamily: 'Poppins',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    fontFamily: 'Poppins',
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  // Success styles - Verde suave do app
  successContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  successTitle: {
    color: '#2E7D32',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  // Error styles - Vermelho suave do app
  errorContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
    backgroundColor: '#FFF5F5',
  },
  errorTitle: {
    color: '#C53030',
  },
  errorButton: {
    backgroundColor: '#E53E3E',
  },
  // Warning styles - Laranja do app (similar ao F9BB55)
  warningContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#F9BB55',
    backgroundColor: '#FFFBF0',
  },
  warningTitle: {
    color: '#D69E2E',
  },
  warningButton: {
    backgroundColor: '#F9BB55',
  },
  // Info styles - Azul suave do app
  infoContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#3182CE',
    backgroundColor: '#F7FAFC',
  },
  infoTitle: {
    color: '#2C5282',
  },
  infoButton: {
    backgroundColor: '#3182CE',
  },
});

export default CustomAlert;
