// Sistema de armazenamento compatível com web e mobile
import { Platform } from 'react-native';

class Storage {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        // Para React Native, usar AsyncStorage quando disponível
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        // Para React Native, usar AsyncStorage quando disponível
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  }

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        // Para React Native, usar AsyncStorage quando disponível
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }
}

export default new Storage();
