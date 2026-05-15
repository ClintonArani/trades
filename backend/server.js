import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';

// For ES modules to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware - FIXED: Added sameSite and secure settings
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',  // ADD THIS
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CORS configuration - FIXED: Corrected URLs
const allowedOrigins = [
  'http://localhost:4200', 
  'https://wisetrades.site',          // ADDED: Your custom domain if you have one
  'https://trades-16yb.onrender.com'  // ADDED: Your backend itself for testing
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn(`CORS blocked origin: ${origin}`);  // ADDED: Helpful for debugging
      const msg = 'CORS policy does not allow this origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,  // This is CRITICAL for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],  // ADDED: Set-Cookie
  exposedHeaders: ['Set-Cookie']  // ADDED: This allows frontend to read cookies
}));

app.use(cookieParser());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Cookies:', req.cookies);  // ADDED: Debug logging
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Test endpoint to check CORS and cookies (ADDED for debugging)
app.get('/api/test-auth', (req, res) => {
  const token = req.cookies.deriv_access_token;
  const isAuth = req.cookies.is_authenticated;
  console.log('Test auth - Token:', !!token, 'is_authenticated:', isAuth);
  res.json({ 
    hasToken: !!token, 
    isAuthenticated: isAuth === 'true',
    cookies: Object.keys(req.cookies)
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