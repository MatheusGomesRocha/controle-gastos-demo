<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { opcoesEixos } from '@/utils/chart';

/**
 * datasets: [{ label, data, color }]  (color pode ser uma lista, uma cor por barra)
 */
const props = defineProps({
    labels: { type: Array, required: true },
    datasets: { type: Array, required: true },
    empilhado: Boolean,
    horizontal: Boolean,
    legenda: { type: Boolean, default: true },
    altura: { type: Number, default: 280 },
});

const dados = computed(() => ({
    labels: props.labels,
    datasets: props.datasets.map((d) => ({
        label: d.label,
        data: d.data,
        backgroundColor: d.color,
        borderRadius: 6,
        maxBarThickness: 36,
    })),
}));

const opcoes = computed(() =>
    opcoesEixos({ empilhado: props.empilhado, horizontal: props.horizontal, legenda: props.legenda }),
);
</script>

<template>
    <div :style="{ height: altura + 'px' }">
        <Bar :data="dados" :options="opcoes" />
    </div>
</template>
