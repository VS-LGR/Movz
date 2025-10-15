import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const AnimatedXPBar = ({ progress = 0, maxProgress = 1000, height = 12 }) => {
  console.log('🎨 AnimatedXPBar - Props recebidas:', { progress, maxProgress, height });
  
  const bubbleAnimations = useRef([]);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Criar múltiplas animações de bolhas
  useEffect(() => {
    console.log('🎨 AnimatedXPBar - Iniciando animações, progress:', progress);
    
    // Criar 6 bolhas com animações diferentes (reduzido para melhor performance)
    bubbleAnimations.current = Array.from({ length: 6 }, () => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0.4),
      scale: new Animated.Value(0.8),
    }));

    // Animar o progresso da barra
    Animated.timing(progressAnimation, {
      toValue: Math.min(progress / maxProgress, 1),
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Animar as bolhas apenas uma vez
    const animateBubbles = () => {
      console.log('🎨 AnimatedXPBar - Iniciando animações das bolhas');
      
      bubbleAnimations.current.forEach((bubble, index) => {
        console.log(`🎨 AnimatedXPBar - Configurando bolha ${index}`);
        
        // Reset das animações
        bubble.translateY.setValue(height);
        bubble.opacity.setValue(0.4);
        bubble.scale.setValue(0.8);
        
        // Delay diferente para cada bolha
        const delay = index * 400;
        
        setTimeout(() => {
          // Animação de movimento vertical (bolhas subindo) - CONTÍNUA
          Animated.loop(
            Animated.sequence([
              Animated.timing(bubble.translateY, {
                toValue: -height * 2,
                duration: 4000 + (index * 500),
                useNativeDriver: true,
              }),
              Animated.timing(bubble.translateY, {
                toValue: height,
                duration: 0,
                useNativeDriver: true,
              }),
            ])
          ).start();

          // Animação de opacidade (piscar) - CONTÍNUA
          Animated.loop(
            Animated.sequence([
              Animated.timing(bubble.opacity, {
                toValue: 1,
                duration: 2000 + (index * 300),
                useNativeDriver: true,
              }),
              Animated.timing(bubble.opacity, {
                toValue: 0.2,
                duration: 2000 + (index * 300),
                useNativeDriver: true,
              }),
            ])
          ).start();

          // Animação de escala (crescer e diminuir) - CONTÍNUA
          Animated.loop(
            Animated.sequence([
              Animated.timing(bubble.scale, {
                toValue: 1.3,
                duration: 3000 + (index * 400),
                useNativeDriver: true,
              }),
              Animated.timing(bubble.scale, {
                toValue: 0.6,
                duration: 3000 + (index * 400),
                useNativeDriver: true,
              }),
            ])
          ).start();
        }, delay);
      });
    };

    // Iniciar animações das bolhas apenas uma vez
    animateBubbles();
    
    return () => {
      bubbleAnimations.current.forEach(bubble => {
        bubble.translateY.stopAnimation();
        bubble.opacity.stopAnimation();
        bubble.scale.stopAnimation();
      });
    };
  }, []); // Removido progress e maxProgress das dependências

  // Atualizar apenas o progresso da barra quando progress mudar
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: Math.min(progress / maxProgress, 1),
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [progress, maxProgress]);

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Fundo da barra */}
      <View style={[styles.background, { height }]} />
      
      {/* Barra de progresso animada */}
      <Animated.View 
        style={[
          styles.progressFill, 
          { 
            height,
            width: progressWidth,
          }
        ]} 
      />
      
      {/* Bolhas animadas */}
      {bubbleAnimations.current.map((bubble, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bubble,
            {
              left: `${8 + (index * 15)}%`, // Posicionar bolhas ao longo da barra
              transform: [
                { translateY: bubble.translateY },
                { scale: bubble.scale },
              ],
              opacity: bubble.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = {
  container: {
    position: 'relative',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B3850',
    borderRadius: 6,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#2ED4CC',
    borderRadius: 6,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.32,
    shadowRadius: 12.3,
    elevation: 8,
  },
  bubble: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    top: 2, // Centralizar verticalmente na barra
    shadowColor: '#2ED4CC',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
};

export default AnimatedXPBar;
