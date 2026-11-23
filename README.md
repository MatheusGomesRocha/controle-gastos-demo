# Controle de Gastos — versão de demonstração

Dashboard de controle de gastos pessoais. Esta é a **versão vitrine**: roda só no navegador (Vue 3), sem servidor e sem banco de dados, para que qualquer pessoa possa abrir e testar.

**[▶ Abrir a demo online](https://matheusgomesrocha.github.io/controle-gastos-demo/)** · **[Ver o sistema completo (Laravel + MySQL)](https://github.com/MatheusGomesRocha/controle-gastos)**

> Todos os valores são fictícios e ficam no `localStorage` do seu navegador. Dá para cadastrar, editar e apagar à vontade; em *Configurações* há um botão para restaurar os dados de exemplo.

---

## Por que este projeto existe

Eu precisava de um controle de gastos que respeitasse a forma como meu dinheiro realmente funciona, e as planilhas e apps que testei não respeitavam:

- Meu "mês" **não começa no dia 1**. Ele começa no dia do vencimento do cartão (padrão: dia 23) e vai até o dia anterior do mês seguinte.
- Compras **parceladas** precisam avançar sozinhas (5/12 → 6/12) a cada ciclo, e sumir dos totais quando acabam.
- Gastos **fixos** (assinaturas, aluguel) se repetem todo ciclo; **avulsos** acontecem uma vez.
- Quero ver para onde o dinheiro vai: por dia, por categoria, por tipo, e comparar com o ciclo anterior.

O sistema completo, que uso no dia a dia, é feito em **Laravel + MySQL**. Como ele guarda dados reais, criei esta versão separada, só com dados fictícios, para mostrar o resultado.

## O que dá para ver na demo

| Tela | O que mostra |
|---|---|
| **Dashboard** | Cards de resumo do período, gastos por dia (empilhado por tipo), por categoria, por tipo, evolução dos últimos ciclos e comparação com o ciclo anterior, com variação em R$ e %. |
| **Parcelas** | Cada compra parcelada em **um único registro**, com barra de progresso, saldo restante, próxima cobrança e selo Ativa/Quitada. |
| **Gastos fixos** | Recorrentes por vigência (início e fim), com dia de cobrança próprio. |
| **Gastos avulsos** | Busca, filtro por categoria, **limite de gastos por ciclo** com barra de uso e gráfico das **contas que mais se repetem**. |
| **Configurações** | Dia de vencimento (com prévia do ciclo atual) e categorias. |

Todas as telas têm filtro por **ciclo** (com setas para navegar) ou por **intervalo livre de datas**, e as listas têm paginação.

---

## Como o projeto foi construído

Fui por etapas pequenas, sempre deixando algo funcionando e testável ao fim de cada uma. A ordem foi pensada para que o que é mais arriscado (as regras de data) ficasse pronto e testado **antes** de existir qualquer tela.

1. **Modelagem das regras no papel.** Antes de código, escrevi as regras de negócio: o que é um ciclo, como uma parcela avança, em qual dia cada tipo de gasto "cai". Isso virou a fonte de verdade do projeto.
2. **Calculadora de ciclos.** Um único módulo que sabe tudo sobre ciclos: ciclo de uma data, início e fim, anterior e próximo, e os casos chatos (virada de ano, mês sem o dia escolhido, como 31 em fevereiro).
3. **Cadastros.** Categorias, gastos avulsos, fixos e parcelas, cada um com listagem, formulário em modal e validação.
4. **Parcelas que avançam sozinhas.** A regra mais delicada, detalhada abaixo.
5. **Relatórios e dashboard.** Todos os totais e gráficos saem de uma mesma fonte, para que os números nunca divirjam entre telas.
6. **Polimento.** Estados vazios, responsividade, limite de gastos e paginação (a exportação para Excel e PDF existe só no sistema completo).
7. **Versão vitrine.** Reescrevi a camada de dados para rodar sem servidor (esta demo).

### Decisões que mais importaram

**Tudo vira "evento".** Em vez de cada tela calcular seus totais, existe um único relatório que transforma parcelas, fixos e avulsos em uma lista de eventos `{data, tipo, categoria, valor}`. Totais, gráfico por dia, por categoria, por tipo, evolução e comparação são só agrupamentos dessa lista. Resultado: ciclo e intervalo livre usam exatamente a mesma conta, e não há como o Dashboard mostrar um número diferente da tela de Parcelas.

**Parcela é um registro só, e o histórico é calculado.** Em vez de criar uma linha por parcela, guardo em que ciclo a compra foi cadastrada e com qual parcela. Para qualquer ciclo, inclusive passado:

```
numero = parcela_inicial + (ciclos entre o cadastro e o ciclo consultado)
conta no ciclo se parcela_inicial <= numero <= total_parcelas
```

Isso permite abrir um ciclo antigo e ver exatamente o que estava sendo pago naquela época.

**O avanço é idempotente e se recupera sozinho.** Cada parcela guarda o último ciclo processado. Se o sistema ficou dias sem rodar, ao voltar ele aplica todos os ciclos pendentes, sem pular nem duplicar, e rodar duas vezes no mesmo ciclo não muda nada. Na versão Laravel isso roda por agendamento diário e também ao abrir as telas, como segurança.

**Ciclo identificado pelo mês em que termina.** "Dez/2026" é de 23/11 a 22/12. Escolhi um critério único e o apliquei em todo o sistema.

**Dinheiro sem erro de ponto flutuante.** Valores são arredondados em centavos antes de somar, e exibidos sempre em BRL.

### Do Laravel para o Vue

A demo reaproveita a interface e **reescreve em JavaScript as mesmas regras de negócio** do backend, no mesmo desenho:

| Sistema completo (Laravel) | Esta demo (Vue) |
|---|---|
| `CicloService` | `src/lib/ciclo.js` |
| `RelatorioService` | `src/lib/relatorio.js` |
| `ParcelaService` | regras de parcelas em `src/lib/store.js` |
| `AgrupadorDescricao` | `src/lib/agrupador.js` |
| MySQL + Eloquent | `localStorage` (`src/lib/store.js`) |
| Seeder | dados fictícios determinísticos (`src/lib/seed.js`) |
| Páginas Inertia | páginas Vue em `src/pages/` |

Como os dados de exemplo são gerados por uma semente fixa, a demo sempre abre com o mesmo conteúdo, e os gráficos já aparecem preenchidos.

---

## Tecnologias

Vue 3 (Composition API, `<script setup>`), Vite, Vue Router (modo hash, para funcionar no GitHub Pages), Tailwind CSS, Chart.js com `vue-chartjs` e ícones Lucide. Sem backend.

## Como rodar localmente

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # gera a pasta dist/
```

## Publicação

O workflow em `.github/workflows/deploy.yml` publica no GitHub Pages. Esta demo está servida pela branch `gh-pages`.

## Estrutura

```
src/lib/ciclo.js        cálculo de ciclos
src/lib/relatorio.js    eventos, totais e agrupamentos
src/lib/store.js        "banco" em localStorage + regras de parcelas
src/lib/agrupador.js    agrupa descrições repetidas (contas que mais se repetem)
src/lib/seed.js         dados fictícios de exemplo
src/pages/              Dashboard, Parcelas, Gastos fixos, Gastos avulsos, Configurações
src/components/         modais, filtro de período, cards, gráficos, paginação
```

## Sobre o desenvolvimento

Projeto pessoal, desenvolvido por mim (Matheus Rocha) com apoio de ferramentas de IA para acelerar a escrita de código. As regras de negócio, as decisões de arquitetura e a revisão final são minhas.
