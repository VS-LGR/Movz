# Configuração do Banco de Dados PostgreSQL

## 1. Instalação do PostgreSQL

### Windows
1. Baixe o PostgreSQL do site oficial: https://www.postgresql.org/download/windows/
2. Execute o instalador e siga as instruções
3. Anote a senha do usuário `postgres` que você definiu durante a instalação

### macOS
```bash
# Usando Homebrew
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 2. Configuração do Banco

### Conectar ao PostgreSQL
```bash
# Windows (usando pgAdmin ou psql)
psql -U postgres

# macOS/Linux
sudo -u postgres psql
```

### Criar banco de dados
```sql
CREATE DATABASE muvz_app;
CREATE USER muvz_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE muvz_app TO muvz_user;
\q
```

## 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://muvz_user:sua_senha_aqui@localhost:5432/muvz_app?schema=public"

# JWT Secret (gere uma chave segura)
JWT_SECRET="sua-chave-jwt-super-secreta-aqui"

# App Configuration
NODE_ENV="development"
```

## 4. Executar comandos do Prisma

```bash
# Gerar cliente Prisma
npm run db:generate

# Aplicar schema ao banco
npm run db:push

# Popular banco com dados iniciais
npm run db:seed
```

## 5. Verificar se está funcionando

```bash
# Iniciar a API
npm run api

# Em outro terminal, testar a API
curl http://localhost:3001/health
```

## 6. Prisma Studio (Opcional)

Para visualizar e gerenciar os dados:

```bash
npm run db:studio
```

Isso abrirá uma interface web em http://localhost:5555

## Troubleshooting

### Erro de conexão
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `psql -U muvz_user -d muvz_app -h localhost`

### Erro de permissão
- Certifique-se de que o usuário tem permissões no banco
- Execute: `GRANT ALL PRIVILEGES ON DATABASE muvz_app TO muvz_user;`

### Porta já em uso
- Verifique se a porta 5432 está livre
- Ou altere a porta no arquivo `.env`
