import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Base adaptée à GitHub Pages : https://thibautgras.github.io/AISearch/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/AISearch/' : '/',
  plugins: [svelte()],
})
