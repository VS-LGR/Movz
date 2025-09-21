# Movz App - Sistema de Esportes

Sistema completo de gerenciamento de esportes com React Native/Expo, PostgreSQL e Prisma.

## 🚀 Funcionalidades

- **Autenticação**: Login e cadastro de usuários
- **Esportes**: Gerenciamento de diferentes modalidades esportivas
- **Conteúdos**: Exercícios, tutoriais e treinos organizados por tipo
- **Pontuação**: Sistema de ranking e pontuação por esporte
- **Chat**: Comunicação entre usuários
- **Progresso**: Acompanhamento de evolução do usuário

## 🛠️ Tecnologias

### Frontend
- React Native / Expo
- React Navigation
- AsyncStorage (localStorage para web)

### Backend
- Node.js / Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcryptjs para hash de senhas

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

## ⚙️ Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar banco de dados

Crie um arquivo `.env` na raiz do projeto:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/muvz_app?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# App Configuration
NODE_ENV="development"
```

### 3. Configurar PostgreSQL

1. Instale o PostgreSQL
2. Crie um banco de dados chamado `muvz_app`
3. Atualize a `DATABASE_URL` no arquivo `.env`

### 4. Configurar Prisma

```bash
# Gerar cliente Prisma
npm run db:generate

# Aplicar schema ao banco
npm run db:push

# Popular banco com dados iniciais
npm run db:seed
```

### 5. Executar aplicação

#### Desenvolvimento (API + Frontend)
```bash
npm run dev
```

#### Apenas API
```bash
npm run api
```

#### Apenas Frontend
```bash
npm run web
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **users**: Dados dos usuários
- **sports**: Modalidades esportivas
- **contents**: Exercícios e conteúdos
- **user_sports**: Relacionamento usuário-esporte
- **user_scores**: Pontuações dos usuários
- **user_progress**: Progresso nos conteúdos
- **chat_messages**: Mensagens do chat

### Relacionamentos

- Usuário pode ter múltiplos esportes
- Esporte pode ter múltiplos conteúdos
- Usuário pode ter pontuações em diferentes esportes
- Usuário pode ter progresso em diferentes conteúdos

## 🔗 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/logout` - Logout

### Usuários
- `GET /api/users/profile` - Perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil
- `PUT /api/users/password` - Alterar senha
- `GET /api/users/stats` - Estatísticas do usuário

### Esportes
- `GET /api/sports` - Listar esportes
- `GET /api/sports/:id` - Detalhes do esporte
- `POST /api/sports/:id/join` - Inscrever-se no esporte
- `DELETE /api/sports/:id/leave` - Sair do esporte
- `GET /api/sports/:id/ranking` - Ranking do esporte

### Conteúdos
- `GET /api/contents/sport/:sportId` - Conteúdos por esporte
- `GET /api/contents/:id` - Detalhes do conteúdo
- `GET /api/contents/type/:type` - Conteúdos por tipo
- `PUT /api/contents/:id/progress` - Atualizar progresso

### Pontuações
- `POST /api/scores` - Registrar pontuação
- `GET /api/scores/user` - Pontuações do usuário
- `GET /api/scores/ranking` - Ranking geral

### Chat
- `POST /api/chat/send` - Enviar mensagem
- `GET /api/chat/messages` - Buscar mensagens
- `PUT /api/chat/mark-read` - Marcar como lidas

## 🎯 Scripts Disponíveis

- `npm start` - Iniciar Expo
- `npm run web` - Iniciar versão web
- `npm run api` - Iniciar servidor API
- `npm run dev` - Iniciar API + Frontend
- `npm run db:generate` - Gerar cliente Prisma
- `npm run db:push` - Aplicar schema
- `npm run db:seed` - Popular banco
- `npm run db:studio` - Abrir Prisma Studio

## 🔧 Desenvolvimento

### Estrutura de Pastas
```
├── api/                 # Backend API
│   ├── routes/         # Rotas da API
│   ├── prisma.js       # Configuração Prisma
│   ├── server.js       # Servidor Express
│   └── seed.js         # Dados iniciais
├── prisma/             # Schema do banco
│   └── schema.prisma   # Definição das tabelas
├── src/                # Frontend React Native
└── package.json        # Dependências e scripts
```

### Adicionando Novos Esportes

1. Adicione o esporte no arquivo `api/seed.js`
2. Execute `npm run db:seed` para popular o banco
3. O esporte aparecerá automaticamente no frontend

### Adicionando Novos Conteúdos

1. Use o Prisma Studio: `npm run db:studio`
2. Ou adicione via API: `POST /api/contents`

## 🚀 Deploy

### Backend (API)
1. Configure variáveis de ambiente de produção
2. Execute `npm run db:push` no servidor
3. Inicie a API com `npm run api`

### Frontend
1. Configure a URL da API no frontend
2. Execute `expo build` para gerar build de produção

## 📱 Testando a Aplicação

1. Acesse `http://localhost:19006` para o frontend
2. Acesse `http://localhost:3001/health` para verificar a API
3. Use o Prisma Studio (`npm run db:studio`) para visualizar dados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
