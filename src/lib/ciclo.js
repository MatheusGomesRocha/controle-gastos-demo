// Port do CicloService do sistema original (PHP): ÚNICO lugar que sabe calcular ciclos.
//
// Regras:
// - O ciclo vai do dia de vencimento até o dia anterior ao vencimento do mês seguinte.
// - O ciclo é identificado pelo mês em que TERMINA.
//   Ex. (dia 23): ciclo "Dez/2026" = 23/11/2026 a 22/12/2026.
// - Se o mês não tem o dia escolhido (ex.: 31 em fevereiro), usa o último dia do mês.
import { diasNoMes, hoje, montar, partes, somarDias } from './datas';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function criarCiclos(diaVencimento) {
    const dia = Math.min(31, Math.max(1, Number(diaVencimento) || 23));

    const vencimentoDoMes = (ano, mes) => montar(ano, mes, Math.min(dia, diasNoMes(ano, mes)));

    const deslocarMes = (ano, mes, n) => {
        const idx = ano * 12 + (mes - 1) + n;
        return { ano: Math.floor(idx / 12), mes: (idx % 12) + 1 };
    };

    const ciclo = (ano, mes) => {
        const ant = deslocarMes(ano, mes, -1);
        const inicio = vencimentoDoMes(ant.ano, ant.mes);
        const fim = somarDias(vencimentoDoMes(ano, mes), -1);
        const chave = `${ano}-${String(mes).padStart(2, '0')}`;
        return { ano, mes, inicio, fim, chave, rotulo: `${MESES[mes - 1]}/${ano}` };
    };

    const cicloDaData = (iso) => {
        const { a, m } = partes(iso);
        // A partir do vencimento do próprio mês, já pertence ao ciclo que termina no mês seguinte.
        if (iso >= vencimentoDoMes(a, m)) {
            const prox = deslocarMes(a, m, 1);
            return ciclo(prox.ano, prox.mes);
        }
        return ciclo(a, m);
    };

    const deslocar = (c, n) => {
        const alvo = deslocarMes(c.ano, c.mes, n);
        return ciclo(alvo.ano, alvo.mes);
    };

    const cicloDaChave = (chave) => {
        const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(chave || '');
        return m ? ciclo(Number(m[1]), Number(m[2])) : null;
    };

    return {
        dia,
        vencimentoDoMes,
        ciclo,
        cicloDaData,
        cicloDaChave,
        cicloAtual: () => cicloDaData(hoje()),
        anterior: (c) => deslocar(c, -1),
        proximo: (c) => deslocar(c, 1),
        deslocar,
        diferenca: (de, ate) => (ate.ano - de.ano) * 12 + (ate.mes - de.mes),
        janela(central, antes = 12, depois = 3) {
            const lista = [];
            for (let i = -antes; i <= depois; i++) lista.push(deslocar(central, i));
            return lista;
        },
    };
}
