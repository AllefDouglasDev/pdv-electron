# 06 - Relatorios

Tela de visualizacao de vendas e fechamento de caixa.

## Visao Geral

Esta tela permite visualizar todas as vendas realizadas no periodo atual (dia), calcular lucros e realizar o fechamento de caixa. O fechamento limpa os registros de vendas apos a consulta dos relatorios.

**Permissao**: Admin, Gerente

---

## Layout da Tela

### Estrutura Principal

```
+====================================================================+
| [<- Voltar]               Relatorios de Vendas                     |
+====================================================================+
| [Data/Hora: 10/12/2025 18:45:32]                                   |
+====================================================================+
|                                                                    |
|  [Carregar Vendas]                              [Fechar Caixa]     |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | Produto        | Custo    | Qtd | Venda    | Lucro   | Hora  |  |
|  +--------------------------------------------------------------+  |
|  | Refrigerante   | R$ 5,50  |  5  | R$ 7,70  | R$ 11,00| 14:35 |  |
|  | Biscoito       | R$ 3,00  | 10  | R$ 4,50  | R$ 15,00| 14:35 |  |
|  | Sabao em Po    | R$ 9,60  |  2  | R$ 12,00 | R$ 4,80 | 15:20 |  |
|  | Arroz 5kg      | R$ 23,00 |  3  | R$ 28,00 | R$ 15,00| 16:45 |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | RESUMO DO DIA                                                |  |
|  +--------------------------------------------------------------+  |
|  | Total Investido (Custo):              R$ 128,50              |  |
|  | Total de Vendas:                      R$ 174,80              |  |
|  | LUCRO TOTAL:                          R$ 46,30               |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
+====================================================================+
```

---

## Componentes da Tela

### Cabecalho

| Componente | Descricao |
|------------|-----------|
| Botao Voltar | Retorna a tela principal |
| Relogio | Data e hora em tempo real |

### Area de Acoes

| Componente | Descricao |
|------------|-----------|
| Botao Carregar Vendas | Carrega vendas do periodo |
| Botao Fechar Caixa | Executa fechamento (limpa vendas) |

### Tabela de Vendas

| Coluna | Descricao |
|--------|-----------|
| Produto | Nome do produto vendido |
| Custo | Valor de compra unitario |
| Qtd | Quantidade vendida |
| Venda | Valor de venda unitario |
| Lucro | (Venda - Custo) * Quantidade |
| Hora | Horario da venda |

### Resumo do Dia

| Campo | Descricao |
|-------|-----------|
| Total Investido | Soma de (Custo * Quantidade) para todos os itens |
| Total de Vendas | Soma de (Venda * Quantidade) para todos os itens |
| Lucro Total | Total Vendas - Total Investido |

---

## Fluxos de Operacao

### Fluxo: Carregar Vendas

```
[Clicar "Carregar Vendas"]
         |
         v
[Consultar banco - tabela vendas]
         |
         v
[Tem vendas?]
    |         |
   Nao       Sim
    |         |
    v         v
[Msg:      [Para cada venda:]
 sem           |
 vendas]       v
          [Calcular lucro por item]
               |
               v
          [Preencher tabela]
               |
               v
          [Calcular totais]
               |
               v
          [Exibir resumo]
```

### Fluxo: Fechar Caixa

```
[Clicar "Fechar Caixa"]
         |
         v
[Exibir confirmacao com resumo]
         |
         v
[Confirmar?]
    |         |
   Nao       Sim
    |         |
    v         v
[Cancelar] [Limpar tabela vendas]
               |
               v
          [Limpar tabela na tela]
               |
               v
          [Zerar totais]
               |
               v
          [Exibir sucesso: "Caixa fechado!"]
```

---

## Calculos

### Lucro por Item

```
lucroPorItem = (valorVenda - valorCusto) * quantidade
```

### Exemplo:

| Produto | Custo | Venda | Qtd | Calculo | Lucro |
|---------|-------|-------|-----|---------|-------|
| Refrigerante | R$ 5,50 | R$ 7,70 | 5 | (7,70 - 5,50) * 5 | R$ 11,00 |

### Total Investido

```
totalInvestido = SOMA(valorCusto * quantidade) para todos os itens
```

### Total de Vendas

```
totalVendas = SOMA(valorVenda * quantidade) para todos os itens
```

### Lucro Total

```
lucroTotal = totalVendas - totalInvestido
```

Ou:
```
lucroTotal = SOMA(lucroPorItem) para todos os itens
```

---

## Consultas SQL

### Buscar Vendas do Dia

```sql
SELECT
    nome,
    valor_compra,
    quantidade,
    valor_venda,
    hora,
    total
FROM vendas
ORDER BY created_at ASC
```

**Nota**: O sistema atual nao filtra por data - carrega todas as vendas desde o ultimo fechamento.

### Buscar Vendas (Com Filtro de Data - Opcional)

```sql
SELECT
    nome,
    valor_compra,
    quantidade,
    valor_venda,
    hora,
    total
FROM vendas
WHERE DATE(created_at) = DATE('now')
ORDER BY created_at ASC
```

### Fechar Caixa (Limpar Vendas)

```sql
DELETE FROM vendas
```

**Atencao**: Esta operacao remove TODOS os registros da tabela vendas. Certifique-se de que o relatorio foi visualizado/exportado antes.

---

## Estrutura de Dados

### Venda (do banco)

```
Venda {
    nome: string          // Nome do produto
    valor_compra: decimal // Custo unitario
    quantidade: integer   // Quantidade vendida
    valor_venda: decimal  // Preco de venda unitario
    hora: string          // Horario (HH:mm:ss)
    total: decimal        // valor_venda * quantidade
}
```

### Item do Relatorio (calculado)

```
ItemRelatorio {
    nome: string
    custo: decimal        // valor_compra
    quantidade: integer
    venda: decimal        // valor_venda
    lucro: decimal        // (venda - custo) * quantidade
    hora: string
}
```

### Resumo (calculado)

```
Resumo {
    totalInvestido: decimal
    totalVendas: decimal
    lucroTotal: decimal
}
```

---

## Fechamento de Caixa

### Proposito

O fechamento de caixa serve para:
1. Consolidar as vendas do dia
2. Limpar a tabela de vendas para o proximo periodo
3. Marcar o fim de um turno/dia de trabalho

### Dialog de Confirmacao

```
+--------------------------------------------------+
|              Confirmar Fechamento                |
+--------------------------------------------------+
|                                                  |
|  Deseja realmente fechar o caixa?                |
|                                                  |
|  Resumo do periodo:                              |
|  - Total de vendas: 15 itens                     |
|  - Valor total: R$ 174,80                        |
|  - Lucro total: R$ 46,30                         |
|                                                  |
|  ATENCAO: Os registros de vendas serao           |
|  removidos apos esta operacao.                   |
|                                                  |
|  +----------------+  +----------------------+    |
|  |   Cancelar    |  |  Confirmar Fechamento |    |
|  +----------------+  +----------------------+    |
|                                                  |
+--------------------------------------------------+
```

### Apos Fechamento

- Tabela de vendas e limpa no banco
- Tela exibe "Nenhuma venda no periodo"
- Totais zerados
- Sistema pronto para novo periodo

---

## Controle de Acesso

### Quem Pode Acessar

- **Admin**: Acesso total
- **Gerente**: Acesso total
- **Operador**: Sem acesso (botao/menu oculto)

### Verificacao

```
SE sessao.role == 'operador' ENTAO
    Exibir mensagem: "Acesso negado"
    Redirecionar para tela principal
FIM SE
```

---

## Interface do Usuario

### Estados da Tela

| Estado | Descricao |
|--------|-----------|
| Inicial | Tabela vazia, aguardando acao |
| Carregando | Buscando dados, botoes desabilitados |
| Com Dados | Tabela preenchida, resumo visivel |
| Sem Vendas | Mensagem "Nenhuma venda no periodo" |
| Fechando | Processando fechamento |

### Feedback Visual

| Situacao | Feedback |
|----------|----------|
| Vendas carregadas | Tabela preenchida, totais calculados |
| Sem vendas | Mensagem informativa |
| Caixa fechado | Toast verde "Caixa fechado com sucesso!" |
| Erro | Toast vermelho com mensagem |

### Formatacao de Valores

| Campo | Formato |
|-------|---------|
| Valores monetarios | R$ 0,00 |
| Hora | HH:mm |
| Lucro positivo | Verde |
| Lucro negativo | Vermelho (prejuizo) |

---

## Relogio em Tempo Real

### Especificacao

| Propriedade | Valor |
|-------------|-------|
| Formato | dd/MM/YYYY HH:mm:ss |
| Atualizacao | A cada segundo (1000ms) |
| Posicao | Cabecalho da tela |

### Implementacao

```javascript
setInterval(() => {
    const agora = new Date();
    const formatado = formatarDataHora(agora);
    atualizarRelogio(formatado);
}, 1000);
```

---

## Consideracoes de Negocio

### Prejuizo

Se o lucro for negativo (produto vendido abaixo do custo):
- Exibir valor em vermelho
- Pode ocorrer se desconto muito alto foi aplicado
- Importante para analise gerencial

### Vendas Zeradas

Se nao houver vendas:
- Exibir mensagem amigavel
- Desabilitar botao "Fechar Caixa"
- Evitar fechamento sem dados

### Historico (Melhoria Futura)

O sistema atual nao mantem historico de fechamentos. Melhorias futuras podem incluir:
- Tabela de historico de fechamentos
- Relatorios por periodo (semana, mes)
- Exportacao para arquivo (CSV, PDF)

---

## Atalhos de Teclado

| Tecla | Acao |
|-------|------|
| F5 | Carregar/Atualizar vendas |
| F10 | Fechar caixa (com confirmacao) |
| ESC | Voltar para tela principal |

---

## Exemplo de Relatorio

### Dados de Entrada (Vendas)

| Produto | Custo | Qtd | Venda | Hora |
|---------|-------|-----|-------|------|
| Refrigerante | R$ 5,50 | 5 | R$ 7,70 | 14:35 |
| Biscoito | R$ 3,00 | 10 | R$ 4,50 | 14:35 |
| Sabao em Po | R$ 9,60 | 2 | R$ 12,00 | 15:20 |
| Arroz 5kg | R$ 23,00 | 3 | R$ 28,00 | 16:45 |

### Calculos

| Produto | Investido | Vendido | Lucro |
|---------|-----------|---------|-------|
| Refrigerante | 5,50 * 5 = 27,50 | 7,70 * 5 = 38,50 | 11,00 |
| Biscoito | 3,00 * 10 = 30,00 | 4,50 * 10 = 45,00 | 15,00 |
| Sabao em Po | 9,60 * 2 = 19,20 | 12,00 * 2 = 24,00 | 4,80 |
| Arroz 5kg | 23,00 * 3 = 69,00 | 28,00 * 3 = 84,00 | 15,00 |

### Resumo

| Metrica | Valor |
|---------|-------|
| Total Investido | R$ 145,70 |
| Total Vendas | R$ 191,50 |
| **Lucro Total** | **R$ 45,80** |

---

## Checklist de Implementacao

### Interface
- [ ] Criar layout da tela de relatorios
- [ ] Implementar botao "Carregar Vendas"
- [ ] Implementar botao "Fechar Caixa"
- [ ] Implementar tabela de vendas
- [ ] Implementar area de resumo
- [ ] Implementar relogio em tempo real

### Funcionalidades
- [ ] Implementar consulta de vendas no banco
- [ ] Implementar calculo de lucro por item
- [ ] Implementar calculo dos totais
- [ ] Implementar exibicao do resumo
- [ ] Implementar dialog de confirmacao de fechamento
- [ ] Implementar limpeza da tabela vendas (fechamento)
- [ ] Implementar feedback de sucesso/erro

### Permissoes
- [ ] Implementar controle de acesso (Admin, Gerente)
- [ ] Ocultar menu/botao para Operador

### Extras
- [ ] Implementar formatacao de valores monetarios
- [ ] Implementar destaque visual para lucro/prejuizo
- [ ] Implementar atalhos de teclado
- [ ] Testar calculos
- [ ] Testar fechamento de caixa
- [ ] Testar permissoes
