import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: true, // Must be true for sameSite='none'
    httpOnly: true,
    sameSite: 'none', // Changed to 'none' for cross-domain
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CORS configuration - ADD YOUR NETLIFY URL
const allowedOrigins = [
  'http://localhost:4200',
  'https://www.wisetrades.site', 
  'https://wisetrades.site',
  'https://trades-16yb.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('CORS policy does not allow this origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(cookieParser());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Cookies received:', Object.keys(req.cookies));
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Test endpoint for debugging
app.get('/api/test-auth', (req, res) => {
  console.log('Test auth - Cookies:', req.cookies);
  res.json({ 
    hasToken: !!req.cookies.deriv_access_token,
    isAuthenticated: req.cookies.is_authenticated === 'true',
    cookieNames: Object.keys(req.cookies)
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📍 Deriv Redirect URI: ${process.env.DERIV_REDIRECT_URI}`);
});