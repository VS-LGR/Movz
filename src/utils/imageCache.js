import { Image } from 'react-native';

// Mapeamento de URLs diretas para as imagens
const imageMap = {
  // 16 Conquistas
  'Primeiro Passo': 'https://i.imgur.com/XvzycPI.png',
  'Iniciante': 'https://i.imgur.com/In9vsyK.png',
  'Dedicado': 'https://i.imgur.com/4UVgZbK.png',
  'Esforçado': 'https://i.imgur.com/0kIL4mu.png',
  'Determinado': 'https://i.imgur.com/aQdtNvs.png',
  'Mestre': 'https://i.imgur.com/DrG1ft2.png',
  'Presença Perfeita': 'https://i.imgur.com/v2f1Dnt.png',
  'Consistente': 'https://i.imgur.com/7Q8jPdH.png',
  'Ponto de Honra': 'https://i.imgur.com/OMOsgqm.png',
  'Atleta Completo': 'https://i.imgur.com/m45wJmX.png',
  'Multiesportista': 'https://i.imgur.com/ujsiSYt.png',
  'Campeão Universal': 'https://i.imgur.com/3FWY8G9.png',
  'Primeira Estrela': 'https://i.imgur.com/e3MMK06.png',
  'Estrela Brilhante': 'https://i.imgur.com/RYHCY6Y.png',
  'Super Estrela': 'https://i.imgur.com/Tlzzrxc.png',
  'Lenda Viva': 'https://i.imgur.com/Gttb9Uk.png',

  // 6 Medalhas
  'Primeira Aula': 'https://i.imgur.com/a6nOjas.png',
  'Dedicado': 'https://i.imgur.com/EqAwauN.png',
  'Esforçado': 'https://i.imgur.com/8gXgmcZ.png',
  'Determinado': 'https://i.imgur.com/KwywQdQ.png',
  'Mestre': 'https://i.imgur.com/bXHvbtf.png',
  'Lenda Viva': 'https://i.imgur.com/8CxBWeg.png',

  // Banners
  'Banner Ouro': 'https://i.imgur.com/mB3rJlz.png',
  'Banner Rose Gold': 'https://i.imgur.com/Mzmu2Zg.png',
  'Banner Void': 'https://i.imgur.com/ZKmOiya.png',
  'Banner Fogo': 'https://i.imgur.com/GVgk6fR.png',
  'Banner NBA': 'https://i.imgur.com/4n2yNSa.png',
  'Banner Soccer': 'https://i.imgur.com/kEdwdhq.png',
  'Banner Volley': 'https://i.imgur.com/plpK80A.png',
  'Banner Space': 'https://i.imgur.com/ZFw6Q8v.png',
  'Banner Aim': 'https://i.imgur.com/haLT7Bu.png',
  'Banner Capybara': 'https://i.imgur.com/t4QrkU4.png',
  'Banner FatCapy': 'https://i.imgur.com/zCHMJKk.png',
  'Banner Cats': 'https://i.imgur.com/wBbTyxf.png',

  // Esportes
  'Basquete': 'https://i.imgur.com/65B2M18.png',
  'Futebol': 'https://i.imgur.com/9lneCHu.png',
  'Voley': 'https://i.imgur.com/G5KCwt9.png',
  'Ping-Pong': 'https://i.imgur.com/MaP4V5w.png',
  'Aula Livre': 'https://i.imgur.com/vlo2aeU.png',
  'Exercicios': 'https://i.imgur.com/vlo2aeU.png',
  'Handball': 'https://i.imgur.com/gpym3JX.png',
  'Natação': 'https://i.imgur.com/elbFP4D.png',
  'Queimada': 'https://i.imgur.com/LSDt6La.png',

  // Logo
  'Muvz Logo': 'https://i.imgur.com/ES1jhvE.png',

  // Ícones de interface
  'Edit Icon': 'https://i.imgur.com/TfO2pwA.png',
  'Refresh Icon': 'https://i.imgur.com/lyNo0mi.png',
  'Personalization Icon': 'https://i.imgur.com/EzhrwDm.png',
  'Chat Icon': 'https://i.imgur.com/Nlb9kaw.png',
  'Scores Icon': 'https://i.imgur.com/Xhi39Tw.png',
  'Ranking Icon': 'https://i.imgur.com/9F2EuG0.png',
};

const getCachedImage = (name, type) => {
  // Para 'Banner Padrão', não retornar imagem (tratado na UI)
  if (name === 'Banner Padrão') return null;
  
  const imageUrl = imageMap[name];
  if (imageUrl) {
    return { uri: imageUrl };
  }

  // Fallback para casos onde a imagem não é encontrada no mapa
  console.warn(`Imagem não encontrada no cache para: ${name} (Tipo: ${type})`);
  // Retorna uma imagem padrão ou um placeholder
  switch (type) {
    case 'achievement':
      return { uri: 'https://i.imgur.com/e3MMK06.png' }; // Fallback para conquista
    case 'medal':
      return { uri: 'https://i.imgur.com/a6nOjas.png' }; // Fallback para medalha
    case 'banner':
      return { uri: 'https://i.imgur.com/mB3rJlz.png' }; // Fallback para banner
    case 'sport':
      return { uri: 'https://i.imgur.com/vlo2aeU.png' }; // Fallback para esporte
    case 'logo':
      return { uri: 'https://i.imgur.com/ES1jhvE.png' }; // Fallback para logo
    case 'icon':
      return { uri: 'https://i.imgur.com/TfO2pwA.png' }; // Fallback para ícone
    default:
      return { uri: 'https://via.placeholder.com/150' }; // Placeholder genérico
  }
};

// Função para pré-carregar imagens (opcional, mas bom para performance)
const preloadImages = () => {
  Object.values(imageMap).forEach(url => {
    if (url) {
      Image.prefetch(url);
    }
  });
};

export { getCachedImage, preloadImages };
