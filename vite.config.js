import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { fetchTopMarkets } from './api/crypto/_shared.js'

const cryptoProxy = {
  '/api/crypto/chart': {
    target: 'https://api.coingecko.com',
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        const url = new URL(req.url ?? '', 'http://localhost');
        const coinId = url.searchParams.get('coinId');
        const days = url.searchParams.get('days') || '7';
        proxyReq.path = `/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
      });
    },
  },
};

function cryptoMarketsApiPlugin() {
  return {
    name: 'crypto-markets-api',
    configureServer(server) {
      server.middlewares.use('/api/crypto/markets', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const data = await fetchTopMarkets();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify(data));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message || 'Failed to fetch market prices' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: cryptoProxy,
  },

  preview: {
    proxy: cryptoProxy,
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  plugins: [react(), cryptoMarketsApiPlugin()],
})
