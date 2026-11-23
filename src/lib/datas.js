// Datas como texto "AAAA-MM-DD" (sem fuso), para evitar bugs de horário de verão/UTC.

const p2 = (n) => String(n).padStart(2, '0');

export const montar = (a, m, d) => `${a}-${p2(m)}-${p2(d)}`;
export const partes = (iso) => {
    const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
    return { a, m, d };
};

export const diasNoMes = (a, m) => new Date(Date.UTC(a, m, 0)).getUTCDate();

export const hoje = () => {
    const d = new Date();
    return montar(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

const utc = (iso) => {
    const { a, m, d } = partes(iso);
    return Date.UTC(a, m - 1, d);
};
const deUtc = (ms) => {
    const d = new Date(ms);
    return montar(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
};

export const somarDias = (iso, n) => deUtc(utc(iso) + n * 86400000);
export const diferencaDias = (de, ate) => Math.round((utc(ate) - utc(de)) / 86400000);

/** Soma meses sem estourar o mês (31/01 + 1 mês = 28/02). */
export const somarMeses = (iso, n) => {
    const { a, m, d } = partes(iso);
    const idx = a * 12 + (m - 1) + n;
    const na = Math.floor(idx / 12);
    const nm = (idx % 12) + 1;
    return montar(na, nm, Math.min(d, diasNoMes(na, nm)));
};

export const entre = (iso, ini, fim) => iso >= ini && iso <= fim;
