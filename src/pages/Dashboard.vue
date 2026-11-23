<script setup>
import { computed, ref } from 'vue';
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
const aba = ref('geral');
const ABAS = [{ id: 'geral', nome: 'Visão geral' }, { id: 'parcelas', nome: 'Parcelas' }, { id: 'fixos', nome: 'Gastos fixos' }, { id: 'avulsos', nome: 'Gastos avulsos' }];
const partes = computed(() => [
    { nome: 'Parcelas', cor: CORES_TIPO.parcela, valor: t.value.parcelas },
    { nome: 'Fixos', cor: CORES_TIPO.fixo, valor: t.value.fixos },
    { nome: 'Avulsos', cor: CORES_TIPO.avulso, valor: t.value.avulsos },
].map((x) => ({ ...x, pct: t.value.total ? (x.valor / t.value.total) * 100 : 0 })));
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

    <section class="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-lg shadow-indigo-200/60 sm:p-8">
        <div class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"></div>
        <div class="relative grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
                <p class="flex items-center gap-2 text-sm font-medium text-indigo-100"><Wallet class="h-4 w-4" /> Total gasto no período</p>
                <p class="mt-2 text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">{{ formatarMoeda(t.total) }}</p>
                <p class="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium" :class="subiu ? 'bg-red-400/25 text-red-50' : caiu ? 'bg-emerald-400/25 text-emerald-50' : 'bg-white/15 text-indigo-50'">
                    <ArrowUpRight v-if="subiu" class="h-4 w-4" />
                    <ArrowDownRight v-else-if="caiu" class="h-4 w-4" />
                    <Minus v-else class="h-4 w-4" />
                    <template v-if="comp.percentual === null">Sem período anterior para comparar</template>
                    <template v-else>{{ subiu ? '+' : '' }}{{ formatarMoeda(comp.diferenca) }} ({{ subiu ? '+' : '' }}{{ formatarPercentual(comp.percentual) }}) vs {{ comp.rotulo_anterior }}</template>
                </p>
            </div>
            <div>
                <p class="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-200">Como esse total se divide</p>
                <div class="flex h-3 overflow-hidden rounded-full bg-white/15">
                    <div v-for="x in partes" :key="x.nome" :style="{ width: x.pct + '%', backgroundColor: x.cor }" class="transition-all duration-500"></div>
                </div>
                <ul class="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <li v-for="x in partes" :key="x.nome">
                        <span class="flex items-center gap-1.5 text-indigo-100"><span class="h-2 w-2 rounded-full" :style="{ backgroundColor: x.cor }"></span>{{ x.nome }}</span>
                        <span class="font-semibold tabular-nums">{{ formatarMoeda(x.valor) }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </section>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard class="lg:col-span-2" titulo="Parcelas" :valor="t.parcelas" :icone="CreditCard" :cor="CORES_TIPO.parcela" dica="Compras parceladas que vencem no período" />
        <StatCard class="lg:col-span-2" titulo="Gastos fixos" :valor="t.fixos" :icone="Repeat" :cor="CORES_TIPO.fixo" dica="Contas que se repetem todo ciclo" />
        <StatCard class="sm:col-span-2 lg:col-span-2" titulo="Gastos avulsos" :valor="t.avulsos" :icone="Receipt" :cor="CORES_TIPO.avulso" dica="Gastos pontuais do dia a dia">
            <LimiteBarra v-if="dados.limite" compacto :gasto="t.avulsos" :limite="dados.limite" />
        </StatCard>
        <StatCard class="lg:col-span-3" titulo="Falta pagar em parcelas" :valor="dados.saldo.total_restante" :icone="Hourglass" cor="#ef4444" dica="Saldo das compras parceladas, ao fim do período" />
        <StatCard class="lg:col-span-3" titulo="Próximo vencimento" :texto="formatarData(dados.proximo.data)" :icone="CalendarClock" cor="#0d9488" :dica="`Início do ciclo ${dados.proximo.ciclo}. Já previsto: ${formatarMoeda(dados.proximo.valor)}`" />
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

    <nav class="mb-5 inline-flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Gráficos">
        <button v-for="a in ABAS" :key="a.id" type="button" class="rounded-xl px-4 py-2 text-sm font-medium transition" :class="aba === a.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'" @click="aba = a.id">{{ a.nome }}</button>
    </nav>

    <div v-if="aba === 'geral'" class="grid gap-6 lg:grid-cols-2">
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

    </div>
    <div v-else-if="aba === 'parcelas'" class="grid gap-6 lg:grid-cols-2">
        <ChartCard titulo="Parcelas: valor por ciclo" descricao="Quanto vence em parcelas em cada ciclo. Os tons claros são previsões." :vazio="g.parcelas_por_ciclo.valores.every((v) => v === 0)">
            <BarChart :labels="parcelasCiclo.labels" :datasets="parcelasCiclo.datasets" :legenda="false" />
        </ChartCard>
        <ChartCard titulo="Parcelas: falta pagar em cada compra" descricao="O que ainda resta de cada compra, com as parcelas pagas entre parênteses." :vazio="!g.saldo_parcelas.length">
            <BarChart :labels="saldoCompras.labels" :datasets="saldoCompras.datasets" horizontal :legenda="false" :altura="Math.max(200, g.saldo_parcelas.length * 44)" />
        </ChartCard>

    </div>
    <div v-else-if="aba === 'fixos'" class="grid gap-6 lg:grid-cols-2">
        <ChartCard titulo="Gastos fixos por categoria" descricao="Em quais categorias estão as suas contas fixas." :vazio="!g.fixos_por_categoria.length">
            <DoughnutChart :itens="g.fixos_por_categoria" />
        </ChartCard>
        <ChartCard titulo="Peso dos fixos no total" descricao="Quanto dos seus gastos já está comprometido com contas fixas." :vazio="semGastos">
            <DoughnutChart :itens="pesoFixos" />
        </ChartCard>

    </div>
    <div v-else class="grid gap-6 lg:grid-cols-2">
        <ChartCard titulo="Gastos avulsos por dia" descricao="Os gastos pontuais, dia a dia." :vazio="t.avulsos === 0">
            <BarChart :labels="avulsosDia.labels" :datasets="avulsosDia.datasets" :legenda="false" />
        </ChartCard>
        <ChartCard titulo="Gastos avulsos por categoria" descricao="Em que você mais gasta no dia a dia." :vazio="!g.avulsos_por_categoria.length">
            <DoughnutChart :itens="g.avulsos_por_categoria" />
        </ChartCard>
    </div>
</template>
