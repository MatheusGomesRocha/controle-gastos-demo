<script setup>
import { computed } from 'vue';
import { formatarMoeda } from '@/utils/format';

const props = defineProps({ gasto: Number, limite: Number, compacto: Boolean });
const pct = computed(() => (props.limite > 0 ? (props.gasto / props.limite) * 100 : 0));
const cor = computed(() => (pct.value >= 100 ? '#ef4444' : pct.value >= 80 ? '#f59e0b' : '#10b981'));
</script>

<template>
    <div :class="compacto ? 'mt-3' : ''">
        <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full transition-all" :style="{ width: Math.min(100, pct) + '%', backgroundColor: cor }" />
        </div>
        <p class="mt-1.5 text-xs" :style="{ color: cor }">
            <template v-if="pct >= 100">Limite estourado em {{ formatarMoeda(gasto - limite) }}</template>
            <template v-else>{{ Math.round(pct) }}% do limite de {{ formatarMoeda(limite) }} (restam {{ formatarMoeda(limite - gasto) }})</template>
        </p>
    </div>
</template>
