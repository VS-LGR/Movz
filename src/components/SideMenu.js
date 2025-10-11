import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { getCachedImage } from '../utils/imageCache';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


const SideMenu = ({ isVisible, onClose, onNavigate, currentUser, onLogout, userType = 'STUDENT' }) => {
  const slideAnim = React.useRef(new Animated.Value(screenWidth)).current;
  const editButtonScale = React.useRef(new Animated.Value(1)).current;
  const editButtonShadow = React.useRef(new Animated.Value(0)).current;

  // Funções de animação do botão de edição
  const handleEditButtonPressIn = () => {
    Animated.parallel([
      Animated.spring(editButtonScale, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(editButtonShadow, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleEditButtonPressOut = () => {
    Animated.parallel([
      Animated.spring(editButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(editButtonShadow, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  React.useEffect(() => {
    if (isVisible) {
      // Disable scroll when menu is open
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Re-enable scroll when menu is closed
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    // Cleanup function to ensure scroll is re-enabled
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const getMenuItems = () => {
    if (userType === 'TEACHER') {
      return [
        { id: 'agenda', title: 'Agenda de Aulas', y: 200, height: 42, screen: 'teacherSchedule' },
        { id: 'classes', title: 'Minhas Aulas', y: 269, height: 42, screen: 'teacherClasses' },
        { id: 'myClasses', title: 'Minhas Turmas', y: 339, height: 42, screen: 'myClasses' },
        { id: 'perfil', title: 'Meus Dados', y: 408, height: 42, screen: 'teacherProfile' },
        { id: 'logout', title: 'Sair', y: 477, height: 42, screen: 'logout' },
      ];
    } else if (userType === 'INSTITUTION') {
      return [
        { id: 'logout', title: 'Sair', y: 200, height: 42, screen: 'logout' },
      ];
    } else {
      // STUDENT
      return [
        { id: 'perfil', title: 'Perfil', y: 220, height: 42, screen: 'home' },
        { id: 'myClass', title: 'Minha Turma', y: 300, height: 42, screen: 'myClass' },
        { id: 'tutorial', title: 'Treinos', y: 380, height: 42, screen: 'tutorial' },
        { id: 'logout', title: 'Sair', y: 460, height: 42, screen: 'logout' },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.menuContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Main Background */}
        <View style={styles.background} />
        
        {/* Half Circle - Perfectly connected to rectangle */}
        <View style={styles.halfCircle} />
        
        {/* Close Button X in bottom circle */}
        <TouchableOpacity style={styles.bottomCloseButton} onPress={onClose}>
          <Text style={styles.closeX}>×</Text>
        </TouchableOpacity>

        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={require('../assets/images/Logo.svg')}
            style={styles.userAvatar}
            resizeMode="contain"
          />
        </View>

     

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.menuItem, { top: item.y }]}
            onPress={() => {
              if (item.screen === 'logout') {
                onLogout && onLogout();
              } else {
                onNavigate && onNavigate(item.screen);
              }
            }}
          >
            <Text style={styles.menuItemText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Simple backdrop blur
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 195,
    height: screenHeight,
    zIndex: 1000, // Ensure it's above other content
    // Force positioning to right side
    left: 'auto',
    transform: [{ translateX: 0 }], // Reset any transforms
  },
  // Simple background
  background: {
    position: 'absolute',
    top: 0,
    left: 27,
    width: 168,
    height: '100%',
    backgroundColor: '#F19341', // Solid orange color
    boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  // Half circle - connected to left side of rectangle
  halfCircle: {
    position: 'absolute',
    bottom: 30,
    left: 0, // Starts from the left edge
    width: 28, // Half width for half circle
    height: 56, // Full height for half circle
    backgroundColor: '#F19341',
    borderTopLeftRadius: 28, // Only top-left corner rounded
    borderBottomLeftRadius: 28, // Only bottom-left corner rounded
    // No right radius to create perfect connection with rectangle
    // Shadow only on the left curved edge - no shadow on straight right side
    boxShadow: '-3px 0 4px rgba(0, 0, 0, 0.15)',
    elevation: 8, // Same as rectangle for continuity
  },
  // Close button in half circle - clean and centered
  bottomCloseButton: {
    position: 'absolute',
    bottom: 47, // Perfect center: 30 + 28 - 15 = 43
    left: 13, // Perfect center: 0 + 28 - 15 = 13, adjusted to 14
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // No background, no border radius - clean X only
  },
  closeX: {
    fontSize: 24, // Larger X
    color: '#fff',
    fontWeight: 'bold',
  },
  // Avatar container
  avatarContainer: {
    position: 'absolute',
    top: 40,
    left: 70,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  // Small circles row
  smallCirclesRow: {
    position: 'absolute',
    top: 140,
    left: 27,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 168,
    paddingHorizontal: 8,
  },
  smallCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  circleButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  editIcon: {
    width: 22,
    height: 22,
  },
  // Menu items
  menuItem: {
    position: 'absolute',
    left: 27,
    width: 168,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
});

export default SideMenu;
