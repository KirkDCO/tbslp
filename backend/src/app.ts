import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRouter from './api/index.js';

const app = express();

// Security middleware - configured for home network HTTP deployment
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Disable HSTS - it forces HTTPS which breaks HTTP-only deployments
  hsts: false,
  // Disable CSP for simpler home network deployment
  contentSecurityPolicy: false,
  // These headers can cause issues with HTTP
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
}));

// CORS configuration - allow all origins for home network use
// For a home network deployment, we allow any origin since all devices are trusted
const corsOptions = config.corsOrigin === '*'
  ? { origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }
  : { origin: config.corsOrigin, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] };

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(join(config.dataDir, 'uploads')));

// API routes
app.use('/api', apiRouter);

// In production, serve the frontend static files
if (config.nodeEnv === 'production' && existsSync(config.frontendPath)) {
  // Serve static frontend assets
  app.use(express.static(config.frontendPath));

  // SPA fallback - serve index.html for any non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes and uploads
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(resolve(config.frontendPath, 'index.html'));
  });
}

// Error handling (for API routes)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
