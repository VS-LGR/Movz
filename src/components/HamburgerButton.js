import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

const HamburgerButton = ({ onPress, style, lineStyle }) => {
  return (
    <TouchableOpacity
      style={[styles.menuButton, style]}
      onPress={onPress}
    >
      <View style={[styles.menuLine, lineStyle]} />
      <View style={[styles.menuLine, lineStyle]} />
      <View style={[styles.menuLine, lineStyle]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    backgroundColor: '#333',
    borderRadius: 1,
  },
});

export default HamburgerButton;
