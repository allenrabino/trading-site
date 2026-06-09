import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const COINGECKO_MARKETS_PATH =
  '/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano,avalanche-2,dogecoin,polkadot,chainlink&order=market_cap_desc&sparkline=true&price_change_percentage=24h';

const cryptoProxy = {
  '/api/crypto/markets': {
    target: 'https://api.coingecko.com',
    changeOrigin: true,
    rewrite: () => COINGECKO_MARKETS_PATH,
  },
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

  plugins: [react()],
})
