<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { formatarData } from '@/utils/format';

const props = defineProps({ periodo: { type: Object, required: true } });
const route = useRoute();
const router = useRouter();

const livre = ref(props.periodo.tipo === 'livre');
const inicio = ref(props.periodo.inicio);
const fim = ref(props.periodo.fim);
watch(() => props.periodo, (p) => {
    livre.value = p.tipo === 'livre';
    inicio.value = p.inicio;
    fim.value = p.fim;
});

const ir = (query) => router.push({ path: route.path, query });
const irCiclo = (chave) => ir({ ciclo: chave });
const aplicar = () => inicio.value && fim.value && fim.value >= inicio.value && ir({ inicio: inicio.value, fim: fim.value });
</script>

<template>
    <div class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1 rounded-xl border border-slate-200 p-1">
                <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Ciclo anterior" @click="irCiclo(periodo.anterior)"><ChevronLeft class="h-4 w-4" /></button>
                <select class="rounded-lg border-0 bg-transparent py-1.5 pr-8 text-sm font-semibold focus:ring-0" :disabled="livre" :value="periodo.ciclo" @change="irCiclo($event.target.value)">
                    <option v-for="c in periodo.ciclos" :key="c.chave" :value="c.chave">{{ c.rotulo }}{{ c.chave === periodo.atual ? ' (atual)' : '' }}</option>
                </select>
                <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Próximo ciclo" @click="irCiclo(periodo.proximo)"><ChevronRight class="h-4 w-4" /></button>
            </div>

            <button v-if="periodo.ciclo !== periodo.atual || livre" class="btn-secundario !py-2" @click="irCiclo(periodo.atual)">Ciclo atual</button>

            <label class="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input v-model="livre" type="checkbox" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" @change="!livre && irCiclo(periodo.ciclo)" />
                Intervalo livre
            </label>
        </div>

        <div v-if="livre" class="mt-3 flex flex-wrap items-end gap-3">
            <label class="text-xs font-medium text-slate-500">De <input v-model="inicio" type="date" class="input mt-1 !w-auto" /></label>
            <label class="text-xs font-medium text-slate-500">Até <input v-model="fim" type="date" class="input mt-1 !w-auto" /></label>
            <button class="btn-primario !py-2.5" @click="aplicar">Aplicar</button>
        </div>

        <p class="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays class="h-4 w-4" />
            Período: <strong class="font-semibold text-slate-700">{{ formatarData(periodo.inicio) }} a {{ formatarData(periodo.fim) }}</strong>
        </p>
    </div>
</template>
