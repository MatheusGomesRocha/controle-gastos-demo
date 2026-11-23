// Formatadores usados em todas as telas.
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** 1234.5 -> "R$ 1.234,50" */
export const formatarMoeda = (valor) => brl.format(Number(valor ?? 0));

/** 1234 -> "1,2 mil" (para eixos de gráficos) */
export const formatarCompacto = (valor) => compacto.format(Number(valor ?? 0));

/** "2026-11-23" -> "23/11/2026" */
export const formatarData = (iso) => {
    if (!iso) return '';
    const [a, m, d] = String(iso).slice(0, 10).split('-');
    return `${d}/${m}/${a}`;
};

/** "2026-11-23" -> "23/11" */
export const formatarDiaMes = (iso) => formatarData(iso).slice(0, 5);

/** Data de hoje (fuso do navegador) no formato AAAA-MM-DD, para campos de data. */
export const hojeISO = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
};

/** 12.34 -> "12,3%" */
export const formatarPercentual = (valor) =>
    `${Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/** Cores por tipo de gasto (usadas em todos os gráficos). */
export const CORES_TIPO = {
    parcela: '#6366f1', // índigo
    fixo: '#0ea5e9', // azul-céu
    avulso: '#f59e0b', // âmbar
};
