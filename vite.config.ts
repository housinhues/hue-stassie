import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this as a project site at /Hue-Stassie/, not domain root.
export default defineConfig({
  plugins: [react()],
  base: '/Hue-Stassie/',
});
