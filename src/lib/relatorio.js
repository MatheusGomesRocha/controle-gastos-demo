// Port do RelatorioService/PeriodoService do sistema original.
// Tudo nasce de "eventos": cada cobrança vira {data, tipo, valor, categoria}.
//  - parcela: uma por ciclo, no INÍCIO do ciclo (dia de vencimento)
//  - fixo:    uma por ciclo, no dia_cobranca (ou no dia de vencimento, se vazio)
//  - avulso:  na própria data
// Totais, gráficos por dia, por categoria e por tipo são só agrupamentos dos eventos.
import { categoriaPorId, ciclos, estado, numeroNoCiclo, pagasAteCiclo } from './store';
import { diferencaDias, entre, montar, partes, diasNoMes, somarDias, somarMeses } from './datas';

export const TIPOS = ['parcela', 'fixo', 'avulso'];
const arred = (n) => Math.round(n * 100) / 100;

// ---------- Período ----------
export const periodoDoCiclo = (ciclo) => ({
    inicio: ciclo.inicio,
    fim: ciclo.fim,
    ciclo,
    dias: diferencaDias(ciclo.inicio, ciclo.fim) + 1,
    rotulo: ciclo.rotulo,
});

export const periodoLivre = (inicio, fim) => ({
    inicio,
    fim,
    ciclo: null,
    dias: diferencaDias(inicio, fim) + 1,
    rotulo: `${fmt(inicio)} a ${fmt(fim)}`,
});

const fmt = (iso) => iso.split('-').reverse().join('/');
const MAX_DIAS = 1830;
const ehData = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Lê ?ciclo=AAAA-MM ou ?inicio=&fim= (inválido = ciclo atual). */
export function periodoDaConsulta(query) {
    const { inicio, fim, ciclo } = query || {};
    if (ehData(inicio) && ehData(fim) && fim >= inicio && diferencaDias(inicio, fim) < MAX_DIAS) {
        return periodoLivre(inicio, fim);
    }
    const c = ciclo ? ciclos.value.cicloDaChave(String(ciclo)) : null;
    return periodoDoCiclo(c || ciclos.value.cicloAtual());
}

/** Período imediatamente anterior: ciclo anterior, ou intervalo livre de mesmo tamanho. */
export function periodoAnterior(p) {
    if (p.ciclo) return periodoDoCiclo(ciclos.value.anterior(p.ciclo));
    return periodoLivre(somarDias(p.inicio, -p.dias), somarDias(p.inicio, -1));
}

// ---------- Eventos ----------
/** Data em que um gasto fixo é cobrado dentro do ciclo, ou null. */
export function dataCobranca(fixo, ciclo) {
    const dia = fixo.dia_cobranca || ciclos.value.dia;
    for (const ref of [ciclo.inicio, ciclo.fim]) {
        const { a, m } = partes(ref);
        const d = montar(a, m, Math.min(dia, diasNoMes(a, m)));
        if (entre(d, ciclo.inicio, ciclo.fim)) return d;
    }
    return null;
}

export function eventos(inicio, fim, tipos = TIPOS) {
    const lista = [];
    const C = ciclos.value;
    const parcelas = tipos.includes('parcela') ? estado.parcelas : [];
    const fixos = tipos.includes('fixo') ? estado.fixos.filter((f) => f.ativo) : [];

    // Ciclo em que cada fixo começa e termina, calculado uma vez só.
    const limites = new Map(
        fixos.map((f) => [f.id, [C.cicloDaData(f.data_inicio).chave, f.data_fim ? C.cicloDaData(f.data_fim).chave : null]]),
    );

    const ultimo = C.cicloDaData(fim);
    for (let c = C.cicloDaData(inicio); c.chave <= ultimo.chave; c = C.proximo(c)) {
        for (const p of parcelas) {
            const numero = numeroNoCiclo(p, c);
            if (numero !== null && entre(c.inicio, inicio, fim)) {
                lista.push(ev(c.inicio, 'parcela', p.categoria_id, p.valor_parcela, `${p.descricao} (${numero}/${p.total_parcelas})`, p.id));
            }
        }
        for (const f of fixos) {
            // Vale por CICLO: do ciclo em que data_inicio cai até o ciclo em que data_fim cai.
            const [ini, fimC] = limites.get(f.id);
            if (c.chave < ini || (fimC && c.chave > fimC)) continue;
            const data = dataCobranca(f, c);
            if (data && entre(data, inicio, fim)) lista.push(ev(data, 'fixo', f.categoria_id, f.valor, f.descricao, f.id));
        }
    }

    if (tipos.includes('avulso')) {
        for (const g of estado.avulsos) {
            if (entre(g.data, inicio, fim)) lista.push(ev(g.data, 'avulso', g.categoria_id, g.valor, g.descricao, g.id));
        }
    }
    return lista.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

const ev = (data, tipo, categoria_id, valor, descricao, origem_id) => ({
    data,
    tipo,
    categoria_id,
    valor: Number(valor),
    descricao,
    origem_id,
});

export const eventosDoPeriodo = (p, tipos = TIPOS) => eventos(p.inicio, p.fim, tipos);

// ---------- Agrupamentos ----------
const soma = (lista) => lista.reduce((s, e) => s + e.valor, 0);

export function totais(lista) {
    const parcelas = arred(soma(lista.filter((e) => e.tipo === 'parcela')));
    const fixos = arred(soma(lista.filter((e) => e.tipo === 'fixo')));
    const avulsos = arred(soma(lista.filter((e) => e.tipo === 'avulso')));
    return { parcelas, fixos, avulsos, total: arred(parcelas + fixos + avulsos) };
}

/** Gasto por dia, empilhado por tipo. Em períodos longos (> 92 dias) agrupa por mês. */
export function porDia(lista, p) {
    const porMes = p.dias > 92;
    const baldes = new Map();
    if (porMes) {
        let d = `${p.inicio.slice(0, 7)}-01`;
        while (d <= p.fim) {
            baldes.set(d.slice(0, 7), `${d.slice(5, 7)}/${d.slice(0, 4)}`);
            d = somarMeses(d, 1);
        }
    } else {
        for (let d = p.inicio; d <= p.fim; d = somarDias(d, 1)) baldes.set(d, `${d.slice(8, 10)}/${d.slice(5, 7)}`);
    }
    const serie = Object.fromEntries(TIPOS.map((t) => [t, new Map([...baldes.keys()].map((k) => [k, 0]))]));
    for (const e of lista) {
        const chave = porMes ? e.data.slice(0, 7) : e.data;
        if (serie[e.tipo].has(chave)) serie[e.tipo].set(chave, serie[e.tipo].get(chave) + e.valor);
    }
    const valores = (t) => [...serie[t].values()].map(arred);
    return { labels: [...baldes.values()], parcela: valores('parcela'), fixo: valores('fixo'), avulso: valores('avulso') };
}

/** [{nome, cor, total}] do maior para o menor. */
export function porCategoria(lista) {
    const grupos = new Map();
    for (const e of lista) grupos.set(e.categoria_id, (grupos.get(e.categoria_id) || 0) + e.valor);
    return [...grupos.entries()]
        .map(([id, total]) => {
            const c = categoriaPorId(id);
            return { nome: c?.nome ?? 'Sem categoria', cor: c?.cor ?? '#94a3b8', total: arred(total) };
        })
        .sort((a, b) => b.total - a.total);
}

/** Totais por ciclo: de `antes` ciclos antes até `depois` depois do ciclo de referência (projeta parcelas e fixos). */
export function evolucao(ref, antes, depois = 0) {
    const C = ciclos.value;
    const lista = C.janela(ref, antes, depois);
    const todos = eventos(lista[0].inicio, lista[lista.length - 1].fim);
    const porCiclo = new Map();
    for (const e of todos) {
        const k = C.cicloDaData(e.data).chave;
        if (!porCiclo.has(k)) porCiclo.set(k, []);
        porCiclo.get(k).push(e);
    }
    const saida = { labels: [], chaves: [], parcelas: [], fixos: [], avulsos: [], totais: [] };
    for (const c of lista) {
        const t = totais(porCiclo.get(c.chave) || []);
        saida.labels.push(c.rotulo);
        saida.chaves.push(c.chave);
        saida.parcelas.push(t.parcelas);
        saida.fixos.push(t.fixos);
        saida.avulsos.push(t.avulsos);
        saida.totais.push(t.total);
    }
    return saida;
}

/** Situação de cada compra parcelada ao final do período (pagas x restantes). */
export function saldoParcelas(p) {
    const ref = p.ciclo || ciclos.value.cicloDaData(p.fim);
    const itens = [];
    for (const parcela of estado.parcelas) {
        const pagas = pagasAteCiclo(parcela, ref);
        if (pagas === null || pagas >= parcela.total_parcelas) continue; // ainda não começou ou já quitada
        itens.push({
            id: parcela.id,
            descricao: parcela.descricao,
            pagas,
            total: parcela.total_parcelas,
            restante_valor: arred((parcela.total_parcelas - pagas) * Number(parcela.valor_parcela)),
            cor: categoriaPorId(parcela.categoria_id)?.cor ?? '#6366f1',
        });
    }
    itens.sort((a, b) => b.restante_valor - a.restante_valor);
    return { itens, total_restante: arred(itens.reduce((s, i) => s + i.restante_valor, 0)) };
}

/** Variação do total em relação ao período anterior. */
export function comparacao(totalAtual, p) {
    const ant = periodoAnterior(p);
    const totalAnterior = totais(eventosDoPeriodo(ant)).total;
    const diferenca = arred(totalAtual - totalAnterior);
    return {
        rotulo_anterior: ant.rotulo,
        total_anterior: totalAnterior,
        diferenca,
        percentual: totalAnterior > 0 ? Math.round((diferenca / totalAnterior) * 1000) / 10 : null,
    };
}

/** Início do próximo ciclo e o que já está previsto (parcelas + fixos). */
export function proximoVencimento() {
    const proximo = ciclos.value.proximo(ciclos.value.cicloAtual());
    const t = totais(eventos(proximo.inicio, proximo.fim, ['parcela', 'fixo']));
    return { data: proximo.inicio, ciclo: proximo.rotulo, valor: t.total };
}

/** Dados para o componente de filtro de período. */
export function paraFiltro(p) {
    const C = ciclos.value;
    const atual = C.cicloAtual();
    const ref = p.ciclo || C.cicloDaData(p.fim);
    let lista = C.janela(atual, 24, 12);
    if (!lista.some((c) => c.chave === ref.chave)) lista = C.janela(ref, 12, 12);
    return {
        tipo: p.ciclo ? 'ciclo' : 'livre',
        ciclo: ref.chave,
        rotulo: p.rotulo,
        inicio: p.inicio,
        fim: p.fim,
        anterior: C.anterior(ref).chave,
        proximo: C.proximo(ref).chave,
        atual: atual.chave,
        ciclos: lista,
    };
}
