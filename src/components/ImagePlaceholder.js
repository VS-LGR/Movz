import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ImagePlaceholder = ({ size = 60, color = '#E0E0E0', text = '?' }) => {
  return (
    <View style={[styles.placeholder, { width: size, height: size, backgroundColor: color }]}>
      <Text style={[styles.placeholderText, { fontSize: size * 0.4 }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D0D0D0',
  },
  placeholderText: {
    color: '#999',
    fontWeight: 'bold',
  },
});

export default ImagePlaceholder;
