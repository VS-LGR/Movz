// api/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sportRoutes = require('./routes/sports');
const contentRoutes = require('./routes/contents');
const scoreRoutes = require('./routes/scores');
const chatRoutes = require('./routes/chat');
const classRoutes = require('./routes/classes');
const classManagementRoutes = require('./routes/classManagement');
const institutionRoutes = require('./routes/institutions');
const customizationRoutes = require('./routes/customization');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://muvz-app.vercel.app',
        process.env.VERCEL_URL
      ] 
    : ['http://localhost:19006', 'http://localhost:19007', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/assets', express.static(path.join(__dirname, '../src/assets')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    success: true,
    message: 'Muvz API está funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      sports: '/api/sports',
      scores: '/api/scores',
      chat: '/api/chat',
      classes: '/api/classes',
      institutions: '/api/institutions',
      customization: '/api/customization'
    }
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const prisma = require('./prisma');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    res.json({
      success: true,
      message: 'Database connection successful',
      data: result
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/class-management', classManagementRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/customization', customizationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

module.exports = app;
