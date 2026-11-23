<script setup>
import { onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
    aberto: Boolean,
    titulo: { type: String, required: true },
    largura: { type: String, default: 'max-w-lg' },
});
const emit = defineEmits(['fechar']);

const tecla = (e) => e.key === 'Escape' && props.aberto && emit('fechar');
onMounted(() => window.addEventListener('keydown', tecla));
onUnmounted(() => window.removeEventListener('keydown', tecla));
</script>

<template>
    <Teleport to="body">
        <div v-if="aberto" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" @mousedown.self="emit('fechar')">
            <div class="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl" :class="largura" role="dialog" aria-modal="true">
                <div class="mb-5 flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-slate-900">{{ titulo }}</h2>
                    <button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Fechar" @click="emit('fechar')">
                        <X class="h-5 w-5" />
                    </button>
                </div>
                <slot />
            </div>
        </div>
    </Teleport>
</template>
