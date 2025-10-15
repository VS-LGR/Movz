import React, { useEffect, useRef } from 'react';
import { View, Animated, Text } from 'react-native';

const TestAnimation = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    console.log('🧪 TestAnimation - Iniciando teste de animação');
    
    // Animação de teste
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.testBox,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.testText}>TESTE ANIMAÇÃO</Text>
      </Animated.View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  testBox: {
    width: 200,
    height: 100,
    backgroundColor: '#2ED4CC',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default TestAnimation;
