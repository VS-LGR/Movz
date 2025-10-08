const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuração para web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
