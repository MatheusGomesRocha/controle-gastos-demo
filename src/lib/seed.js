// Dados FICTÍCIOS de exemplo, gerados em relação à data de hoje para a demonstração sempre parecer "viva".
import { criarCiclos } from './ciclo';
import { hoje, somarDias, somarMeses } from './datas';

export const categoriasPadrao = () => [
    { id: 1, nome: 'Moradia', cor: '#4f46e5' },
    { id: 2, nome: 'Alimentação', cor: '#f59e0b' },
    { id: 3, nome: 'Transporte', cor: '#0ea5e9' },
    { id: 4, nome: 'Lazer', cor: '#ec4899' },
    { id: 5, nome: 'Saúde', cor: '#10b981' },
    { id: 6, nome: 'Assinaturas', cor: '#8b5cf6' },
    { id: 7, nome: 'Outros', cor: '#94a3b8' },
];

export function gerarDadosExemplo() {
    const config = { dia_vencimento: 23, juros_pix: 5, limite_avulsos: 1800 };
    const c = criarCiclos(config.dia_vencimento);
    const atual = c.cicloAtual();
    const hojeISO = hoje();
    let id = 1;

    // Parcelas: [descrição, categoria, valor, total, ciclos atrás em que foi cadastrada (parcela 1)]
    const compras = [
        ['Notebook', 7, 389.9, 12, 4],
        ['Geladeira', 1, 245.0, 10, 6],
        ['Tênis de corrida', 4, 129.9, 4, 1],
        ['Curso online', 7, 99.0, 6, 8],
        ['Sofá', 1, 310.0, 8, 2],
    ];
    const parcelas = compras.map(([descricao, categoria_id, valor_parcela, total, atras]) => {
        const inicial = c.deslocar(atual, -atras);
        const numero = 1 + atras;
        const vencida = numero > total;
        return {
            id: id++,
            descricao,
            categoria_id,
            valor_parcela,
            total_parcelas: total,
            parcela_atual: Math.min(numero, total),
            ciclo_inicial: inicial.chave,
            parcela_inicial: 1,
            ultimo_ciclo_processado: atual.chave,
            status: vencida ? 'vencida' : 'ativa',
            observacao: '',
        };
    });

    // Gastos fixos: [descrição, categoria, valor, dia de cobrança (null = dia de vencimento)]
    const inicioFixos = somarMeses(hojeISO, -9);
    const fixosBase = [
        ['Aluguel', 1, 1200.0, 5],
        ['Internet', 1, 99.9, 10],
        ['Academia', 5, 119.9, 15],
        ['Streaming de vídeo', 6, 55.9, 20],
        ['Plano de celular', 6, 49.9, null],
        ['Seguro do carro', 3, 142.5, 28],
    ];
    const fixos = fixosBase.map(([descricao, categoria_id, valor, dia_cobranca]) => ({
        id: id++,
        descricao,
        categoria_id,
        valor,
        dia_cobranca,
        data_inicio: inicioFixos,
        data_fim: null,
        ativo: true,
    }));

    // Gastos avulsos: [dias atrás, descrição, categoria, valor digitado, forma de pagamento]
    const avulsosBase = [
        [0, 'Almoço no restaurante', 2, 38.9, 'credito'],
        [1, 'Mercado da semana', 2, 214.35, 'debito'],
        [2, 'Combustível', 3, 180.0, 'credito'],
        [3, 'Cinema', 4, 56.0, 'pix'],
        [4, 'Farmácia', 5, 47.8, 'debito'],
        [5, 'Padaria', 2, 18.5, 'dinheiro'],
        [7, 'Aplicativo de transporte', 3, 24.9, 'credito'],
        [8, 'Pizza com amigos', 2, 92.0, 'pix'],
        [10, 'Presente de aniversário', 7, 120.0, 'credito'],
        [12, 'Mercado da semana', 2, 189.7, 'debito'],
        [14, 'Combustível', 3, 175.0, 'credito'],
        [15, 'Show', 4, 160.0, 'pix'],
        [17, 'Lanche', 2, 29.9, 'credito'],
        [19, 'Consulta de rotina', 5, 150.0, 'pix'],
        [21, 'Mercado da semana', 2, 203.1, 'debito'],
        [23, 'Estacionamento', 3, 22.0, 'dinheiro'],
        [26, 'Livro', 4, 64.9, 'credito'],
        [29, 'Almoço no restaurante', 2, 41.0, 'credito'],
        [32, 'Mercado da semana', 2, 221.4, 'debito'],
        [35, 'Combustível', 3, 170.0, 'credito'],
        [38, 'Roupa', 7, 139.9, 'credito'],
        [41, 'Cinema', 4, 52.0, 'pix'],
        [44, 'Farmácia', 5, 63.2, 'debito'],
        [48, 'Mercado da semana', 2, 198.8, 'debito'],
        [52, 'Aplicativo de transporte', 3, 31.5, 'credito'],
        [56, 'Pizza com amigos', 2, 85.0, 'pix'],
        [60, 'Combustível', 3, 165.0, 'credito'],
        [66, 'Mercado da semana', 2, 207.0, 'debito'],
        [72, 'Show', 4, 140.0, 'pix'],
        [80, 'Presente', 7, 95.0, 'credito'],
    ];
    const avulsos = avulsosBase.map(([atras, descricao, categoria_id, digitado, forma_pagamento]) => {
        const juros = forma_pagamento === 'pix' ? config.juros_pix : 0;
        return {
            id: id++,
            descricao,
            categoria_id,
            data: somarDias(hojeISO, -atras),
            forma_pagamento,
            valor_original: digitado,
            juros_percentual: juros,
            valor: Math.round(digitado * (1 + juros / 100) * 100) / 100,
            observacao: '',
        };
    });

    return { config, categorias: categoriasPadrao(), parcelas, fixos, avulsos, prox_id: id };
}
