<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { CreditCard, Hourglass, Pencil, Plus, Trash2, CheckCircle2 } from 'lucide-vue-next';
import PeriodoFilter from '@/components/PeriodoFilter.vue';
import StatCard from '@/components/StatCard.vue';
import ChartCard from '@/components/ChartCard.vue';
import BarChart from '@/components/Charts/BarChart.vue';
import Modal from '@/components/Modal.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import Campo from '@/components/Campo.vue';
import CategoriaTag from '@/components/CategoriaTag.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import Selo from '@/components/Selo.vue';
import EmptyState from '@/components/EmptyState.vue';
import Pagination from '@/components/Pagination.vue';
import { usePaginacao } from '@/lib/usePaginacao';
import { CORES_TIPO, formatarData, formatarMoeda } from '@/utils/format';
import { usePeriodo } from '@/lib/usePeriodo';
import { ancorarParcela, ciclos, estado, novoId, numeroNoCiclo, pagasAteCiclo, paraNumero, proximoVencimentoParcela, situacaoNoCiclo } from '@/lib/store';
import { evolucao, saldoParcelas } from '@/lib/relatorio';
import { avisar } from '@/lib/aviso';

const { periodo, filtro } = usePeriodo();
const ref_ = computed(() => periodo.value.ciclo || ciclos.value.cicloDaData(periodo.value.fim));
const situacao = ref('todas');

const linhas = computed(() =>
    estado.parcelas
        .map((p) => {
            const s = situacaoNoCiclo(p, ref_.value);
            const pagas = pagasAteCiclo(p, ref_.value);
            return {
                ...p,
                numero: s.numero,
                sit: s.situacao,
                saldo: pagas === null ? null : (p.total_parcelas - pagas) * Number(p.valor_parcela),
                proximo: proximoVencimentoParcela(p),
            };
        })
        .filter((l) => (situacao.value === 'todas' ? true : situacao.value === 'ativas' ? l.sit === 'ativa' : l.sit === 'vencida'))
        .sort((a, b) => a.descricao.localeCompare(b.descricao)),
);

const pg = usePaginacao(linhas, 10);
// Trocar o filtro (todas/ativas/vencidas) ou o ciclo volta à primeira página.
watch([situacao, ref_], () => pg.reiniciar());

const totalCiclo = computed(() =>
    estado.parcelas.reduce((s, p) => s + (numeroNoCiclo(p, ref_.value) !== null ? Number(p.valor_parcela) : 0), 0),
);
const saldo = computed(() => saldoParcelas(periodo.value).total_restante);
const grafico = computed(() => {
    const e = evolucao(ref_.value, 5, 6);
    const atual = ciclos.value.cicloAtual().chave;
    return { labels: e.labels, datasets: [{ label: 'Parcelas', data: e.parcelas, color: e.chaves.map((c) => (c === atual ? CORES_TIPO.parcela : c > atual ? '#c7d2fe' : '#a5b4fc')) }] };
});

// ---------- Formulário ----------
const modal = ref(false);
const editando = ref(null);
const erros = reactive({});
const form = reactive({ descricao: '', categoria_id: 1, valor_parcela: '', total_parcelas: 12, parcela_atual: 1, observacao: '' });

function abrir(p = null) {
    editando.value = p;
    Object.keys(erros).forEach((k) => delete erros[k]);
    Object.assign(form, p
        ? { descricao: p.descricao, categoria_id: p.categoria_id, valor_parcela: String(p.valor_parcela).replace('.', ','), total_parcelas: p.total_parcelas, parcela_atual: p.parcela_atual, observacao: p.observacao || '' }
        : { descricao: '', categoria_id: estado.categorias[0]?.id ?? 1, valor_parcela: '', total_parcelas: 12, parcela_atual: 1, observacao: '' });
    modal.value = true;
}

function salvar() {
    Object.keys(erros).forEach((k) => delete erros[k]);
    const valor = paraNumero(form.valor_parcela);
    const total = Number(form.total_parcelas);
    const atual = Number(form.parcela_atual);
    if (!form.descricao.trim()) erros.descricao = 'Informe a descrição.';
    if (!(valor > 0)) erros.valor_parcela = 'Informe um valor maior que zero.';
    if (!(total >= 1)) erros.total_parcelas = 'Mínimo de 1 parcela.';
    if (!(atual >= 1 && atual <= total)) erros.parcela_atual = 'Deve estar entre 1 e o total de parcelas.';
    if (Object.keys(erros).length) return;

    const dados = { descricao: form.descricao.trim(), categoria_id: Number(form.categoria_id), valor_parcela: valor, total_parcelas: total, parcela_atual: atual, observacao: form.observacao };
    if (editando.value) {
        const p = estado.parcelas.find((x) => x.id === editando.value.id);
        if (atual !== p.parcela_atual) {
            // Corrigir a "parcela atual" reancora o histórico no ciclo de hoje.
            Object.assign(p, ancorarParcela(dados));
        } else {
            const { parcela_atual, ...resto } = dados;
            Object.assign(p, resto);
        }
        avisar('Parcela atualizada.');
    } else {
        estado.parcelas.push({ id: novoId(), ...ancorarParcela(dados) });
        avisar('Parcela cadastrada.');
    }
    modal.value = false;
}

const excluindo = ref(null);
function excluir() {
    estado.parcelas = estado.parcelas.filter((p) => p.id !== excluindo.value.id);
    excluindo.value = null;
    avisar('Parcela excluída.');
}
</script>

<template>
    <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
            <h1 class="text-2xl font-semibold">Parcelas</h1>
            <p class="mt-1 text-sm text-slate-500">Compras parceladas: cada compra é um único registro e a parcela avança sozinha a cada ciclo.</p>
        </div>
        <button class="btn-primario" @click="abrir()"><Plus class="h-4 w-4" /> Nova parcela</button>
    </header>

    <PeriodoFilter :periodo="filtro" />

    <div class="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard titulo="Parcelas do período" :valor="totalCiclo" :icone="CreditCard" :cor="CORES_TIPO.parcela" dica="Soma das parcelas que vencem neste ciclo" />
        <StatCard titulo="Falta pagar" :valor="saldo" :icone="Hourglass" cor="#ef4444" dica="Saldo de todas as compras, ao fim do ciclo" />
    </div>

    <ChartCard class="mb-6" titulo="Valor das parcelas por ciclo" descricao="Quanto vence em cada ciclo. Os tons claros são previsões." :vazio="grafico.datasets[0].data.every((v) => v === 0)">
        <BarChart :labels="grafico.labels" :datasets="grafico.datasets" :legenda="false" :altura="240" />
    </ChartCard>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center gap-2 border-b border-slate-100 p-4">
            <button v-for="f in ['todas', 'ativas', 'vencidas']" :key="f" class="rounded-lg px-3 py-1.5 text-sm font-medium capitalize" :class="situacao === f ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'" @click="situacao = f">{{ f }}</button>
        </div>

        <EmptyState v-if="!linhas.length" titulo="Nenhuma parcela por aqui" texto="Cadastre uma compra parcelada para acompanhar quanto falta pagar.">
            <button class="btn-primario" @click="abrir()"><Plus class="h-4 w-4" /> Nova parcela</button>
        </EmptyState>

        <div v-else class="overflow-x-auto">
            <table class="tabela">
                <thead>
                    <tr class="text-left">
                        <th>Descrição</th><th>Categoria</th><th class="min-w-[150px]">Parcela</th>
                        <th class="text-right">Valor</th><th class="text-right">Falta pagar</th><th>Próx. vencimento</th><th>Situação</th><th />
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="l in pg.itens.value" :key="l.id">
                        <td class="font-medium">{{ l.descricao }}</td>
                        <td><CategoriaTag :id="l.categoria_id" /></td>
                        <td>
                            <template v-if="l.numero !== null">
                                <span class="text-xs font-semibold tabular-nums text-slate-600">{{ l.numero }}/{{ l.total_parcelas }}</span>
                                <ProgressBar class="mt-1" :valor="l.numero" :total="l.total_parcelas" :cor="l.sit === 'vencida' ? '#10b981' : '#6366f1'" />
                            </template>
                            <span v-else class="text-xs text-slate-400">—</span>
                        </td>
                        <td class="text-right tabular-nums">{{ formatarMoeda(l.valor_parcela) }}</td>
                        <td class="text-right tabular-nums">{{ l.saldo === null ? '—' : formatarMoeda(l.saldo) }}</td>
                        <td class="whitespace-nowrap">{{ l.proximo ? formatarData(l.proximo) : '—' }}</td>
                        <td>
                            <Selo v-if="l.sit === 'ativa'" tom="indigo">Ativa</Selo>
                            <Selo v-else-if="l.sit === 'vencida'" tom="verde"><CheckCircle2 class="mr-1 h-3.5 w-3.5" /> Quitada</Selo>
                            <Selo v-else tom="cinza">Ainda não começou</Selo>
                        </td>
                        <td class="whitespace-nowrap text-right">
                            <button class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Editar" @click="abrir(l)"><Pencil class="h-4 w-4" /></button>
                            <button class="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir" @click="excluindo = l"><Trash2 class="h-4 w-4" /></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <Pagination v-model:por-pagina="pg.porPagina.value" :pagina="pg.pagina.value" :ultima="pg.ultima.value" :total="pg.total.value" @ir="pg.irPara" />
    </section>

    <Modal :aberto="modal" :titulo="editando ? 'Editar parcela' : 'Nova compra parcelada'" @fechar="modal = false">
        <form class="space-y-4" @submit.prevent="salvar">
            <Campo label="Descrição" :erro="erros.descricao"><input v-model="form.descricao" class="input" placeholder="Ex.: Notebook" autofocus /></Campo>
            <div class="grid gap-4 sm:grid-cols-2">
                <Campo label="Categoria"><select v-model="form.categoria_id" class="input"><option v-for="c in estado.categorias" :key="c.id" :value="c.id">{{ c.nome }}</option></select></Campo>
                <Campo label="Valor de cada parcela (R$)" :erro="erros.valor_parcela"><input v-model="form.valor_parcela" inputmode="decimal" class="input" placeholder="0,00" /></Campo>
                <Campo label="Total de parcelas" :erro="erros.total_parcelas"><input v-model="form.total_parcelas" type="number" min="1" class="input" /></Campo>
                <Campo label="Parcela atual" :erro="erros.parcela_atual" dica="Quantas já foram pagas, contando a deste ciclo."><input v-model="form.parcela_atual" type="number" min="1" class="input" /></Campo>
            </div>
            <Campo label="Observação (opcional)"><input v-model="form.observacao" class="input" /></Campo>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="btn-secundario" @click="modal = false">Cancelar</button>
                <button type="submit" class="btn-primario">Salvar</button>
            </div>
        </form>
    </Modal>

    <ConfirmModal :aberto="!!excluindo" titulo="Excluir parcela?" :texto="`A compra “${excluindo?.descricao}” será removida de todos os ciclos.`" @fechar="excluindo = null" @confirmar="excluir" />
</template>
