# Controle de Gastos — versão de demonstração

Dashboard de controle de gastos pessoais feito com **Vue 3**, para mostrar o projeto sem precisar de servidor nem banco de dados.
Todos os dados ficam no **`localStorage`** do navegador, e os valores que aparecem são fictícios.

> O sistema completo, de uso pessoal, roda em **Laravel + MySQL + Inertia.js**. Esta versão reaproveita a interface e reescreve as regras de negócio em JavaScript.

## O que o sistema faz

- **Ciclo financeiro configurável**: o "mês" não começa no dia 1. Ele vai do dia de vencimento (padrão 23) até o dia anterior do mês seguinte, e todas as telas têm filtro por ciclo ou intervalo livre.
- **Parcelas**: cada compra parcelada é um único registro. A parcela avança sozinha a cada ciclo (com recuperação de ciclos pendentes e sem duplicar), mostra o saldo restante e vira "quitada" ao fim.
- **Gastos fixos**: recorrentes por vigência, cobrados no dia escolhido de cada ciclo.
- **Gastos avulsos**: busca, filtro por categoria, acréscimo automático no Pix (configurável) e limite de gastos por ciclo com barra de uso.
- **Dashboard**: cards de resumo e gráficos (por dia, categoria, tipo, evolução por ciclo, comparação com o período anterior, saldo das parcelas, peso dos fixos).

## Tecnologias

Vue 3 (Composition API, `<script setup>`), Vite, Vue Router (hash), Tailwind CSS, Chart.js (`vue-chartjs`) e Lucide.

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera a pasta dist/
```

## Publicação

O workflow em `.github/workflows/deploy.yml` publica no **GitHub Pages** a cada push na branch `main`
(em *Settings → Pages*, escolha *Source: GitHub Actions*).

## Estrutura

```
src/lib/ciclo.js      cálculo de ciclos (CicloService do original)
src/lib/relatorio.js  eventos, totais e agrupamentos (RelatorioService)
src/lib/store.js      "banco" em localStorage + regras de parcelas e Pix
src/lib/seed.js       dados fictícios de exemplo
src/pages/            Dashboard, Parcelas, Gastos fixos, Gastos avulsos, Configurações
```
