<script setup>
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { formatarMoeda, formatarPercentual } from '@/utils/format';
import '@/utils/chart';

/** itens: [{ nome, cor, total }] — a legenda lista valor e percentual de cada fatia. */
const props = defineProps({
    itens: { type: Array, required: true },
    altura: { type: Number, default: 200 },
});

const soma = computed(() => props.itens.reduce((s, i) => s + i.total, 0));

const dados = computed(() => ({
    labels: props.itens.map((i) => i.nome),
    datasets: [
        {
            data: props.itens.map((i) => i.total),
            backgroundColor: props.itens.map((i) => i.cor),
            borderWidth: 2,
            borderColor: '#ffffff',
        },
    ],
}));

const opcoes = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatarMoeda(ctx.parsed)}` } },
    },
};

const percentual = (v) => (soma.value > 0 ? formatarPercentual((v / soma.value) * 100) : '0%');
</script>

<template>
    <div class="flex flex-col items-center gap-5">
        <div class="relative shrink-0" :style="{ height: altura + 'px', width: altura + 'px' }">
            <Doughnut :data="dados" :options="opcoes" />
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-xs text-slate-400">Total</span>
                <span class="text-sm font-semibold text-slate-700">{{ formatarMoeda(soma) }}</span>
            </div>
        </div>

        <ul class="w-full min-w-0 flex-1 space-y-2 text-sm">
            <li v-for="i in itens" :key="i.nome" class="flex items-center gap-2">
                <span class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: i.cor }" />
                <span class="min-w-0 flex-1 truncate text-slate-600">{{ i.nome }}</span>
                <span class="text-xs text-slate-400">{{ percentual(i.total) }}</span>
                <span class="w-24 text-right font-medium tabular-nums">{{ formatarMoeda(i.total) }}</span>
            </li>
        </ul>
    </div>
</template>
