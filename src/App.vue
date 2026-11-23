<script setup>
import { ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { CheckCircle2, AlertCircle, CreditCard, LayoutDashboard, Menu, Receipt, Repeat, Settings, Wallet, X, FlaskConical } from 'lucide-vue-next';
import { aviso } from '@/lib/aviso';

const route = useRoute();
const menuAberto = ref(false);

const itens = [
    { nome: 'Dashboard', to: '/', icone: LayoutDashboard },
    { nome: 'Parcelas', to: '/parcelas', icone: CreditCard },
    { nome: 'Gastos fixos', to: '/gastos-fixos', icone: Repeat },
    { nome: 'Gastos avulsos', to: '/gastos-avulsos', icone: Receipt },
    { nome: 'Configurações', to: '/configuracoes', icone: Settings },
];

watch(() => route.fullPath, () => (menuAberto.value = false));
</script>

<template>
    <div class="min-h-screen bg-slate-50 text-slate-800">
        <div v-if="menuAberto" class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" @click="menuAberto = false" />

        <!-- Menu lateral -->
        <aside class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0" :class="menuAberto ? 'translate-x-0' : '-translate-x-full'">
            <div class="flex h-16 items-center gap-2 px-6">
                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><Wallet class="h-5 w-5" /></span>
                <span class="text-base font-semibold">Controle de Gastos</span>
            </div>

            <nav class="flex-1 space-y-1 px-3 py-4">
                <RouterLink
                    v-for="item in itens"
                    :key="item.nome"
                    :to="item.to"
                    class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
                    :class="(item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
                >
                    <component :is="item.icone" class="h-5 w-5" />
                    {{ item.nome }}
                </RouterLink>
            </nav>

            <div class="m-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                <p class="mb-1 flex items-center gap-1.5 font-semibold"><FlaskConical class="h-4 w-4" /> Versão de demonstração</p>
                Dados fictícios, salvos só neste navegador. Nada é enviado a nenhum servidor.
            </div>
        </aside>

        <div class="lg:pl-64">
            <div class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
                <button class="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Abrir menu" @click="menuAberto = !menuAberto">
                    <component :is="menuAberto ? X : Menu" class="h-5 w-5" />
                </button>
                <span class="font-semibold">Controle de Gastos</span>
            </div>

            <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 -translate-y-2" leave-active-class="transition duration-200" leave-to-class="opacity-0">
                    <div v-if="aviso" class="fixed right-4 top-4 z-[60] flex max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg" :class="aviso.tipo === 'erro' ? 'bg-red-600' : 'bg-emerald-600'" role="status">
                        <AlertCircle v-if="aviso.tipo === 'erro'" class="h-5 w-5 shrink-0" />
                        <CheckCircle2 v-else class="h-5 w-5 shrink-0" />
                        {{ aviso.texto }}
                    </div>
                </Transition>

                <RouterView />
            </main>
        </div>
    </div>
</template>
