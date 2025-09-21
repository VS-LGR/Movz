// Configuração de exemplo para o banco de dados
// Copie este arquivo para .env e configure suas credenciais

module.exports = {
  database: {
    url: "postgresql://username:password@localhost:5432/muvz_app?schema=public"
  },
  jwt: {
    secret: "your-super-secret-jwt-key-here"
  },
  app: {
    nodeEnv: "development"
  }
};
