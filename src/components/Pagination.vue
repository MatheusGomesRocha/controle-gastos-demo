<script setup>
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps({
    pagina: { type: Number, required: true },
    ultima: { type: Number, required: true },
    total: { type: Number, required: true },
    porPagina: { type: Number, required: true },
    opcoes: { type: Array, default: () => [5, 10, 25, 50] },
});
const emit = defineEmits(['ir', 'update:porPagina']);

const de = computed(() => (props.total === 0 ? 0 : (props.pagina - 1) * props.porPagina + 1));
const ate = computed(() => Math.min(props.total, props.pagina * props.porPagina));

// Janela de números: 1 … 4 5 [6] 7 8 … 20
const numeros = computed(() => {
    const { pagina, ultima } = props;
    const lista = new Set([1, ultima, pagina - 1, pagina, pagina + 1]);
    if (pagina <= 3) [2, 3, 4].forEach((n) => lista.add(n));
    if (pagina >= ultima - 2) [ultima - 1, ultima - 2, ultima - 3].forEach((n) => lista.add(n));
    const ordenada = [...lista].filter((n) => n >= 1 && n <= ultima).sort((a, b) => a - b);
    const saida = [];
    ordenada.forEach((n, i) => {
        if (i > 0 && n - ordenada[i - 1] > 1) saida.push('…');
        saida.push(n);
    });
    return saida;
});
</script>

<template>
    <div v-if="total > 0" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
        <div class="flex items-center gap-3">
            <span>Mostrando <strong class="text-slate-700">{{ de }}–{{ ate }}</strong> de <strong class="text-slate-700">{{ total }}</strong></span>
            <label class="flex items-center gap-2">
                <span class="hidden sm:inline">Por página</span>
                <select class="rounded-lg border-slate-300 py-1 pl-2 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500" :value="porPagina" @change="emit('update:porPagina', Number($event.target.value))">
                    <option v-for="o in opcoes" :key="o" :value="o">{{ o }}</option>
                </select>
            </label>
        </div>

        <nav class="flex items-center gap-1" aria-label="Paginação">
            <button class="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent" :disabled="pagina <= 1" aria-label="Página anterior" @click="emit('ir', pagina - 1)"><ChevronLeft class="h-4 w-4" /></button>
            <template v-for="(n, i) in numeros" :key="i">
                <span v-if="n === '…'" class="px-1.5 text-slate-400">…</span>
                <button v-else class="min-w-[2rem] rounded-lg px-2 py-1.5 font-medium" :class="n === pagina ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'" :aria-current="n === pagina ? 'page' : undefined" @click="emit('ir', n)">{{ n }}</button>
            </template>
            <button class="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent" :disabled="pagina >= ultima" aria-label="Próxima página" @click="emit('ir', pagina + 1)"><ChevronRight class="h-4 w-4" /></button>
        </nav>
    </div>
</template>
