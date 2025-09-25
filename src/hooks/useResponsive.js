import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

const useResponsive = () => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const { width, height } = screenData;

  // Breakpoints
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Tamanhos responsivos
  const getResponsiveValue = (mobile, tablet = mobile, desktop = tablet) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  // Padding responsivo
  const getPadding = () => getResponsiveValue(16, 24, 32);

  // Margin responsivo
  const getMargin = () => getResponsiveValue(12, 16, 20);

  // Font sizes responsivos
  const getFontSize = (mobile, tablet = mobile, desktop = tablet) => 
    getResponsiveValue(mobile, tablet, desktop);

  // Spacing responsivo
  const getSpacing = (mobile, tablet = mobile, desktop = tablet) => 
    getResponsiveValue(mobile, tablet, desktop);

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    getResponsiveValue,
    getPadding,
    getMargin,
    getFontSize,
    getSpacing,
  };
};

export default useResponsive;
