const fs = require('fs');
const path = require('path');

// Mapeamento de arquivos para suas novas localizações
const fileMappings = {
  // Telas de autenticação
  'LoginScreen.js': 'src/screens/auth/LoginScreen.js',
  'RegisterScreen.js': 'src/screens/auth/RegisterScreen.js',
  'InstitutionLoginScreen.js': 'src/screens/auth/InstitutionLoginScreen.js',
  'InstitutionRegisterScreen.js': 'src/screens/auth/InstitutionRegisterScreen.js',
  'TeacherRegisterScreen.js': 'src/screens/auth/TeacherRegisterScreen.js',
  
  // Telas da instituição
  'InstitutionDashboardScreen.js': 'src/screens/institution/InstitutionDashboardScreen.js',
  
  // Telas do estudante
  'HomeScreen.js': 'src/screens/student/HomeScreen.js',
  'AchievementsScreen.js': 'src/screens/student/AchievementsScreen.js',
  'MedalsScreen.js': 'src/screens/student/MedalsScreen.js',
  'RankingScreen.js': 'src/screens/student/RankingScreen.js',
  'ChatScreen.js': 'src/screens/student/ChatScreen.js',
  'TutorialScreen.js': 'src/screens/student/TutorialScreen.js',
  
  // Telas do professor
  'TeacherClassesScreen.js': 'src/screens/teacher/TeacherClassesScreen.js',
  'TeacherScheduleScreen.js': 'src/screens/teacher/TeacherScheduleScreen.js',
  'ClassManagementScreen.js': 'src/screens/teacher/ClassManagementScreen.js',
  'CreateClassScreen.js': 'src/screens/teacher/CreateClassScreen.js',
  'ClassScreen.js': 'src/screens/teacher/ClassScreen.js',
  
  // Componentes
  'CustomAlert.js': 'src/components/CustomAlert.js',
  'CustomModal.js': 'src/components/CustomModal.js',
  'SideMenu.js': 'src/components/SideMenu.js',
  
  // Hooks
  'useCustomAlert.js': 'src/hooks/useCustomAlert.js',
  'useResponsive.js': 'src/hooks/useResponsive.js',
  
  // Serviços
  'apiService.js': 'src/services/apiService.js',
  
  // Utilitários
  'storage.js': 'src/utils/storage.js',
};

// Mapeamento de imports para atualizar
const importMappings = {
  // Imports de componentes
  "import CustomAlert from './CustomAlert';": "import CustomAlert from '../components/CustomAlert';",
  "import CustomModal from './CustomModal';": "import CustomModal from '../components/CustomModal';",
  "import SideMenu from './SideMenu';": "import SideMenu from '../components/SideMenu';",
  
  // Imports de hooks
  "import useCustomAlert from './useCustomAlert';": "import useCustomAlert from '../hooks/useCustomAlert';",
  "import useResponsive from './useResponsive';": "import useResponsive from '../hooks/useResponsive';",
  
  // Imports de serviços
  "import apiService from './apiService';": "import apiService from '../services/apiService';",
  "import apiService from './apiService.js';": "import apiService from '../services/apiService';",
  
  // Imports de utilitários
  "import { getItem, setItem, removeItem } from './storage';": "import { getItem, setItem, removeItem } from '../utils/storage';",
};

function moveFile(sourcePath, destPath) {
  try {
    // Criar diretório de destino se não existir
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Ler arquivo original
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Atualizar imports
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
    }
    
    // Escrever arquivo no novo local
    fs.writeFileSync(destPath, content);
    
    // Remover arquivo original
    fs.unlinkSync(sourcePath);
    
    console.log(`✅ Movido: ${sourcePath} -> ${destPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao mover ${sourcePath}:`, error.message);
    return false;
  }
}

function organizeProject() {
  console.log('🚀 Iniciando reorganização do projeto...\n');
  
  let movedCount = 0;
  let errorCount = 0;
  
  for (const [sourceFile, destPath] of Object.entries(fileMappings)) {
    const sourcePath = path.join(process.cwd(), sourceFile);
    
    if (fs.existsSync(sourcePath)) {
      if (moveFile(sourcePath, destPath)) {
        movedCount++;
      } else {
        errorCount++;
      }
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${sourceFile}`);
    }
  }
  
  console.log(`\n📊 Resumo da reorganização:`);
  console.log(`   ✅ Arquivos movidos: ${movedCount}`);
  console.log(`   ❌ Erros: ${errorCount}`);
  console.log(`   📁 Total processado: ${Object.keys(fileMappings).length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Reorganização concluída com sucesso!');
  } else {
    console.log('\n⚠️  Reorganização concluída com alguns erros.');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  organizeProject();
}

module.exports = { organizeProject, fileMappings, importMappings };
