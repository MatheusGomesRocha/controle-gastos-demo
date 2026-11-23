<script setup>
import Modal from './Modal.vue';

defineProps({
    aberto: Boolean,
    titulo: { type: String, default: 'Tem certeza?' },
    texto: { type: String, default: '' },
    confirmar: { type: String, default: 'Excluir' },
});
const emit = defineEmits(['fechar', 'confirmar']);
</script>

<template>
    <Modal :aberto="aberto" :titulo="titulo" largura="max-w-md" @fechar="emit('fechar')">
        <p class="text-sm text-slate-600">{{ texto }}</p>
        <div class="mt-6 flex justify-end gap-3">
            <button class="btn-secundario" @click="emit('fechar')">Cancelar</button>
            <button class="btn-perigo" @click="emit('confirmar')">{{ confirmar }}</button>
        </div>
    </Modal>
</template>
