<script setup>
defineProps({ tom: { type: String, default: 'cinza' } });
const tons = {
    verde: 'bg-emerald-50 text-emerald-700',
    cinza: 'bg-slate-100 text-slate-600',
    ambar: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
};
</script>

<template>
    <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="tons[tom]"><slot /></span>
</template>
