import React from 'react';
import { View } from 'react-native';

const AnimatedBanner = ({ bannerName, children, style }) => {
  // Componente simplificado - apenas um wrapper sem animações
  return (
    <View style={style}>
      {children}
    </View>
  );
};

export default AnimatedBanner;