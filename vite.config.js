import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// base './' faz o build funcionar em qualquer endereço do GitHub Pages (ex.: /nome-do-repo/).
export default defineConfig({
    base: './',
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
