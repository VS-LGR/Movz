// Cache de imagens para melhor performance
const medalCache = new Map();
const achievementCache = new Map();

// Pré-carregar todas as imagens de medalhas e conquistas
const preloadImages = () => {
  const medalImages = {
    'Primeiro Passo': require('../assets/images/Medalha_1.svg'),
    'Maratonista': require('../assets/images/Medalha_2.svg'),
    'Campeão': require('../assets/images/Medalha_3.svg'),
    'Lenda': require('../assets/images/Medalha_4.svg'),
    'Velocista': require('../assets/images/Medalha_5.svg'),
    'Consistente': require('../assets/images/Medalha_6.svg'),
  };

  const achievementImages = {
    'Primeira Estrela': require('../assets/images/aiAtivo 5medals.svg'),
    'Guerreiro': require('../assets/images/aiAtivo 9medals.svg'),
    'Mestre': require('../assets/images/aiAtivo 10medals.svg'),
    'Lenda Viva': require('../assets/images/aiAtivo 11medals.svg'),
    'Relâmpago': require('../assets/images/aiAtivo 12medals.svg'),
    'Dedicação': require('../assets/images/aiAtivo 13medals.svg'),
    'Perfeccionista': require('../assets/images/aiAtivo 14medals.svg'),
    'Explorador': require('../assets/images/aiAtivo 15medals.svg'),
    'Campeão': require('../assets/images/aiAtivo 19medals.svg'),
    'Invencível': require('../assets/images/aiAtivo 20medals.svg'),
    'Mentor': require('../assets/images/aiAtivo 21medals.svg'),
    'Líder': require('../assets/images/aiAtivo 22medals.svg'),
    'Estrategista': require('../assets/images/aiAtivo 23medals.svg'),
    'Fenômeno': require('../assets/images/aiAtivo 24medals.svg'),
    'Ídolo': require('../assets/images/aiAtivo 25medals.svg'),
    'Lenda Eterna': require('../assets/images/aiAtivo 26medals.svg'),
  };

  // Armazenar nos caches separados
  Object.entries(medalImages).forEach(([name, image]) => {
    medalCache.set(name, image);
  });

  Object.entries(achievementImages).forEach(([name, image]) => {
    achievementCache.set(name, image);
  });
};

// Função para obter imagem do cache
const getCachedImage = (name, type = 'medal') => {
  if (type === 'medal') {
    return medalCache.get(name) || require('../assets/images/Medalha_1.svg');
  } else {
    return achievementCache.get(name) || require('../assets/images/aiAtivo 5medals.svg');
  }
};

// Inicializar cache
preloadImages();

export { getCachedImage, preloadImages };
