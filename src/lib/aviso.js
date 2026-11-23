import { ref } from 'vue';

// Aviso flutuante (sucesso em verde, erro em vermelho) que some sozinho.
export const aviso = ref(null);
let timer;

export function avisar(texto, tipo = 'sucesso') {
    aviso.value = { texto, tipo };
    clearTimeout(timer);
    timer = setTimeout(() => (aviso.value = null), 4000);
}
