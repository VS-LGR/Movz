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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


const SideMenu = ({ isVisible, onClose, onNavigate, currentUser, onLogout, userType = 'STUDENT' }) => {
  const slideAnim = React.useRef(new Animated.Value(screenWidth)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isVisible, slideAnim]);

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
        { id: 'perfil', title: 'Perfil', y: 200, height: 42, screen: 'home' },
        { id: 'myClass', title: 'Minha Turma', y: 269, height: 42, screen: 'myClass' },
        { id: 'ranking', title: 'Ranking', y: 339, height: 42, screen: 'ranking' },
        { id: 'chat', title: 'Chat', y: 408, height: 41, screen: 'chat' },
        { id: 'tutorial', title: 'Tutorial', y: 477, height: 42, screen: 'tutorial' },
        { id: 'logout', title: 'Sair', y: 546, height: 42, screen: 'logout' },
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
        {/* Background SVG */}
        <Image 
          source={require('../assets/images/SideMenu.svg')} 
          style={styles.backgroundSvg}
          resizeMode="cover"
        />

        {/* Close Button - Line 1 and Line 2 */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View style={styles.closeIcon}>
            <View style={[styles.closeLine, styles.closeLine1]} />
            <View style={[styles.closeLine, styles.closeLine2]} />
          </View>
        </TouchableOpacity>

        {/* User Profile Section */}
        <View style={styles.userProfile}>
          <Image
            source={require('../assets/images/aiAtivo 1logo.png')}
            style={styles.userAvatar}
            resizeMode="cover"
          />
          <Text style={styles.userGreeting}>
            Oi, {currentUser?.name || 'Usuário'}
          </Text>
        </View>

            {/* Menu Items with Gradient Borders */}
            {menuItems.map((item, index) => (
              <View key={item.id} style={[styles.menuItemContainer, { top: item.y - 23 }]}>
                {/* Top gradient line - simple gradient */}
                <View style={styles.menuItemBorderTop}>
                  <View style={styles.gradientLine} />
                </View>
                {/* Bottom gradient line - simple gradient */}
                <View style={styles.menuItemBorderBottom}>
                  <View style={styles.gradientLine} />
                </View>
                {/* Menu Item Text */}
                <TouchableOpacity 
                  style={[styles.menuItemTextContainer, { height: item.height }]}
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
              </View>
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
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: 23, // Exact Figma y position
    right: 0,
    width: 229, // Exact Figma width
    height: 570, // Exact Figma height
  },
  backgroundSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20, // 43 - 23 = 20
    right: 20, // 371 - 175 = 196, but we need it at right edge
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 18.38, // Exact Figma width
    height: 18.38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 18.38,
    height: 3, // Exact Figma strokeWeight
    backgroundColor: '#fff', // Exact Figma color
  },
  closeLine1: {
    transform: [{ rotate: '45deg' }],
  },
  closeLine2: {
    transform: [{ rotate: '-45deg' }],
  },
  userProfile: {
    position: 'absolute',
    top: 69, // 92 - 23 = 69
    left: 11, // 186 - 175 = 11
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 55, // Exact Figma width
    height: 55, // Exact Figma height
    borderRadius: 27.5,
  },
  userGreeting: {
    marginLeft: 15, // 256 - 186 - 55 = 15
    fontSize: 20,
    fontWeight: '600',
    color: '#fff', // Exact Figma color
  },
  menuItemContainer: {
    position: 'absolute',
    left: 3, // 178 - 175 = 3
    width: 226, // Exact Figma width
    backgroundColor: 'transparent', // Transparent background
  },
  menuItemBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  menuItemBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  gradientLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    // Simple gradient effect using boxShadow
    backgroundColor: 'rgba(47, 212, 205, 0.8)',
    boxShadow: '0px 0px 2px rgba(47, 212, 205, 0.6)',
  },
  menuItemTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff', // Exact Figma color
    textAlign: 'center',
  },
});

export default SideMenu;
