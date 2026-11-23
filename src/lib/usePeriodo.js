import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { paraFiltro, periodoDaConsulta } from './relatorio';

/** Período da tela, vindo da URL (?ciclo=AAAA-MM ou ?inicio=&fim=). */
export function usePeriodo() {
    const route = useRoute();
    const periodo = computed(() => periodoDaConsulta(route.query));
    const filtro = computed(() => paraFiltro(periodo.value));
    return { periodo, filtro };
}
