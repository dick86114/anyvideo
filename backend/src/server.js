const app = require('./app');
const https = require('https');
const http = require('http');
const fs = require('fs');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// Check if HTTPS is enabled
const isHttpsEnabled = process.env.HTTPS_ENABLED === 'true';

if (isHttpsEnabled) {
  try {
    // Read SSL certificate and key from environment variables or default paths
    const options = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || '/etc/ssl/private/key.pem'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/etc/ssl/certs/cert.pem')
    };

    // Create HTTPS server
    const httpsServer = https.createServer(options, app);
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`HTTPS Server is running on port ${HTTPS_PORT}`);
      console.log(`API prefix: ${process.env.API_PREFIX || '/api/v1'}`);
      console.log(`Health check: https://localhost:${HTTPS_PORT}/health`);
    });

    // Create HTTP server for redirection to HTTPS
    const httpServer = http.createServer((req, res) => {
      // Redirect all HTTP requests to HTTPS
      const redirectUrl = `https://${req.headers.host.replace(`:${PORT}`, `:${HTTPS_PORT}`)}${req.url}`;
      res.writeHead(301, { Location: redirectUrl });
      res.end();
    });
    httpServer.listen(PORT, () => {
      console.log(`HTTP Server is running on port ${PORT} (redirecting to HTTPS)`);
    });
  } catch (error) {
    console.error('Failed to start HTTPS server:', error);
    console.log('Falling back to HTTP server...');
    // Fallback to HTTP if HTTPS configuration fails
    app.listen(PORT, () => {
      console.log(`HTTP Server is running on port ${PORT}`);
      console.log(`API prefix: ${process.env.API_PREFIX || '/api/v1'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  }
} else {
  // Start HTTP server if HTTPS is not enabled
  app.listen(PORT, () => {
    console.log(`HTTP Server is running on port ${PORT}`);
    console.log(`API prefix: ${process.env.API_PREFIX || '/api/v1'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}