# Análise Completa de Campos - Prisma para Supabase

## 📋 **CAMPOS QUE PRECISAM SER CORRIGIDOS**

### **1. Tabela `users`**
- ✅ `userType` (camelCase) - CORRETO
- ✅ `createdAt` (camelCase) - CORRETO  
- ✅ `updatedAt` (camelCase) - CORRETO
- ✅ `cardBanner` (camelCase) - CORRETO
- ✅ `cardBackground` (camelCase) - CORRETO
- ✅ `isActive` (camelCase) - CORRETO

### **2. Tabelas que usam snake_case (PRECISAM CORREÇÃO)**
- ❌ `class_scores` (deveria ser `classScores`)
- ❌ `class_students` (deveria ser `classStudents`) 
- ❌ `teacher_classes` (deveria ser `teacherClasses`)
- ❌ `user_sports` (deveria ser `userSports`)
- ❌ `user_scores` (deveria ser `userScores`)
- ❌ `user_progress` (deveria ser `userProgress`)

### **3. Campos que usam snake_case (PRECISAM CORREÇÃO)**
- ❌ `student_id` → `studentId`
- ❌ `class_id` → `classId`
- ❌ `sport_id` → `sportId`
- ❌ `teacher_id` → `teacherId`
- ❌ `user_id` → `userId`
- ❌ `is_active` → `isActive`
- ❌ `created_at` → `createdAt`
- ❌ `updated_at` → `updatedAt`
- ❌ `lesson_date` → `lessonDate`
- ❌ `institution_id` → `institutionId`

## 🔧 **ROTAS QUE PRECISAM SER CORRIGIDAS**

### **1. `api/routes/users.js`** - ❌ AINDA USA PRISMA
- Precisa ser convertido para Supabase
- Campos: `createdAt`, `updatedAt`, `userSports`

### **2. `api/routes/sports.js`** - ❌ AINDA USA PRISMA  
- Precisa ser convertido para Supabase
- Campos: `isActive`, `userSports`, `userScores`

### **3. `api/routes/scores.js`** - ⚠️ PARCIALMENTE CORRIGIDO
- ✅ `/student/sports` - Corrigido
- ✅ `/student/ranking` - Corrigido  
- ✅ `/student/attendance` - Corrigido
- ❌ `/user` - Ainda usa Prisma
- ❌ `/ranking` - Ainda usa Prisma
- ❌ `/stats` - Ainda usa Prisma

### **4. `api/routes/contents.js`** - ❌ AINDA USA PRISMA
- Precisa ser convertido para Supabase

### **5. `api/routes/chat.js`** - ❌ AINDA USA PRISMA
- Precisa ser convertido para Supabase

### **6. `api/routes/classes.js`** - ❌ AINDA USA PRISMA
- Precisa ser convertido para Supabase

### **7. `api/routes/classManagement.js`** - ❌ AINDA USA PRISMA
- Precisa ser convertido para Supabase

### **8. `api/routes/institutions.js`** - ❌ AINDA USA PRISMA
- Precisa ser convertido para Supabase

## 🎯 **PLANO DE AÇÃO**

### **FASE 1: Corrigir nomes das tabelas no Supabase**
1. Renomear tabelas para camelCase
2. Renomear campos para camelCase

### **FASE 2: Converter rotas restantes**
1. `users.js` - Perfil, estatísticas, alterar senha
2. `sports.js` - Esportes, favoritos, ranking
3. `scores.js` - Pontuações gerais, ranking geral
4. `contents.js` - Conteúdos educacionais
5. `chat.js` - Sistema de chat
6. `classes.js` - Gerenciamento de turmas
7. `classManagement.js` - Gestão de turmas
8. `institutions.js` - Gestão de instituições

### **FASE 3: Testar todas as funcionalidades**
1. Estudante - Login, perfil, pontuações, ranking, customização
2. Professor - Login, turmas, alunos, pontuações
3. Instituição - Login, dashboard, relatórios
