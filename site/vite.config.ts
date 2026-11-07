import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Base adaptée à GitHub Pages : https://thibautgras.github.io/AISearch/
// (build et prévisualisation du build ; le serveur de développement reste à la racine)
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/AISearch/' : '/',
  plugins: [svelte()],
}))
