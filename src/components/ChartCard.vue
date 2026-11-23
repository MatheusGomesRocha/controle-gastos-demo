<script setup>
import { BarChart3 } from 'lucide-vue-next';

/** Cartão de gráfico: título claro + uma frase explicando o que ele mostra. */
defineProps({
    titulo: { type: String, required: true },
    descricao: { type: String, default: '' },
    vazio: Boolean,
});
</script>

<template>
    <section class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 class="text-base font-semibold text-slate-800">{{ titulo }}</h3>
        <p v-if="descricao" class="mb-4 mt-0.5 text-sm text-slate-500">{{ descricao }}</p>

        <div
            v-if="vazio"
            class="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-400"
        >
            <BarChart3 class="h-8 w-8" />
            Sem dados neste período.
        </div>
        <slot v-else />
    </section>
</template>
