// Port do AgrupadorDescricao do sistema original (PHP).
// Agrupa gastos avulsos pela "palavra-chave" da descrição (ex.: "Pix Pizza" e "Pizza do Zé" => Pizza).
//  - palavras sem significado (pix, compra, de, da, ted, ltda...) e números são ignoradas;
//  - cada gasto conta UMA vez só, na PRIMEIRA palavra com significado;
//  - acentos, maiúsculas e plural simples não separam grupos (pizza = Pizza = pizzas).

const IGNORAR = new Set([
    // formas de pagamento / jargão bancário
    'pix', 'ted', 'doc', 'tef', 'boleto', 'debito', 'credito', 'cartao', 'dinheiro', 'fatura', 'parcela',
    'pagamento', 'pagto', 'pgto', 'pag', 'pagar', 'paguei', 'compra', 'comprei', 'compras', 'transferencia',
    'transf', 'enviado', 'enviada', 'recebido', 'recebida', 'envio', 'saque', 'via', 'ref', 'referente',
    'gasto', 'gastos', 'conta', 'valor', 'total', 'pedido', 'online', 'app', 'pos', 'mp', 'pagseguro',
    'mercadopago', 'picpay', 'nubank', 'itau', 'bradesco', 'inter', 'caixa',
    // empresa
    'ltda', 'eireli', 'epp', 'sa', 'cia', 'com', 'comercio', 'comercial', 'servicos', 'loja', 'lojas',
    // ligações
    'de', 'da', 'do', 'das', 'dos', 'para', 'pra', 'pro', 'por', 'sem', 'em', 'no', 'na', 'nos', 'nas',
    'um', 'uma', 'uns', 'umas', 'ao', 'aos', 'as', 'os', 'ou', 'que', 'mais', 'meu', 'minha', 'the', 'and',
    'hoje', 'ontem', 'mes', 'dia',
]);

/** minúsculas, sem acento e com plural simples removido (pizzas => pizza). */
const normalizar = (palavra) => {
    const p = palavra.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    return p.length > 4 && p.endsWith('s') && !p.endsWith('ss') ? p.slice(0, -1) : p;
};

const ucfirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** [chave sem acento, rótulo para exibir] da primeira palavra com significado, ou null. */
export function palavraChave(descricao) {
    for (const palavra of String(descricao).split(/[^\p{L}]+/u).filter(Boolean)) {
        const chave = normalizar(palavra);
        if (chave.length < 3 || IGNORAR.has(chave)) continue;
        return [chave, ucfirst(palavra.toLowerCase())];
    }
    return null;
}

/** @returns {{nome:string, quantidade:number, total:number}[]} mais repetidos primeiro */
export function agrupar(gastos, minimo = 2, limite = 10) {
    const grupos = new Map();
    for (const g of gastos) {
        const pk = palavraChave(g.descricao);
        if (!pk) continue;
        const [chave, rotulo] = pk;
        if (!grupos.has(chave)) grupos.set(chave, { rotulos: new Map(), quantidade: 0, total: 0 });
        const gr = grupos.get(chave);
        gr.quantidade++;
        gr.total += Number(g.valor);
        gr.rotulos.set(rotulo, (gr.rotulos.get(rotulo) || 0) + 1);
    }
    return [...grupos.values()]
        .filter((g) => g.quantidade >= minimo)
        .map((g) => ({
            nome: [...g.rotulos.entries()].sort((a, b) => b[1] - a[1])[0][0], // grafia mais usada
            quantidade: g.quantidade,
            total: Math.round(g.total * 100) / 100,
        }))
        .sort((a, b) => b.quantidade - a.quantidade || b.total - a.total)
        .slice(0, limite);
}
