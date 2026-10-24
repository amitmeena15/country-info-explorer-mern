import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import cors from 'cors';

import countryRoutes from './routes/countries.js';
import favoriteRoutes from './routes/favorites.js';
import { connectDatabase } from './config/database.js';

// Use Google DNS for MongoDB Atlas SRV records
dns.setServers(['8.8.8.8']);

// Create Express App
const app = express();
// Trust the HTTPS reverse proxy in production.
// Enable this only when deployed behind a trusted single proxy.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Server Port
const port = Number(process.env.PORT) || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  })
);

app.use('/api/favorites', express.json({ limit: '10kb' }));
app.use(express.json({ limit: '1mb' }));

// Check MongoDB availability before session middleware
app.use('/api/favorites', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Favorites service temporarily unavailable'
    });
  }
  next();
});
// ===============================
// Secure Session Configuration
// ===============================
if (!process.env.SESSION_SECRET || !process.env.MONGODB_URI) {
  throw new Error('SESSION_SECRET and MONGODB_URI are required');
}

app.use(
  '/api/favorites',
  session({
    name: 'world_explorer.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions'
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

// ===============================
// Health Check API
// ===============================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'world-explorer-api'
  });
});

// ===============================
// Countries API
// ===============================
app.use('/api/countries', countryRoutes);

// ===============================
// MongoDB Favorites API
// ===============================


app.use('/api/favorites', favoriteRoutes);

// ===============================
// Handle Unknown Routes
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, _req, res, _next) => {
  console.error('Server Error:', err);

  // Invalid JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON request body'
    });
  }

  // Request body exceeds size limit
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body is too large'
    });
  }

  // Unexpected server errors
  res.status(500).json({
    success: false,
    message: 'Unexpected server error.'
  });
});

// ===============================
// MongoDB Connection
// ===============================
if (process.env.MONGODB_URI) {
  connectDatabase(process.env.MONGODB_URI)
    .then(() => {
      console.log('MongoDB connection successful');
    })
    .catch((error) => {
      console.error('MongoDB connection failed:', error.message);
    });
} else {
  console.warn('MONGODB_URI is missing from environment variables.');
}

// ===============================
// Start Express Server
// ===============================
app.listen(port, () => {
  console.log(`World Explorer API running on http://localhost:${port}`);
});
