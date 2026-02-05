// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const isGitHubPages = !!process.env.GITHUB_REPOSITORY;

export default defineConfig({
  site: isGitHubPages ? `https://boat.benkner-it.com` : 'http://localhost:4321',
  base: '/',
  vite: {
    plugins: [tailwindcss()]
  }
});