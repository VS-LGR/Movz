import React, { useEffect, useRef } from 'react';
import { View, Animated, Text } from 'react-native';

const SimpleXPBar = ({ progress = 0, maxProgress = 1000 }) => {
  console.log('🧪 SimpleXPBar - Renderizando com progress:', progress);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('🧪 SimpleXPBar - Iniciando animações');
    
    // Animação do progresso
    Animated.timing(progressAnim, {
      toValue: progress / maxProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Animação das bolhas
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [progress, maxProgress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const bubbleOpacity = bubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <Animated.View 
          style={[
            styles.progress, 
            { width: progressWidth }
          ]} 
        />
      </View>
      
      {/* Bolhas de teste */}
      <Animated.View
        style={[
          styles.bubble,
          {
            opacity: bubbleOpacity,
            transform: [{ scale: bubbleAnim }],
          },
        ]}
      />
      
      <Text style={styles.text}>
        Progress: {progress}/{maxProgress}
      </Text>
    </View>
  );
};

const styles = {
  container: {
    height: 20,
    marginVertical: 10,
  },
  background: {
    height: 12,
    backgroundColor: '#0B3850',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#2ED4CC',
    borderRadius: 6,
  },
  bubble: {
    position: 'absolute',
    top: 4,
    left: '50%',
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  text: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
};

export default SimpleXPBar;
