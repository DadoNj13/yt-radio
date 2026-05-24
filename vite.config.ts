import { defineConfig } from 'vite';

export default defineConfig({
  // './' for Netlify root; GitHub Actions sets BASE_PATH=/repo-name/
  base: process.env.BASE_PATH || './',
  appType: 'spa',
});
