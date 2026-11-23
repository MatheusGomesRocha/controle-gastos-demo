import { computed, ref, watch } from 'vue';

/** Paginação no cliente: devolve só os itens da página atual e volta à página 1 quando a lista muda. */
export function usePaginacao(lista, porPaginaInicial = 10) {
    const pagina = ref(1);
    const porPagina = ref(porPaginaInicial);
    const total = computed(() => lista.value.length);
    const ultima = computed(() => Math.max(1, Math.ceil(total.value / porPagina.value)));

    // Filtro/busca/período mudou: volta ao começo. Se a lista encolheu (ex.: exclusão), não fica numa página vazia.
    watch([porPagina], () => (pagina.value = 1));
    watch(total, (novo, antigo) => {
        if (novo !== antigo && pagina.value > ultima.value) pagina.value = ultima.value;
    });

    const itens = computed(() => lista.value.slice((pagina.value - 1) * porPagina.value, pagina.value * porPagina.value));
    const irPara = (n) => (pagina.value = Math.min(ultima.value, Math.max(1, n)));
    const reiniciar = () => (pagina.value = 1);

    return { pagina, porPagina, total, ultima, itens, irPara, reiniciar };
}
