// "Banco de dados" da demonstração: tudo fica no localStorage do navegador.
// Substitui o MySQL + Eloquent do sistema original (Laravel).
import { computed, reactive, watch } from 'vue';
import { criarCiclos } from './ciclo';
import { hoje, somarDias } from './datas';
import { gerarDadosExemplo, categoriasPadrao } from './seed';

const CHAVE = 'controle-gastos-demo:v1';

const vazio = () => ({
    config: { dia_vencimento: 23, juros_pix: 5, limite_avulsos: 0 },
    categorias: categoriasPadrao(),
    parcelas: [],
    fixos: [],
    avulsos: [],
    prox_id: 1,
});

function carregar() {
    try {
        const bruto = localStorage.getItem(CHAVE);
        if (bruto) {
            const dados = JSON.parse(bruto);
            if (dados && Array.isArray(dados.parcelas) && dados.config) return dados;
        }
    } catch {
        /* localStorage indisponível ou corrompido: cai nos dados de exemplo */
    }
    return gerarDadosExemplo();
}

export const estado = reactive(carregar());

let podeGravar = true;
watch(
    estado,
    (v) => {
        if (!podeGravar) return;
        try {
            localStorage.setItem(CHAVE, JSON.stringify(v));
        } catch {
            /* sem espaço/sem permissão: a sessão continua funcionando em memória */
        }
    },
    { deep: true },
);

/** Serviço de ciclos, sempre com o dia de vencimento atual das configurações. */
export const ciclos = computed(() => criarCiclos(estado.config.dia_vencimento));

export const novoId = () => estado.prox_id++;

function substituir(novo) {
    podeGravar = false;
    Object.keys(estado).forEach((k) => delete estado[k]);
    Object.assign(estado, novo);
    podeGravar = true;
    localStorage.setItem(CHAVE, JSON.stringify(estado));
}

export const restaurarExemplo = () => substituir(gerarDadosExemplo());
// Apaga só os gastos; mantém as categorias e as configurações atuais.
export const limparTudo = () =>
    substituir({ ...vazio(), config: JSON.parse(JSON.stringify(estado.config)), categorias: JSON.parse(JSON.stringify(estado.categorias)), prox_id: estado.prox_id });

// ---------- Categorias ----------
export const categoriaPorId = (id) => estado.categorias.find((c) => c.id === id);
export const categoriaEmUso = (id) =>
    [...estado.parcelas, ...estado.fixos, ...estado.avulsos].some((g) => g.categoria_id === id);

// ---------- Gastos avulsos ----------
/**
 * Valor final conforme a forma de pagamento. Pix recebe um acréscimo (padrão 5%, configurável).
 * O percentual usado fica gravado no próprio gasto: mudar a configuração depois não reescreve o passado.
 */
export function prepararAvulso(dados) {
    const digitado = Math.round(paraNumero(dados.valor) * 100) / 100;
    const juros = dados.forma_pagamento === 'pix' ? Number(estado.config.juros_pix) || 0 : 0;
    return {
        ...dados,
        valor_original: digitado,
        juros_percentual: juros,
        valor: Math.round(digitado * (1 + juros / 100) * 100) / 100,
    };
}

/** Aceita "1.234,56" (com vírgula, os pontos são milhares) e "12.5" (sem vírgula, ponto é decimal). */
export function paraNumero(valor) {
    if (typeof valor === 'number') return valor;
    let v = String(valor ?? '').trim();
    if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

// ---------- Parcelas ----------
export const PARCELA_ATIVA = 'ativa';
export const PARCELA_VENCIDA = 'vencida';

/** Cria a parcela já ancorada no ciclo atual. */
export function ancorarParcela(dados) {
    const chave = ciclos.value.cicloAtual().chave;
    return {
        ...dados,
        ciclo_inicial: chave,
        ultimo_ciclo_processado: chave,
        status: PARCELA_ATIVA,
        parcela_inicial: Number(dados.parcela_atual),
    };
}

/** Número da parcela no ciclo informado, ou null se não conta nesse ciclo. */
export function numeroNoCiclo(p, ciclo) {
    const inicial = ciclos.value.cicloDaChave(p.ciclo_inicial);
    if (!inicial) return null;
    const numero = p.parcela_inicial + ciclos.value.diferenca(inicial, ciclo);
    return numero >= p.parcela_inicial && numero <= p.total_parcelas ? numero : null;
}

/** ativa | vencida | futura (ainda não cadastrada nesse ciclo). */
export function situacaoNoCiclo(p, ciclo) {
    const inicial = ciclos.value.cicloDaChave(p.ciclo_inicial);
    if (!inicial) return { numero: null, situacao: 'futura' };
    const numero = p.parcela_inicial + ciclos.value.diferenca(inicial, ciclo);
    if (numero < p.parcela_inicial) return { numero: null, situacao: 'futura' };
    if (numero > p.total_parcelas) return { numero: p.total_parcelas, situacao: 'vencida' };
    return { numero, situacao: 'ativa' };
}

/** Parcelas pagas ao final do ciclo (limitado ao total), ou null se ainda não tinha começado. */
export function pagasAteCiclo(p, ciclo) {
    const inicial = ciclos.value.cicloDaChave(p.ciclo_inicial);
    if (!inicial) return null;
    const numero = p.parcela_inicial + ciclos.value.diferenca(inicial, ciclo);
    return numero < p.parcela_inicial ? null : Math.min(numero, p.total_parcelas);
}

/** Data da próxima cobrança (início do próximo ciclo), ou null se já quitada. */
export function proximoVencimentoParcela(p) {
    if (p.status !== PARCELA_ATIVA || p.parcela_atual >= p.total_parcelas) return null;
    const ultimo = ciclos.value.cicloDaChave(p.ultimo_ciclo_processado);
    return ultimo ? ciclos.value.proximo(ultimo).inicio : null;
}

/**
 * Avança todas as parcelas ativas até o ciclo atual. Idempotente e com recuperação:
 * aplica quantos ciclos estiverem pendentes, sem pular nem duplicar.
 */
export function avancarParcelas() {
    const alvo = ciclos.value.cicloAtual();
    let alteradas = 0;
    for (const p of estado.parcelas) {
        if (p.ultimo_ciclo_processado >= alvo.chave) continue;
        const ultimo = ciclos.value.cicloDaChave(p.ultimo_ciclo_processado);
        const passos = ultimo ? ciclos.value.diferenca(ultimo, alvo) : 0;
        for (let i = 0; i < passos && p.status === PARCELA_ATIVA; i++) {
            if (p.parcela_atual >= p.total_parcelas) p.status = PARCELA_VENCIDA;
            else p.parcela_atual++;
        }
        p.ultimo_ciclo_processado = alvo.chave;
        alteradas++;
    }
    return alteradas;
}

export { hoje, somarDias };
