const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestStudent() {
  try {
    console.log('👤 Criando aluno de teste...');
    
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const student = await prisma.user.create({
      data: {
        email: 'teste@aluno.com',
        password: hashedPassword,
        name: 'Aluno Teste',
        userType: 'STUDENT',
        isActive: true
      }
    });
    
    console.log('✅ Aluno criado com sucesso!');
    console.log('Email:', student.email);
    console.log('Senha: 123456');
    console.log('ID:', student.id);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Usuário já existe');
    } else {
      console.error('Erro:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestStudent();
