import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { avancarParcelas } from './lib/store';
import './style.css';

// Mesma segurança do original: ao abrir o sistema, aplica os avanços de ciclo pendentes das parcelas.
avancarParcelas();

createApp(App).use(router).mount('#app');
