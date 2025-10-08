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
    width: 28,
    height: 20,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  menuLine: {
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
    width: '100%',
  },
});

export default HamburgerButton;
