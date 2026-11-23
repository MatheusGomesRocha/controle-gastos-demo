<script setup>
import { computed, reactive, ref } from 'vue';
import { Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-vue-next';
import PeriodoFilter from '@/components/PeriodoFilter.vue';
import StatCard from '@/components/StatCard.vue';
import LimiteBarra from '@/components/LimiteBarra.vue';
import ChartCard from '@/components/ChartCard.vue';
import BarChart from '@/components/Charts/BarChart.vue';
import DoughnutChart from '@/components/Charts/DoughnutChart.vue';
import Modal from '@/components/Modal.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import Campo from '@/components/Campo.vue';
import CategoriaTag from '@/components/CategoriaTag.vue';
import Selo from '@/components/Selo.vue';
import EmptyState from '@/components/EmptyState.vue';
import { CORES_TIPO, formatarData, formatarMoeda } from '@/utils/format';
import { usePeriodo } from '@/lib/usePeriodo';
import { estado, novoId, paraNumero, prepararAvulso } from '@/lib/store';
import { eventosDoPeriodo, porCategoria, porDia } from '@/lib/relatorio';
import { hoje } from '@/lib/datas';
import { avisar } from '@/lib/aviso';

const { periodo, filtro } = usePeriodo();

const FORMAS = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito', outro: 'Outro' };

const busca = ref('');
const categoriaFiltro = ref('');

const doPeriodo = computed(() => estado.avulsos.filter((g) => g.data >= periodo.value.inicio && g.data <= periodo.value.fim));
const filtrados = computed(() => {
    const q = busca.value.trim().toLowerCase();
    return doPeriodo.value
        .filter((g) => (!q || g.descricao.toLowerCase().includes(q)) && (!categoriaFiltro.value || g.categoria_id === Number(categoriaFiltro.value)))
        .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : b.id - a.id));
});
const totalPeriodo = computed(() => Math.round(doPeriodo.value.reduce((s, g) => s + g.valor, 0) * 100) / 100);
const totalFiltrado = computed(() => Math.round(filtrados.value.reduce((s, g) => s + g.valor, 0) * 100) / 100);
const limite = computed(() => (periodo.value.ciclo ? Number(estado.config.limite_avulsos) || 0 : 0));

const eventos = computed(() => eventosDoPeriodo(periodo.value, ['avulso']));
const graficoDia = computed(() => {
    const d = porDia(eventos.value, periodo.value);
    return { labels: d.labels, datasets: [{ label: 'Gastos avulsos', data: d.avulso, color: CORES_TIPO.avulso }] };
});
const porCat = computed(() => porCategoria(eventos.value));

// ---------- Formulário ----------
const modal = ref(false);
const editando = ref(null);
const erros = reactive({});
// Atenção (igual ao original): o campo da data se chama data_gasto, nunca "data".
const vazio = () => ({ descricao: '', categoria_id: estado.categorias[0]?.id ?? 1, valor: '', data_gasto: hoje(), forma_pagamento: 'debito', observacao: '' });
const form = reactive(vazio());

const previa = computed(() => {
    const v = paraNumero(form.valor);
    if (!(v > 0)) return null;
    return prepararAvulso({ valor: form.valor, forma_pagamento: form.forma_pagamento });
});

function abrir(g = null) {
    editando.value = g;
    Object.keys(erros).forEach((k) => delete erros[k]);
    Object.assign(form, g ? { descricao: g.descricao, categoria_id: g.categoria_id, valor: String(g.valor_original).replace('.', ','), data_gasto: g.data, forma_pagamento: g.forma_pagamento, observacao: g.observacao || '' } : vazio());
    modal.value = true;
}

function salvar() {
    Object.keys(erros).forEach((k) => delete erros[k]);
    if (!form.descricao.trim()) erros.descricao = 'Informe a descrição.';
    if (!(paraNumero(form.valor) > 0)) erros.valor = 'Informe um valor maior que zero.';
    if (!form.data_gasto) erros.data_gasto = 'Informe a data.';
    if (Object.keys(erros).length) return;

    const base = { descricao: form.descricao.trim(), categoria_id: Number(form.categoria_id), data: form.data_gasto, forma_pagamento: form.forma_pagamento, observacao: form.observacao };
    const dados = prepararAvulso({ ...base, valor: form.valor });
    if (editando.value) {
        Object.assign(estado.avulsos.find((x) => x.id === editando.value.id), dados);
        avisar('Gasto atualizado.');
    } else {
        estado.avulsos.push({ id: novoId(), ...dados });
        avisar('Gasto cadastrado.');
    }
    modal.value = false;
}

const excluindo = ref(null);
function excluir() {
    estado.avulsos = estado.avulsos.filter((g) => g.id !== excluindo.value.id);
    excluindo.value = null;
    avisar('Gasto excluído.');
}
</script>

<template>
    <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
            <h1 class="text-2xl font-semibold">Gastos avulsos</h1>
            <p class="mt-1 text-sm text-slate-500">Gastos pontuais do dia a dia. Cada um pertence ao ciclo em que a data cai.</p>
        </div>
        <button class="btn-primario" @click="abrir()"><Plus class="h-4 w-4" /> Novo gasto</button>
    </header>

    <PeriodoFilter :periodo="filtro" />

    <div class="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard titulo="Avulsos no período" :valor="totalPeriodo" :icone="Receipt" :cor="CORES_TIPO.avulso" :dica="`${doPeriodo.length} gasto(s) no período`">
            <LimiteBarra v-if="limite" compacto :gasto="totalPeriodo" :limite="limite" />
        </StatCard>
        <StatCard titulo="Total da lista filtrada" :valor="totalFiltrado" :icone="Search" cor="#64748b" :dica="`${filtrados.length} gasto(s) exibido(s)`" />
    </div>

    <div class="mb-6 grid gap-6 lg:grid-cols-2">
        <ChartCard titulo="Avulsos por dia" descricao="Os gastos pontuais, dia a dia." :vazio="totalPeriodo === 0">
            <BarChart :labels="graficoDia.labels" :datasets="graficoDia.datasets" :legenda="false" :altura="240" />
        </ChartCard>
        <ChartCard titulo="Avulsos por categoria" descricao="Em que você mais gasta no dia a dia." :vazio="!porCat.length">
            <DoughnutChart :itens="porCat" />
        </ChartCard>
    </div>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap gap-3 border-b border-slate-100 p-4">
            <div class="relative min-w-[200px] flex-1">
                <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input v-model="busca" class="input !pl-9" placeholder="Buscar por descrição" />
            </div>
            <select v-model="categoriaFiltro" class="input !w-auto">
                <option value="">Todas as categorias</option>
                <option v-for="c in estado.categorias" :key="c.id" :value="c.id">{{ c.nome }}</option>
            </select>
        </div>

        <EmptyState v-if="!filtrados.length" :titulo="doPeriodo.length ? 'Nada encontrado' : 'Nenhum gasto neste período'" :texto="doPeriodo.length ? 'Tente outra busca ou outra categoria.' : 'Cadastre um gasto avulso para começar.'">
            <button v-if="!doPeriodo.length" class="btn-primario" @click="abrir()"><Plus class="h-4 w-4" /> Novo gasto</button>
        </EmptyState>
        <div v-else class="overflow-x-auto">
            <table class="tabela">
                <thead>
                    <tr class="text-left"><th>Data</th><th>Descrição</th><th>Categoria</th><th>Pagamento</th><th class="text-right">Valor</th><th /></tr>
                </thead>
                <tbody>
                    <tr v-for="g in filtrados" :key="g.id">
                        <td class="whitespace-nowrap">{{ formatarData(g.data) }}</td>
                        <td class="font-medium">{{ g.descricao }}</td>
                        <td><CategoriaTag :id="g.categoria_id" /></td>
                        <td><Selo :tom="g.forma_pagamento === 'pix' ? 'ambar' : 'cinza'">{{ FORMAS[g.forma_pagamento] }}<template v-if="g.juros_percentual > 0"> +{{ g.juros_percentual }}%</template></Selo></td>
                        <td class="text-right tabular-nums">{{ formatarMoeda(g.valor) }}</td>
                        <td class="whitespace-nowrap text-right">
                            <button class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Editar" @click="abrir(g)"><Pencil class="h-4 w-4" /></button>
                            <button class="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir" @click="excluindo = g"><Trash2 class="h-4 w-4" /></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <Modal :aberto="modal" :titulo="editando ? 'Editar gasto' : 'Novo gasto avulso'" @fechar="modal = false">
        <form class="space-y-4" @submit.prevent="salvar">
            <Campo label="Descrição" :erro="erros.descricao"><input v-model="form.descricao" class="input" placeholder="Ex.: Mercado" autofocus /></Campo>
            <div class="grid gap-4 sm:grid-cols-2">
                <Campo label="Valor (R$)" :erro="erros.valor"><input v-model="form.valor" inputmode="decimal" class="input" placeholder="0,00" /></Campo>
                <Campo label="Data" :erro="erros.data_gasto"><input v-model="form.data_gasto" type="date" class="input" /></Campo>
                <Campo label="Categoria"><select v-model="form.categoria_id" class="input"><option v-for="c in estado.categorias" :key="c.id" :value="c.id">{{ c.nome }}</option></select></Campo>
                <Campo label="Forma de pagamento"><select v-model="form.forma_pagamento" class="input"><option v-for="(nome, chave) in FORMAS" :key="chave" :value="chave">{{ nome }}</option></select></Campo>
            </div>
            <p v-if="form.forma_pagamento === 'pix' && previa" class="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Pix com acréscimo de {{ estado.config.juros_pix }}%: o valor lançado será <strong>{{ formatarMoeda(previa.valor) }}</strong>.
            </p>
            <Campo label="Observação (opcional)"><input v-model="form.observacao" class="input" /></Campo>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="btn-secundario" @click="modal = false">Cancelar</button>
                <button type="submit" class="btn-primario">Salvar</button>
            </div>
        </form>
    </Modal>

    <ConfirmModal :aberto="!!excluindo" titulo="Excluir gasto?" :texto="`“${excluindo?.descricao}” será removido.`" @fechar="excluindo = null" @confirmar="excluir" />
</template>
