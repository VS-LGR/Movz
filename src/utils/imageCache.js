import { Image } from 'react-native';

// Mapeamento de URLs diretas para as imagens
const imageMap = {
  // 16 Conquistas (nomes corretos do banco)
  'Assíduo': 'https://i.imgur.com/aQdtNvs.png',
  'Atleta': 'https://i.imgur.com/m45wJmX.png',
  'Campeão': 'https://i.imgur.com/3FWY8G9.png',
  'Comunidade': 'https://i.imgur.com/Gttb9Uk.png',
  'Dedicado': 'https://i.imgur.com/4UVgZbK.png',
  'Determinado': 'https://i.imgur.com/aQdtNvs.png',
  'Esforçado': 'https://i.imgur.com/0kIL4mu.png',
  'Especialista': 'https://i.imgur.com/DrG1ft2.png',
  'Iniciante': 'https://i.imgur.com/In9vsyK.png',
  'Lenda': 'https://i.imgur.com/v2f1Dnt.png',
  'Mestre': 'https://i.imgur.com/DrG1ft2.png',
  'Multiesportivo': 'https://i.imgur.com/ujsiSYt.png',
  'Pontual': 'https://i.imgur.com/7Q8jPdH.png',
  'Presença Perfeita': 'https://i.imgur.com/v2f1Dnt.png',
  'Primeira Pontuação': 'https://i.imgur.com/OMOsgqm.png',
  'Social': 'https://i.imgur.com/XvzycPI.png',

  // Conquistas adicionais encontradas nos logs
  'Primeiro Passo': 'https://i.imgur.com/In9vsyK.png', // Usando imagem do Iniciante temporariamente
  'Consistente': 'https://i.imgur.com/aQdtNvs.png', // Usando imagem do Assíduo temporariamente
  'Ponto de Honra': 'https://i.imgur.com/3FWY8G9.png', // Usando imagem do Campeão temporariamente
  'Atleta Completo': 'https://i.imgur.com/m45wJmX.png', // Usando imagem do Atleta temporariamente
  'Multiesportista': 'https://i.imgur.com/ujsiSYt.png', // Usando imagem do Multiesportivo temporariamente
  'Campeão Universal': 'https://i.imgur.com/3FWY8G9.png', // Usando imagem do Campeão temporariamente
  'Primeira Estrela': 'https://i.imgur.com/OMOsgqm.png', // Usando imagem da Primeira Pontuação temporariamente
  'Estrela Brilhante': 'https://i.imgur.com/v2f1Dnt.png', // Usando imagem da Lenda temporariamente
  'Super Estrela': 'https://i.imgur.com/v2f1Dnt.png', // Usando imagem da Lenda temporariamente
  'Lenda Viva': 'https://i.imgur.com/v2f1Dnt.png', // Usando imagem da Lenda temporariamente

  // 6 Medalhas (nomes corretos do banco) - URLs atualizadas
  'Medalha de Bronze': 'https://i.imgur.com/a6nOjas.png',
  'Medalha de Ouro': 'https://i.imgur.com/EqAwauN.png',
  'Medalha de Platina': 'https://i.imgur.com/8gXgmcZ.png',
  'Medalha de Prata': 'https://i.imgur.com/KwywQdQ.png',
  'Medalha Diamante': 'https://i.imgur.com/bXHvbtf.png',
  'Medalha Suprema': 'https://i.imgur.com/8CxBWeg.png',

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
  'Banner Capivara': 'https://i.imgur.com/t4QrkU4.png',
  'Banner Capivara Gorda': 'https://i.imgur.com/zCHMJKk.png',
  'Banner Gatinhos': 'https://i.imgur.com/wBbTyxf.png',

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

  // Ícones de interface (atualizados - sem fundo)
  'Edit Icon': 'https://i.imgur.com/TfO2pwA.png',
  'Refresh Icon': 'https://i.imgur.com/lyNo0mi.png',
  'Personalization Icon': 'https://i.imgur.com/BrhuJXw.png',
  'Chat Icon': 'https://i.imgur.com/tV3b93p.png',
  'Scores Icon': 'https://i.imgur.com/oklZvDf.png',
  'Ranking Icon': 'https://i.imgur.com/Drld3tL.png',
  'Attendance Icon': 'https://i.imgur.com/XzEB4Ny.png',

  // Ícones de nível por esporte (Level 1-10) - sem fundo
  'Level 1': 'https://i.imgur.com/HcKMvKc.png',
  'Level 2': 'https://i.imgur.com/CDPfVdr.png',
  'Level 3': 'https://i.imgur.com/6Ti8I1R.png',
  'Level 4': 'https://i.imgur.com/LyOVGf9.png',
  'Level 5': 'https://i.imgur.com/0FdAw2F.png',
  'Level 6': 'https://i.imgur.com/6FnyWPp.png',
  'Level 7': 'https://i.imgur.com/AKTyCPc.png',
  'Level 8': 'https://i.imgur.com/7jbGOub.png',
  'Level 9': 'https://i.imgur.com/3Tsgw2u.png',
  'Level 10': 'https://i.imgur.com/Fakgf0Z.png',
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
    case 'level':
      return { uri: 'https://i.imgur.com/4prDUj6.png' }; // Fallback para nível (Level 1)
    default:
      return { uri: 'https://via.placeholder.com/150' }; // Placeholder genérico
  }
};

// Função para obter ícone de nível baseado no nível do esporte
const getLevelIcon = (level) => {
  const clampedLevel = Math.max(1, Math.min(10, Math.floor(level || 1)));
  return getCachedImage(`Level ${clampedLevel}`, 'level');
};

// Função para pré-carregar imagens (opcional, mas bom para performance)
const preloadImages = () => {
  Object.values(imageMap).forEach(url => {
    if (url) {
      Image.prefetch(url);
    }
  });
};

export { getCachedImage, getLevelIcon, preloadImages };
