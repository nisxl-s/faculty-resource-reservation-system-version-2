import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: { host: '0.0.0.0', port: 3000, strictPort: true },
  preview: { host: '127.0.0.1', port: 3000, strictPort: true },
  build: {
    outDir: 'build', target: 'es2022',
    rolldownOptions: { output: { codeSplitting: { groups: [
      { name: 'react-vendor', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
      { name: 'router', test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/ },
      { name: 'graphics', test: /[\\/]node_modules[\\/](ogl|lucide-react)[\\/]/ }
    ] } } }
  }
});
