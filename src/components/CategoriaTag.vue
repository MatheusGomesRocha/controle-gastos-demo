<script setup>
import { computed } from 'vue';
import { categoriaPorId } from '@/lib/store';

const props = defineProps({ id: Number });
const c = computed(() => categoriaPorId(props.id));
</script>

<template>
    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :style="{ backgroundColor: (c?.cor ?? '#94a3b8') + '1f', color: c?.cor ?? '#64748b' }">
        <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: c?.cor ?? '#94a3b8' }" />
        {{ c?.nome ?? 'Sem categoria' }}
    </span>
</template>
