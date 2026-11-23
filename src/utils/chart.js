import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from 'chart.js';
import { formatarCompacto, formatarMoeda } from '@/utils/format';

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip);

ChartJS.defaults.font.family = 'Figtree, ui-sans-serif, system-ui, sans-serif';
ChartJS.defaults.color = '#64748b';
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.boxWidth = 8;

/** Opções comuns para eixos com valores em R$. */
export function opcoesEixos({ empilhado = false, horizontal = false, legenda = true } = {}) {
    const eixoValor = {
        beginAtZero: true,
        stacked: empilhado,
        grid: { color: '#f1f5f9' },
        border: { display: false },
        ticks: { callback: (v) => `R$ ${formatarCompacto(v)}` },
    };
    const eixoCategoria = { stacked: empilhado, grid: { display: false }, border: { display: false } };

    return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: legenda, position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const v = horizontal ? ctx.parsed.x : ctx.parsed.y;
                        return ` ${ctx.dataset.label}: ${formatarMoeda(v)}`;
                    },
                },
            },
        },
        scales: horizontal ? { x: eixoValor, y: eixoCategoria } : { x: eixoCategoria, y: eixoValor },
    };
}
