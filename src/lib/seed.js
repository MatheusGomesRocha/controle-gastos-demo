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
    const config = { dia_vencimento: 23, limite_avulsos: 3000 };
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

    // Gastos avulsos: gerados de forma determinística (sempre os mesmos valores) pelos últimos ~110 dias,
    // com descrições que se repetem para alimentar o gráfico "Contas que mais se repetem".
    // [descrição, categoria, valor mínimo, valor máximo, peso (frequência relativa)]
    const modelos = [
        ['Mercado da semana', 2, 120, 230, 4],
        ['Padaria', 2, 8, 32, 7],
        ['Lanche', 2, 15, 45, 5],
        ['Pizza com amigos', 2, 60, 110, 2],
        ['Pix Pizzaria', 2, 50, 90, 2],
        ['Almoço no restaurante', 2, 30, 62, 4],
        ['Café com leite', 2, 8, 20, 6],
        ['Sorvete', 2, 10, 25, 1],
        ['Combustível', 3, 150, 200, 2],
        ['Aplicativo de transporte', 3, 15, 42, 5],
        ['Estacionamento', 3, 10, 30, 3],
        ['Farmácia', 5, 30, 95, 3],
        ['Cinema', 4, 40, 70, 3],
        ['Show', 4, 120, 200, 1],
        ['Livro', 4, 40, 90, 1],
        ['Presente', 7, 60, 150, 1],
        ['Roupa', 7, 90, 200, 1],
        ['Lavanderia', 7, 25, 60, 1],
        ['Barbearia', 7, 35, 60, 1],
    ];
    const sorteio = [];
    modelos.forEach((m, i) => { for (let k = 0; k < m[4]; k++) sorteio.push(i); });
    const formas = ['credito', 'debito', 'pix', 'dinheiro', 'credito', 'debito'];
    let semente = 20261123; // gerador simples e determinístico
    const aleatorio = () => {
        semente = (semente * 1664525 + 1013904223) % 4294967296;
        return semente / 4294967296;
    };
    const avulsos = [];
    for (let atras = 110; atras >= 0; atras--) {
        const r = aleatorio();
        const quantos = r < 0.15 ? 0 : r < 0.55 ? 1 : r < 0.9 ? 2 : 3;
        for (let q = 0; q < quantos; q++) {
            const [descricao, categoria_id, min, max] = modelos[sorteio[Math.floor(aleatorio() * sorteio.length)]];
            avulsos.push({
                id: id++,
                descricao,
                categoria_id,
                data: somarDias(hojeISO, -atras),
                forma_pagamento: formas[Math.floor(aleatorio() * formas.length)],
                valor: Math.round((min + (max - min) * aleatorio()) * 100) / 100,
                observacao: '',
            });
        }
    }

    return { config, categorias: categoriasPadrao(), parcelas, fixos, avulsos, prox_id: id };
}
