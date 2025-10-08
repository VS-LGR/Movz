// Script para corrigir todas as rotas de uma vez
const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'api', 'routes');

// Mapeamento de campos snake_case para camelCase
const fieldMappings = {
  'user_id': 'userId',
  'sport_id': 'sportId', 
  'class_id': 'classId',
  'teacher_id': 'teacherId',
  'student_id': 'studentId',
  'content_id': 'contentId',
  'institution_id': 'institutionId',
  'is_active': 'isActive',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'lesson_date': 'lessonDate',
  'completed_at': 'completedAt'
};

// Mapeamento de tabelas snake_case para camelCase
const tableMappings = {
  'user_sports': 'userSports',
  'user_scores': 'userScores', 
  'user_progress': 'userProgress',
  'class_scores': 'classScores',
  'class_students': 'classStudents',
  'teacher_classes': 'teacherClasses'
};

function fixFile(filePath) {
  console.log(`🔧 Corrigindo arquivo: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Substituir imports do Prisma
  content = content.replace(/const prisma = require\('\.\.\/prisma'\);/, "const { supabase } = require('../supabase');");
  
  // Substituir campos snake_case para camelCase
  Object.entries(fieldMappings).forEach(([snake, camel]) => {
    const regex = new RegExp(`\\b${snake}\\b`, 'g');
    content = content.replace(regex, camel);
  });
  
  // Substituir tabelas snake_case para camelCase
  Object.entries(tableMappings).forEach(([snake, camel]) => {
    const regex = new RegExp(`\\.from\\('${snake}'\\)`, 'g');
    content = content.replace(regex, `.from('${camel}')`);
  });
  
  // Substituir consultas Prisma por Supabase
  content = content.replace(/await prisma\.(\w+)\.findMany\(/g, 'const { data: $1, error: $1Error } = await supabase.from(\'$1\').select(');
  content = content.replace(/await prisma\.(\w+)\.findUnique\(/g, 'const { data: $1, error: $1Error } = await supabase.from(\'$1\').select(');
  content = content.replace(/await prisma\.(\w+)\.create\(/g, 'const { data: $1, error: $1Error } = await supabase.from(\'$1\').insert(');
  content = content.replace(/await prisma\.(\w+)\.update\(/g, 'const { data: $1, error: $1Error } = await supabase.from(\'$1\').update(');
  content = content.replace(/await prisma\.(\w+)\.delete\(/g, 'const { data: $1, error: $1Error } = await supabase.from(\'$1\').delete(');
  content = content.replace(/await prisma\.(\w+)\.count\(/g, 'const { count: $1Count } = await supabase.from(\'$1\').select(\'*\', { count: \'exact\', head: true })');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Arquivo corrigido: ${filePath}`);
}

// Listar todos os arquivos de rota
const files = fs.readdirSync(routesDir)
  .filter(file => file.endsWith('.js'))
  .map(file => path.join(routesDir, file));

console.log('🚀 Iniciando correção de todas as rotas...\n');

files.forEach(fixFile);

console.log('\n🎉 Todas as rotas foram corrigidas!');
console.log('\n⚠️  ATENÇÃO: Verifique manualmente os arquivos corrigidos para garantir que as consultas Supabase estão corretas.');
