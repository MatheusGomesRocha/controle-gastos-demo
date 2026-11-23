<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowDownRight, ArrowUpRight, CalendarClock, CreditCard, Hourglass, Minus, Receipt, Repeat, Wallet } from 'lucide-vue-next';
import PeriodoFilter from '@/components/PeriodoFilter.vue';
import StatCard from '@/components/StatCard.vue';
import LimiteBarra from '@/components/LimiteBarra.vue';
import ChartCard from '@/components/ChartCard.vue';
import BarChart from '@/components/Charts/BarChart.vue';
import DoughnutChart from '@/components/Charts/DoughnutChart.vue';
import { CORES_TIPO, formatarData, formatarMoeda, formatarPercentual } from '@/utils/format';
import { usePeriodo } from '@/lib/usePeriodo';
import { ciclos, estado } from '@/lib/store';
import { comparacao, evolucao, eventosDoPeriodo, porCategoria, porDia, proximoVencimento, saldoParcelas, totais as calcTotais } from '@/lib/relatorio';

const { periodo, filtro } = usePeriodo();

const dados = computed(() => {
    const p = periodo.value;
    const eventos = eventosDoPeriodo(p);
    const totais = calcTotais(eventos);
    const ref = p.ciclo || ciclos.value.cicloDaData(p.fim);
    const evo = evolucao(ref, 11, 0);
    const prev = evolucao(ref, 5, 6);
    const avulsos = eventos.filter((e) => e.tipo === 'avulso');
    const fixos = eventos.filter((e) => e.tipo === 'fixo');
    const saldo = saldoParcelas(p);
    return {
        totais,
        saldo,
        comp: comparacao(totais.total, p),
        proximo: proximoVencimento(),
        limite: p.ciclo ? Number(estado.config.limite_avulsos) || 0 : 0,
        graficos: {
            por_dia: porDia(eventos, p),
            por_categoria: porCategoria(eventos),
            evolucao: evo,
            parcelas_por_ciclo: { labels: prev.labels, chaves: prev.chaves, valores: prev.parcelas, atual: ciclos.value.cicloAtual().chave },
            saldo_parcelas: saldo.itens,
            fixos_por_categoria: porCategoria(fixos),
            avulsos_por_dia: porDia(avulsos, p),
            avulsos_por_categoria: porCategoria(avulsos),
        },
    };
});

const t = computed(() => dados.value.totais);
const g = computed(() => dados.value.graficos);
const comp = computed(() => dados.value.comp);
const semGastos = computed(() => t.value.total === 0);

const porDiaDados = computed(() => ({
    labels: g.value.por_dia.labels,
    datasets: [
        { label: 'Parcelas', data: g.value.por_dia.parcela, color: CORES_TIPO.parcela },
        { label: 'Fixos', data: g.value.por_dia.fixo, color: CORES_TIPO.fixo },
        { label: 'Avulsos', data: g.value.por_dia.avulso, color: CORES_TIPO.avulso },
    ],
}));
const porTipo = computed(() =>
    [
        { nome: 'Parcelas', cor: CORES_TIPO.parcela, total: t.value.parcelas },
        { nome: 'Gastos fixos', cor: CORES_TIPO.fixo, total: t.value.fixos },
        { nome: 'Gastos avulsos', cor: CORES_TIPO.avulso, total: t.value.avulsos },
    ].filter((i) => i.total > 0),
);
const evolucaoDados = computed(() => ({
    labels: g.value.evolucao.labels,
    datasets: [
        { label: 'Parcelas', data: g.value.evolucao.parcelas, color: CORES_TIPO.parcela },
        { label: 'Fixos', data: g.value.evolucao.fixos, color: CORES_TIPO.fixo },
        { label: 'Avulsos', data: g.value.evolucao.avulsos, color: CORES_TIPO.avulso },
    ],
}));
const parcelasCiclo = computed(() => {
    const p = g.value.parcelas_por_ciclo;
    const cor = p.chaves.map((c) => (c === p.atual ? CORES_TIPO.parcela : c > p.atual ? '#c7d2fe' : '#a5b4fc'));
    return { labels: p.labels, datasets: [{ label: 'Parcelas', data: p.valores, color: cor }] };
});
const saldoCompras = computed(() => ({
    labels: g.value.saldo_parcelas.map((i) => `${i.descricao} (${i.pagas}/${i.total})`),
    datasets: [{ label: 'Falta pagar', data: g.value.saldo_parcelas.map((i) => i.restante_valor), color: g.value.saldo_parcelas.map((i) => i.cor) }],
}));
const pesoFixos = computed(() => [
    { nome: 'Gastos fixos', cor: CORES_TIPO.fixo, total: t.value.fixos },
    { nome: 'Demais gastos', cor: '#cbd5e1', total: Math.max(0, t.value.total - t.value.fixos) },
]);
const avulsosDia = computed(() => ({
    labels: g.value.avulsos_por_dia.labels,
    datasets: [{ label: 'Gastos avulsos', data: g.value.avulsos_por_dia.avulso, color: CORES_TIPO.avulso }],
}));
const subiu = computed(() => comp.value.diferenca > 0);
const caiu = computed(() => comp.value.diferenca < 0);
const comparativo = computed(() => ({
    labels: [comp.value.rotulo_anterior, periodo.value.rotulo],
    datasets: [{ label: 'Total', data: [comp.value.total_anterior, t.value.total], color: ['#cbd5e1', CORES_TIPO.parcela] }],
}));
</script>

<template>
    <header class="mb-6">
        <h1 class="text-2xl font-semibold">Dashboard</h1>
        <p class="mt-1 text-sm text-slate-500">Visão geral dos seus gastos no período escolhido.</p>
    </header>

    <PeriodoFilter :periodo="filtro" />

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard titulo="Total do período" :valor="t.total" :icone="Wallet" cor="#4f46e5" dica="Parcelas + gastos fixos + gastos avulsos" />
        <StatCard titulo="Parcelas" :valor="t.parcelas" :icone="CreditCard" :cor="CORES_TIPO.parcela" dica="Compras parceladas que vencem no período" />
        <StatCard titulo="Gastos fixos" :valor="t.fixos" :icone="Repeat" :cor="CORES_TIPO.fixo" dica="Contas que se repetem todo ciclo" />
        <StatCard titulo="Gastos avulsos" :valor="t.avulsos" :icone="Receipt" :cor="CORES_TIPO.avulso" dica="Gastos pontuais do dia a dia">
            <LimiteBarra v-if="dados.limite" compacto :gasto="t.avulsos" :limite="dados.limite" />
        </StatCard>
        <StatCard titulo="Falta pagar em parcelas" :valor="dados.saldo.total_restante" :icone="Hourglass" cor="#ef4444" dica="Saldo das compras parceladas, ao fim do período" />
        <StatCard titulo="Próximo vencimento" :texto="formatarData(dados.proximo.data)" :icone="CalendarClock" cor="#0d9488" :dica="`Início do ciclo ${dados.proximo.ciclo}. Já previsto: ${formatarMoeda(dados.proximo.valor)}`" />
    </div>

    <div v-if="semGastos" class="mb-6 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-6 text-center">
        <p class="font-semibold text-indigo-900">Ainda não há gastos neste período</p>
        <p class="mx-auto mt-1 max-w-md text-sm text-indigo-800">Comece cadastrando um gasto avulso, um gasto fixo ou uma compra parcelada. Os gráficos aparecem aqui sozinhos.</p>
        <div class="mt-4 flex flex-wrap justify-center gap-3">
            <RouterLink to="/gastos-avulsos" class="btn-primario">Gastos avulsos</RouterLink>
            <RouterLink to="/gastos-fixos" class="btn-secundario">Gastos fixos</RouterLink>
            <RouterLink to="/parcelas" class="btn-secundario">Parcelas</RouterLink>
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
        <ChartCard class="lg:col-span-2" titulo="Gasto por dia" descricao="Quanto saiu em cada dia, separado por tipo. Parcelas caem no dia do vencimento e fixos no dia de cobrança." :vazio="semGastos">
            <BarChart :labels="porDiaDados.labels" :datasets="porDiaDados.datasets" empilhado />
        </ChartCard>

        <ChartCard titulo="Gasto por categoria" descricao="Para onde foi o seu dinheiro no período." :vazio="!g.por_categoria.length">
            <DoughnutChart :itens="g.por_categoria" />
        </ChartCard>
        <ChartCard titulo="Gasto por tipo" descricao="Quanto é parcela, quanto é fixo e quanto é avulso." :vazio="semGastos">
            <DoughnutChart :itens="porTipo" />
        </ChartCard>

        <ChartCard class="lg:col-span-2" titulo="Evolução por ciclo" descricao="Total de cada um dos últimos 12 ciclos, até o ciclo escolhido." :vazio="g.evolucao.totais.every((v) => v === 0)">
            <BarChart :labels="evolucaoDados.labels" :datasets="evolucaoDados.datasets" empilhado />
        </ChartCard>

        <ChartCard titulo="Comparação com o período anterior" descricao="Você gastou mais ou menos que no período anterior?" :vazio="comp.total_anterior === 0 && semGastos">
            <div class="mb-4 flex items-center gap-3">
                <span class="flex h-11 w-11 items-center justify-center rounded-xl" :class="subiu ? 'bg-red-50 text-red-600' : caiu ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'">
                    <ArrowUpRight v-if="subiu" class="h-6 w-6" />
                    <ArrowDownRight v-else-if="caiu" class="h-6 w-6" />
                    <Minus v-else class="h-6 w-6" />
                </span>
                <div>
                    <p class="text-xl font-semibold tabular-nums" :class="subiu ? 'text-red-600' : caiu ? 'text-emerald-600' : 'text-slate-700'">
                        {{ subiu ? '+' : '' }}{{ formatarMoeda(comp.diferenca) }}
                        <span v-if="comp.percentual !== null" class="text-base">({{ subiu ? '+' : '' }}{{ formatarPercentual(comp.percentual) }})</span>
                    </p>
                    <p class="text-sm text-slate-500">
                        <template v-if="comp.percentual === null">Sem gastos no período anterior para comparar.</template>
                        <template v-else>{{ subiu ? 'Gastou mais' : caiu ? 'Gastou menos' : 'Igual' }} que em {{ comp.rotulo_anterior }}.</template>
                    </p>
                </div>
            </div>
            <BarChart :labels="comparativo.labels" :datasets="comparativo.datasets" :legenda="false" :altura="200" />
        </ChartCard>

        <ChartCard titulo="Parcelas: valor por ciclo" descricao="Quanto vence em parcelas em cada ciclo. Os tons claros são previsões." :vazio="g.parcelas_por_ciclo.valores.every((v) => v === 0)">
            <BarChart :labels="parcelasCiclo.labels" :datasets="parcelasCiclo.datasets" :legenda="false" />
        </ChartCard>
        <ChartCard titulo="Parcelas: falta pagar em cada compra" descricao="O que ainda resta de cada compra, com as parcelas pagas entre parênteses." :vazio="!g.saldo_parcelas.length">
            <BarChart :labels="saldoCompras.labels" :datasets="saldoCompras.datasets" horizontal :legenda="false" :altura="Math.max(200, g.saldo_parcelas.length * 44)" />
        </ChartCard>

        <ChartCard titulo="Gastos fixos por categoria" descricao="Em quais categorias estão as suas contas fixas." :vazio="!g.fixos_por_categoria.length">
            <DoughnutChart :itens="g.fixos_por_categoria" />
        </ChartCard>
        <ChartCard titulo="Peso dos fixos no total" descricao="Quanto dos seus gastos já está comprometido com contas fixas." :vazio="semGastos">
            <DoughnutChart :itens="pesoFixos" />
        </ChartCard>

        <ChartCard titulo="Gastos avulsos por dia" descricao="Os gastos pontuais, dia a dia." :vazio="t.avulsos === 0">
            <BarChart :labels="avulsosDia.labels" :datasets="avulsosDia.datasets" :legenda="false" />
        </ChartCard>
        <ChartCard titulo="Gastos avulsos por categoria" descricao="Em que você mais gasta no dia a dia." :vazio="!g.avulsos_por_categoria.length">
            <DoughnutChart :itens="g.avulsos_por_categoria" />
        </ChartCard>
    </div>
</template>
