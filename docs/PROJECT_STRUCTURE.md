# Estrutura do Projeto Muvz App

## 📁 Organização de Pastas

### 🏗️ Estrutura Principal
```
Muvz_App/
├── src/                          # Código fonte principal
│   ├── screens/                  # Telas do aplicativo
│   │   ├── auth/                 # Telas de autenticação
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── InstitutionLoginScreen.js
│   │   │   └── InstitutionRegisterScreen.js
│   │   ├── institution/          # Telas da instituição
│   │   │   ├── InstitutionDashboardScreen.js
│   │   │   └── ...
│   │   ├── student/              # Telas do estudante
│   │   │   ├── HomeScreen.js
│   │   │   ├── AchievementsScreen.js
│   │   │   ├── MedalsScreen.js
│   │   │   ├── RankingScreen.js
│   │   │   ├── ChatScreen.js
│   │   │   └── TutorialScreen.js
│   │   └── teacher/              # Telas do professor
│   │       ├── TeacherClassesScreen.js
│   │       ├── TeacherScheduleScreen.js
│   │       ├── ClassManagementScreen.js
│   │       ├── CreateClassScreen.js
│   │       └── ClassScreen.js
│   ├── components/               # Componentes reutilizáveis
│   │   ├── CustomAlert.js
│   │   ├── CustomModal.js
│   │   └── SideMenu.js
│   ├── hooks/                    # Hooks customizados
│   │   ├── useCustomAlert.js
│   │   └── useResponsive.js
│   ├── services/                 # Serviços e APIs
│   │   └── apiService.js
│   ├── utils/                    # Utilitários e helpers
│   │   └── storage.js
│   ├── constants/                # Constantes e configurações
│   │   └── config.js
│   └── assets/                   # Assets estáticos
│       └── images/               # Imagens e ícones
│           ├── aiAtivo_*.svg
│           ├── *_sports.svg
│           ├── Medalha_*.svg
│           └── ...
├── api/                          # Backend API
│   ├── routes/                   # Rotas da API
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── institutions.js
│   │   ├── classes.js
│   │   ├── classManagement.js
│   │   ├── contents.js
│   │   ├── scores.js
│   │   ├── sports.js
│   │   └── chat.js
│   ├── prisma.js
│   ├── server.js
│   ├── simple-server.js
│   └── seed.js
├── prisma/                       # Banco de dados
│   ├── schema.prisma
│   └── dev.db
├── docs/                         # Documentação
│   ├── PROJECT_STRUCTURE.md
│   └── database-setup.md
├── scripts/                      # Scripts de desenvolvimento
│   └── ...
├── public/                       # Arquivos públicos
│   ├── index.html
│   └── institution-dashboard-demo.html
├── package.json
├── package-lock.json
├── app.json
└── README.md
```

## 🎯 Princípios de Organização

### 1. **Separação por Funcionalidade**
- Cada pasta representa uma funcionalidade específica
- Telas agrupadas por tipo de usuário (auth, institution, student, teacher)
- Componentes reutilizáveis centralizados

### 2. **Hierarquia Clara**
- `src/` contém todo o código fonte
- `api/` contém o backend
- `docs/` contém documentação
- `scripts/` contém utilitários de desenvolvimento

### 3. **Nomenclatura Consistente**
- Arquivos em PascalCase para componentes
- Arquivos em camelCase para utilitários
- Pastas em lowercase

### 4. **Imports Relativos**
- Imports relativos dentro de `src/`
- Imports absolutos para componentes externos

## 📋 Status da Reorganização

### ✅ Concluído
- [x] Criação da estrutura de pastas
- [x] Movimentação da API para pasta `api/`
- [x] Organização de hooks em `src/hooks/`
- [x] Organização de componentes em `src/components/`
- [x] Organização de serviços em `src/services/`
- [x] Organização de telas de autenticação em `src/screens/auth/`

### 🔄 Em Andamento
- [ ] Organização de telas da instituição
- [ ] Organização de telas do estudante
- [ ] Organização de telas do professor
- [ ] Organização de assets
- [ ] Atualização de imports

### ⏳ Pendente
- [ ] Teste da estrutura reorganizada
- [ ] Documentação de componentes
- [ ] Guia de contribuição

## 🚀 Próximos Passos

1. **Finalizar movimentação de telas**
2. **Atualizar todos os imports**
3. **Testar funcionalidade**
4. **Criar guias de desenvolvimento**
5. **Implementar linting e formatação**

## 📝 Convenções

### Imports
```javascript
// Componentes locais
import CustomAlert from '../components/CustomAlert';
import useResponsive from '../hooks/useResponsive';

// Serviços
import apiService from '../services/apiService';

// Telas
import LoginScreen from './auth/LoginScreen';
```

### Estrutura de Arquivos
- Um componente por arquivo
- Hooks customizados em `src/hooks/`
- Utilitários em `src/utils/`
- Constantes em `src/constants/`

### Nomenclatura
- Componentes: PascalCase (ex: `CustomAlert.js`)
- Hooks: camelCase com prefixo `use` (ex: `useResponsive.js`)
- Utilitários: camelCase (ex: `storage.js`)
- Constantes: UPPER_SNAKE_CASE (ex: `API_ENDPOINTS.js`)
