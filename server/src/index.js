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

// Server Port
const port = Number(process.env.PORT) || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  })
);

app.use(express.json({ limit: '1mb' }));

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