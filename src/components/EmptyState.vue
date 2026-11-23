<script setup>
import { Inbox } from 'lucide-vue-next';
defineProps({ titulo: String, texto: String });
</script>

<template>
    <div class="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Inbox class="h-6 w-6" /></span>
        <p class="font-semibold text-slate-700">{{ titulo }}</p>
        <p v-if="texto" class="max-w-sm text-sm text-slate-500">{{ texto }}</p>
        <div class="mt-2"><slot /></div>
    </div>
</template>
