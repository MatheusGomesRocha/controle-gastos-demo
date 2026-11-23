<script setup>
defineProps({ valor: Number, total: Number, cor: { type: String, default: '#6366f1' } });
</script>

<template>
    <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div class="h-full rounded-full transition-all" :style="{ width: Math.min(100, (valor / (total || 1)) * 100) + '%', backgroundColor: cor }" />
    </div>
</template>
