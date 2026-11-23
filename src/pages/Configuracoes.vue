<script setup>
import { computed, reactive, ref } from 'vue';
import { Pencil, Plus, RotateCcw, Trash2, Eraser } from 'lucide-vue-next';
import Modal from '@/components/Modal.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import Campo from '@/components/Campo.vue';
import { estado, categoriaEmUso, limparTudo, novoId, paraNumero, restaurarExemplo } from '@/lib/store';
import { formatarData } from '@/utils/format';
import { criarCiclos } from '@/lib/ciclo';
import { avisar } from '@/lib/aviso';

// ---------- Ciclo e regras ----------
const cfg = reactive({
    dia_vencimento: estado.config.dia_vencimento,
    limite_avulsos: estado.config.limite_avulsos ? String(estado.config.limite_avulsos).replace('.', ',') : '',
});
const erroCfg = reactive({});

// Prévia ao vivo, sem gravar nada.
const previa = computed(() => {
    const dia = Number(cfg.dia_vencimento);
    if (!(dia >= 1 && dia <= 31)) return null;
    return criarCiclos(dia).cicloAtual();
});

function salvarConfig() {
    Object.keys(erroCfg).forEach((k) => delete erroCfg[k]);
    const dia = Number(cfg.dia_vencimento);
    const limite = cfg.limite_avulsos === '' ? 0 : paraNumero(cfg.limite_avulsos);
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) erroCfg.dia_vencimento = 'Use um dia de 1 a 31.';
    if (limite < 0) erroCfg.limite_avulsos = 'Não pode ser negativo.';
    if (Object.keys(erroCfg).length) return;
    Object.assign(estado.config, { dia_vencimento: dia, limite_avulsos: limite });
    avisar('Configurações salvas.');
}

// ---------- Categorias ----------
const modal = ref(false);
const editando = ref(null);
const formCat = reactive({ nome: '', cor: '#6366f1' });
const erroCat = ref('');

function abrir(c = null) {
    editando.value = c;
    erroCat.value = '';
    Object.assign(formCat, c ? { nome: c.nome, cor: c.cor } : { nome: '', cor: '#6366f1' });
    modal.value = true;
}
function salvarCat() {
    const nome = formCat.nome.trim();
    if (!nome) return (erroCat.value = 'Informe o nome.');
    if (estado.categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== editando.value?.id)) return (erroCat.value = 'Já existe uma categoria com esse nome.');
    if (editando.value) Object.assign(estado.categorias.find((c) => c.id === editando.value.id), { nome, cor: formCat.cor });
    else estado.categorias.push({ id: novoId(), nome, cor: formCat.cor });
    modal.value = false;
    avisar('Categoria salva.');
}
const excluindo = ref(null);
function pedirExclusao(c) {
    if (categoriaEmUso(c.id)) return avisar('Essa categoria está em uso e não pode ser excluída.', 'erro');
    excluindo.value = c;
}
function excluirCat() {
    estado.categorias = estado.categorias.filter((c) => c.id !== excluindo.value.id);
    excluindo.value = null;
    avisar('Categoria excluída.');
}

// ---------- Dados da demonstração ----------
const confirmando = ref(null);
function executar() {
    if (confirmando.value === 'exemplo') restaurarExemplo();
    else limparTudo();
    Object.assign(cfg, { dia_vencimento: estado.config.dia_vencimento, limite_avulsos: estado.config.limite_avulsos ? String(estado.config.limite_avulsos) : '' });
    confirmando.value = null;
    avisar('Pronto!');
}
</script>

<template>
    <header class="mb-6">
        <h1 class="text-2xl font-semibold">Configurações</h1>
        <p class="mt-1 text-sm text-slate-500">Ajuste o ciclo financeiro, as regras de cálculo e as categorias.</p>
    </header>

    <div class="space-y-6">
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-base font-semibold">Ciclo financeiro e regras</h2>
            <p class="mt-0.5 text-sm text-slate-500">Seu mês financeiro não precisa começar no dia 1: ele vai do dia de vencimento até o dia anterior do mês seguinte.</p>
            <form class="mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="salvarConfig">
                <Campo label="Dia de vencimento (1–31)" :erro="erroCfg.dia_vencimento"><input v-model="cfg.dia_vencimento" type="number" min="1" max="31" class="input" /></Campo>
                <Campo label="Limite de avulsos por ciclo (R$)" :erro="erroCfg.limite_avulsos" dica="Vazio = sem limite."><input v-model="cfg.limite_avulsos" inputmode="decimal" class="input" /></Campo>
                <div class="sm:col-span-2">
                    <p v-if="previa" class="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800">Seu ciclo atual vai de <strong>{{ formatarData(previa.inicio) }}</strong> a <strong>{{ formatarData(previa.fim) }}</strong> ({{ previa.rotulo }}).</p>
                </div>
                <div class="sm:col-span-2"><button type="submit" class="btn-primario">Salvar configurações</button></div>
            </form>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-base font-semibold">Categorias</h2>
                    <p class="mt-0.5 text-sm text-slate-500">Usadas em parcelas, gastos fixos e avulsos.</p>
                </div>
                <button class="btn-secundario" @click="abrir()"><Plus class="h-4 w-4" /> Nova categoria</button>
            </div>
            <ul class="mt-4 divide-y divide-slate-100">
                <li v-for="c in estado.categorias" :key="c.id" class="flex items-center gap-3 py-2.5">
                    <span class="h-4 w-4 rounded-full" :style="{ backgroundColor: c.cor }" />
                    <span class="flex-1 text-sm font-medium">{{ c.nome }}</span>
                    <button class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Editar" @click="abrir(c)"><Pencil class="h-4 w-4" /></button>
                    <button class="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir" @click="pedirExclusao(c)"><Trash2 class="h-4 w-4" /></button>
                </li>
            </ul>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-base font-semibold">Dados da demonstração</h2>
            <p class="mt-0.5 text-sm text-slate-500">Tudo fica salvo apenas neste navegador (localStorage). Você pode voltar aos dados fictícios ou começar do zero.</p>
            <div class="mt-4 flex flex-wrap gap-3">
                <button class="btn-secundario" @click="confirmando = 'exemplo'"><RotateCcw class="h-4 w-4" /> Restaurar dados de exemplo</button>
                <button class="btn-secundario" @click="confirmando = 'limpar'"><Eraser class="h-4 w-4" /> Apagar todos os gastos</button>
            </div>
        </section>
    </div>

    <Modal :aberto="modal" :titulo="editando ? 'Editar categoria' : 'Nova categoria'" largura="max-w-md" @fechar="modal = false">
        <form class="space-y-4" @submit.prevent="salvarCat">
            <Campo label="Nome" :erro="erroCat"><input v-model="formCat.nome" class="input" autofocus /></Campo>
            <Campo label="Cor"><input v-model="formCat.cor" type="color" class="h-10 w-20 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" /></Campo>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="btn-secundario" @click="modal = false">Cancelar</button>
                <button type="submit" class="btn-primario">Salvar</button>
            </div>
        </form>
    </Modal>

    <ConfirmModal :aberto="!!excluindo" titulo="Excluir categoria?" :texto="`A categoria “${excluindo?.nome}” será removida.`" @fechar="excluindo = null" @confirmar="excluirCat" />
    <ConfirmModal :aberto="!!confirmando" :titulo="confirmando === 'exemplo' ? 'Restaurar dados de exemplo?' : 'Apagar todos os gastos?'" :texto="confirmando === 'exemplo' ? 'Tudo o que você cadastrou aqui será substituído pelos dados fictícios.' : 'Parcelas, gastos fixos e avulsos serão apagados. As categorias e configurações continuam.'" :confirmar="confirmando === 'exemplo' ? 'Restaurar' : 'Apagar'" @fechar="confirmando = null" @confirmar="executar" />
</template>
