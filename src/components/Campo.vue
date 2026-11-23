<script setup>
defineProps({ label: String, erro: String, dica: String });
</script>

<template>
    <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">{{ label }}</span>
        <slot />
        <span v-if="dica && !erro" class="mt-1 block text-xs text-slate-400">{{ dica }}</span>
        <span v-if="erro" class="mt-1 block text-xs text-red-600">{{ erro }}</span>
    </label>
</template>
