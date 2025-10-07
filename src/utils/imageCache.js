// Cache de imagens para melhor performance
const medalCache = new Map();
const achievementCache = new Map();
const bannerCache = new Map();

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

  const bannerImages = {
    'Banner Padrão': require('../assets/images/aiB_GoldBanner.svg'),
    'Banner Fogo': require('../assets/images/aiB_FogoBanner.svg'),
    'Banner NBA': require('../assets/images/aiB_NBABanner.svg'),
    'Banner Futebol': require('../assets/images/aiB_SoccerBanner.svg'),
    'Banner Vôlei': require('../assets/images/aiB_VolleyBanner.svg'),
    'Banner Basquete': require('../assets/images/aiB_BullseyeBanner.svg'),
    'Banner Cap': require('../assets/images/aiB_CapBanner.svg'),
    'Banner Cap 2': require('../assets/images/aiB_Cap_2Banner.svg'),
    'Banner Gato': require('../assets/images/aiB_catBanner.svg'),
    'Banner Rose Gold': require('../assets/images/aiB_Rose_GoldBanner.svg'),
    'Banner Espaço': require('../assets/images/aiB_SpaceBanner.svg'),
    'Banner Void': require('../assets/images/aiB_VoidBanner.svg'),
  };

  // Armazenar nos caches separados
  Object.entries(medalImages).forEach(([name, image]) => {
    medalCache.set(name, image);
  });

  Object.entries(achievementImages).forEach(([name, image]) => {
    achievementCache.set(name, image);
  });

  Object.entries(bannerImages).forEach(([name, image]) => {
    bannerCache.set(name, image); // Armazenar no cache de banners
  });
};

// Função para obter imagem do cache
const getCachedImage = (name, type = 'medal') => {
  if (type === 'medal') {
    return medalCache.get(name) || require('../assets/images/Medalha_1.svg');
  } else if (type === 'banner') {
    return bannerCache.get(name) || require('../assets/images/aiB_GoldBanner.svg');
  } else {
    return achievementCache.get(name) || require('../assets/images/aiAtivo 5medals.svg');
  }
};

// Inicializar cache
preloadImages();

export { getCachedImage, preloadImages };
