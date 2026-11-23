<script setup>
import { formatarMoeda } from '@/utils/format';

defineProps({
    titulo: { type: String, required: true },
    valor: { type: [Number, String], default: null },
    texto: { type: String, default: '' }, // usado no lugar do valor (ex.: uma data)
    dica: { type: String, default: '' },
    icone: { type: Object, default: null },
    cor: { type: String, default: '#6366f1' },
});
</script>

<template>
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-slate-500">{{ titulo }}</p>
            <span
                v-if="icone"
                class="flex h-9 w-9 items-center justify-center rounded-xl"
                :style="{ backgroundColor: cor + '1a', color: cor }"
            >
                <component :is="icone" class="h-5 w-5" />
            </span>
        </div>
        <p class="mt-3 truncate text-2xl font-semibold tabular-nums text-slate-900">
            {{ texto || formatarMoeda(valor) }}
        </p>
        <p v-if="dica" class="mt-1 text-xs text-slate-400">{{ dica }}</p>
        <slot />
    </div>
</template>
