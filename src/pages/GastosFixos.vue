<script setup>
import { computed, reactive, ref } from 'vue';
import { Pencil, Plus, Repeat, Trash2, TrendingUp } from 'lucide-vue-next';
import PeriodoFilter from '@/components/PeriodoFilter.vue';
import StatCard from '@/components/StatCard.vue';
import ChartCard from '@/components/ChartCard.vue';
import DoughnutChart from '@/components/Charts/DoughnutChart.vue';
import Modal from '@/components/Modal.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import Campo from '@/components/Campo.vue';
import CategoriaTag from '@/components/CategoriaTag.vue';
import Selo from '@/components/Selo.vue';
import EmptyState from '@/components/EmptyState.vue';
import { CORES_TIPO, formatarData, formatarMoeda } from '@/utils/format';
import { usePeriodo } from '@/lib/usePeriodo';
import { estado, novoId, paraNumero } from '@/lib/store';
import { eventosDoPeriodo, porCategoria, totais } from '@/lib/relatorio';
import { hoje } from '@/lib/datas';
import { avisar } from '@/lib/aviso';

const { periodo, filtro } = usePeriodo();

const eventos = computed(() => eventosDoPeriodo(periodo.value, ['fixo']));
const totalPeriodo = computed(() => totais(eventos.value).fixos);
const totalGeral = computed(() => totais(eventosDoPeriodo(periodo.value)).total);
const porCat = computed(() => porCategoria(eventos.value));
const peso = computed(() => (totalGeral.value > 0 ? (totalPeriodo.value / totalGeral.value) * 100 : 0));

const linhas = computed(() => [...estado.fixos].sort((a, b) => a.descricao.localeCompare(b.descricao)));
const situacao = (f) => (!f.ativo ? ['cinza', 'Inativo'] : f.data_fim && f.data_fim < hoje() ? ['cinza', 'Encerrado'] : ['verde', 'Ativo']);

// ---------- Formulário ----------
const modal = ref(false);
const editando = ref(null);
const erros = reactive({});
const vazio = () => ({ descricao: '', categoria_id: estado.categorias[0]?.id ?? 1, valor: '', dia_cobranca: '', data_inicio: hoje(), data_fim: '', ativo: true });
const form = reactive(vazio());

function abrir(f = null) {
    editando.value = f;
    Object.keys(erros).forEach((k) => delete erros[k]);
    Object.assign(form, f ? { ...f, valor: String(f.valor).replace('.', ','), dia_cobranca: f.dia_cobranca ?? '', data_fim: f.data_fim ?? '' } : vazio());
    modal.value = true;
}

function salvar() {
    Object.keys(erros).forEach((k) => delete erros[k]);
    const valor = paraNumero(form.valor);
    const dia = form.dia_cobranca === '' ? null : Number(form.dia_cobranca);
    if (!form.descricao.trim()) erros.descricao = 'Informe a descrição.';
    if (!(valor > 0)) erros.valor = 'Informe um valor maior que zero.';
    if (dia !== null && !(dia >= 1 && dia <= 31)) erros.dia_cobranca = 'Use um dia de 1 a 31.';
    if (!form.data_inicio) erros.data_inicio = 'Informe a data de início.';
    if (form.data_fim && form.data_fim < form.data_inicio) erros.data_fim = 'Deve ser depois do início.';
    if (Object.keys(erros).length) return;

    const dados = { descricao: form.descricao.trim(), categoria_id: Number(form.categoria_id), valor, dia_cobranca: dia, data_inicio: form.data_inicio, data_fim: form.data_fim || null, ativo: form.ativo };
    if (editando.value) {
        Object.assign(estado.fixos.find((x) => x.id === editando.value.id), dados);
        avisar('Gasto fixo atualizado.');
    } else {
        estado.fixos.push({ id: novoId(), ...dados });
        avisar('Gasto fixo cadastrado.');
    }
    modal.value = false;
}

const excluindo = ref(null);
function excluir() {
    estado.fixos = estado.fixos.filter((f) => f.id !== excluindo.value.id);
    excluindo.value = null;
    avisar('Gasto fixo excluído.');
}
</script>

<template>
    <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
            <h1 class="text-2xl font-semibold">Gastos fixos</h1>
            <p class="mt-1 text-sm text-slate-500">Contas que se repetem todo ciclo, como aluguel, internet e assinaturas.</p>
        </div>
        <button class="btn-primario" @click="abrir()"><Plus class="h-4 w-4" /> Novo gasto fixo</button>
    </header>

    <PeriodoFilter :periodo="filtro" />

    <div class="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard titulo="Fixos no período" :valor="totalPeriodo" :icone="Repeat" :cor="CORES_TIPO.fixo" dica="Soma dos fixos cobrados no período" />
        <StatCard titulo="Peso no total de gastos" :texto="`${peso.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`" :icone="TrendingUp" cor="#0d9488" dica="Quanto dos seus gastos já está comprometido" />
    </div>

    <ChartCard class="mb-6" titulo="Fixos por categoria" descricao="Em quais categorias estão as suas contas fixas." :vazio="!porCat.length">
        <DoughnutChart :itens="porCat" />
    </ChartCard>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <EmptyState v-if="!linhas.length" titulo="Nenhum gasto fixo cadastrado" texto="Cadastre suas contas recorrentes para ver o quanto já está comprometido todo mês.">
            <button class="btn-primario" @click="abrir()"><Plus class="h-4 w-4" /> Novo gasto fixo</button>
        </EmptyState>
        <div v-else class="overflow-x-auto">
            <table class="tabela">
                <thead>
                    <tr class="text-left"><th>Descrição</th><th>Categoria</th><th class="text-right">Valor</th><th>Cobrança</th><th>Vigência</th><th>Situação</th><th /></tr>
                </thead>
                <tbody>
                    <tr v-for="f in linhas" :key="f.id">
                        <td class="font-medium">{{ f.descricao }}</td>
                        <td><CategoriaTag :id="f.categoria_id" /></td>
                        <td class="text-right tabular-nums">{{ formatarMoeda(f.valor) }}</td>
                        <td class="whitespace-nowrap">{{ f.dia_cobranca ? `Dia ${f.dia_cobranca}` : 'Dia do vencimento' }}</td>
                        <td class="whitespace-nowrap text-slate-500">{{ formatarData(f.data_inicio) }} → {{ f.data_fim ? formatarData(f.data_fim) : 'sem fim' }}</td>
                        <td><Selo :tom="situacao(f)[0]">{{ situacao(f)[1] }}</Selo></td>
                        <td class="whitespace-nowrap text-right">
                            <button class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Editar" @click="abrir(f)"><Pencil class="h-4 w-4" /></button>
                            <button class="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir" @click="excluindo = f"><Trash2 class="h-4 w-4" /></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <Modal :aberto="modal" :titulo="editando ? 'Editar gasto fixo' : 'Novo gasto fixo'" @fechar="modal = false">
        <form class="space-y-4" @submit.prevent="salvar">
            <Campo label="Descrição" :erro="erros.descricao"><input v-model="form.descricao" class="input" placeholder="Ex.: Internet" autofocus /></Campo>
            <div class="grid gap-4 sm:grid-cols-2">
                <Campo label="Categoria"><select v-model="form.categoria_id" class="input"><option v-for="c in estado.categorias" :key="c.id" :value="c.id">{{ c.nome }}</option></select></Campo>
                <Campo label="Valor (R$)" :erro="erros.valor"><input v-model="form.valor" inputmode="decimal" class="input" placeholder="0,00" /></Campo>
                <Campo label="Dia de cobrança (opcional)" :erro="erros.dia_cobranca" dica="Vazio = usa o dia de vencimento."><input v-model="form.dia_cobranca" type="number" min="1" max="31" class="input" /></Campo>
                <Campo label="Início" :erro="erros.data_inicio"><input v-model="form.data_inicio" type="date" class="input" /></Campo>
                <Campo label="Fim (opcional)" :erro="erros.data_fim"><input v-model="form.data_fim" type="date" class="input" /></Campo>
                <label class="flex items-center gap-2 pt-6 text-sm"><input v-model="form.ativo" type="checkbox" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /> Ativo</label>
            </div>
            <p v-if="editando" class="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Atenção: mudar o valor vale para todos os ciclos, inclusive os passados.</p>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="btn-secundario" @click="modal = false">Cancelar</button>
                <button type="submit" class="btn-primario">Salvar</button>
            </div>
        </form>
    </Modal>

    <ConfirmModal :aberto="!!excluindo" titulo="Excluir gasto fixo?" :texto="`“${excluindo?.descricao}” será removido de todos os ciclos.`" @fechar="excluindo = null" @confirmar="excluir" />
</template>
