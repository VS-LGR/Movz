import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const CustomModal = ({
  visible,
  onClose,
  title,
  message,
  type = 'info', // 'info', 'success', 'warning', 'error'
  buttons = [],
  showCloseButton = true,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          iconColor: '#4CAF50',
          titleColor: '#2E7D32',
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconColor: '#FF9800',
          titleColor: '#F57C00',
        };
      case 'error':
        return {
          icon: '❌',
          iconColor: '#F44336',
          titleColor: '#D32F2F',
        };
      default:
        return {
          icon: 'ℹ️',
          iconColor: '#2196F3',
          titleColor: '#1976D2',
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.icon}>{typeStyles.icon}</Text>
              <Text style={[styles.title, { color: typeStyles.titleColor }]}>
                {title}
              </Text>
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            {buttons.length > 0 && (
              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      button.style === 'primary' && styles.primaryButton,
                      button.style === 'secondary' && styles.secondaryButton,
                      button.style === 'danger' && styles.dangerButton,
                      button.style === 'success' && styles.successButton,
                    ]}
                    onPress={button.onPress}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        button.style === 'primary' && styles.primaryButtonText,
                        button.style === 'secondary' && styles.secondaryButtonText,
                        button.style === 'danger' && styles.dangerButtonText,
                        button.style === 'success' && styles.successButtonText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContent: {
    padding: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins',
    lineHeight: 24,
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#F9BB55',
  },
  secondaryButton: {
    backgroundColor: '#E0E0E0',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  primaryButtonText: {
    color: '#000',
  },
  secondaryButtonText: {
    color: '#666',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  successButtonText: {
    color: '#FFFFFF',
  },
});

export default CustomModal;
