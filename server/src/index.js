import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import cors from 'cors';
import countryRoutes from './routes/countries.js';
import { connectDatabase } from './config/database.js';

// Use Google DNS for MongoDB Atlas SRV records
dns.setServers(['8.8.8.8']);

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'world-explorer-api' });
});

app.use('/api/countries', countryRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.path}`
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    message: 'Unexpected server error.'
  });
});

if (process.env.MONGODB_URI) {
  connectDatabase(process.env.MONGODB_URI).catch((error) => {
    console.error('MongoDB connection failed:', error.message);
  });
}

app.listen(port, () => {
  console.log(`World Explorer API running on http://localhost:${port}`);
});