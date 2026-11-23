import { createRouter, createWebHashHistory } from 'vue-router';
import Dashboard from './pages/Dashboard.vue';
import Parcelas from './pages/Parcelas.vue';
import GastosFixos from './pages/GastosFixos.vue';
import GastosAvulsos from './pages/GastosAvulsos.vue';
import Configuracoes from './pages/Configuracoes.vue';

// Histórico por "#": funciona no GitHub Pages sem configurar redirecionamentos.
export const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', name: 'dashboard', component: Dashboard, meta: { titulo: 'Dashboard' } },
        { path: '/parcelas', name: 'parcelas', component: Parcelas, meta: { titulo: 'Parcelas' } },
        { path: '/gastos-fixos', name: 'fixos', component: GastosFixos, meta: { titulo: 'Gastos fixos' } },
        { path: '/gastos-avulsos', name: 'avulsos', component: GastosAvulsos, meta: { titulo: 'Gastos avulsos' } },
        { path: '/configuracoes', name: 'configuracoes', component: Configuracoes, meta: { titulo: 'Configurações' } },
        { path: '/:resto(.*)', redirect: '/' },
    ],
    scrollBehavior: () => ({ top: 0 }),
});

router.afterEach((to) => {
    document.title = `${to.meta.titulo ?? 'Controle de Gastos'} — Controle de Gastos (demo)`;
});
