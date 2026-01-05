import app from './app.js';
import { config } from './config.js';
import { initializeDatabase } from './db/init.js';

// Initialize database on startup
try {
  initializeDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Start server
app.listen(config.port, config.host, () => {
  const displayHost = config.host === '0.0.0.0' ? 'all interfaces' : config.host;
  console.log(`Server running on http://${config.host}:${config.port}`);
  console.log(`Accessible from: ${displayHost}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
