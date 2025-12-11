# 09 - Calculos de Negocio

Formulas matematicas e regras de negocio para calculos do sistema.

## Visao Geral

Este documento detalha todas as formulas matematicas utilizadas no sistema, incluindo calculos de precos, totais, descontos, troco e lucro.

---

## 1. Preco de Venda

### Formula

```
precoVenda = valorCompra + (valorCompra * margemLucro / 100)
```

Ou equivalente:
```
precoVenda = valorCompra * (1 + margemLucro / 100)
```

### Variaveis

| Variavel | Tipo | Descricao |
|----------|------|-----------|
| valorCompra | decimal | Preco de custo do produto |
| margemLucro | inteiro | Percentual de lucro desejado |
| precoVenda | decimal | Preco final de venda |

### Exemplos

| Valor Compra | Margem | Calculo | Preco Venda |
|--------------|--------|---------|-------------|
| R$ 10,00 | 50% | 10 + (10 * 50 / 100) | R$ 15,00 |
| R$ 100,00 | 30% | 100 + (100 * 30 / 100) | R$ 130,00 |
| R$ 5,50 | 100% | 5,50 + (5,50 * 100 / 100) | R$ 11,00 |
| R$ 23,00 | 20% | 23 + (23 * 20 / 100) | R$ 27,60 |
| R$ 8,99 | 45% | 8,99 + (8,99 * 45 / 100) | R$ 13,04 |

### Implementacao

```javascript
function calcularPrecoVenda(valorCompra, margemLucro) {
    if (valorCompra <= 0) {
        throw new Error('Valor de compra deve ser positivo');
    }
    if (margemLucro < 0) {
        throw new Error('Margem de lucro nao pode ser negativa');
    }

    const preco = valorCompra * (1 + margemLucro / 100);
    return arredondar(preco, 2);
}

function arredondar(valor, casas) {
    const fator = Math.pow(10, casas);
    return Math.round(valor * fator) / fator;
}
```

### Quando Calcular

- Ao cadastrar novo produto
- Ao alterar valor de compra de produto existente
- Ao alterar margem de lucro de produto existente

---

## 2. Subtotal de Item

### Formula

```
subtotal = precoVenda * quantidade
```

### Variaveis

| Variavel | Tipo | Descricao |
|----------|------|-----------|
| precoVenda | decimal | Preco unitario de venda |
| quantidade | inteiro | Quantidade do item |
| subtotal | decimal | Valor total do item |

### Exemplos

| Preco Unitario | Quantidade | Subtotal |
|----------------|------------|----------|
| R$ 7,70 | 5 | R$ 38,50 |
| R$ 4,50 | 10 | R$ 45,00 |
| R$ 12,00 | 2 | R$ 24,00 |

### Implementacao

```javascript
function calcularSubtotal(precoVenda, quantidade) {
    if (precoVenda <= 0 || quantidade <= 0) {
        return 0;
    }
    return arredondar(precoVenda * quantidade, 2);
}
```

---

## 3. Total da Venda

### Formula

```
totalVenda = SUM(subtotal[i]) para todos os itens
```

Ou expandido:
```
totalVenda = SUM(precoVenda[i] * quantidade[i])
```

### Variaveis

| Variavel | Tipo | Descricao |
|----------|------|-----------|
| itens | array | Lista de itens no carrinho |
| subtotal | decimal | Subtotal de cada item |
| totalVenda | decimal | Soma de todos os subtotais |

### Exemplo

| Item | Subtotal |
|------|----------|
| Refrigerante (5x R$ 7,70) | R$ 38,50 |
| Biscoito (10x R$ 4,50) | R$ 45,00 |
| Sabao (2x R$ 12,00) | R$ 24,00 |
| **TOTAL** | **R$ 107,50** |

### Implementacao

```javascript
function calcularTotalVenda(itens) {
    if (!itens || itens.length === 0) {
        return 0;
    }

    const total = itens.reduce((soma, item) => {
        const subtotal = item.precoVenda * item.quantidade;
        return soma + subtotal;
    }, 0);

    return arredondar(total, 2);
}
```

---

## 4. Calculo de Troco

### Formula

```
troco = valorPago - totalVenda
```

### Variaveis

| Variavel | Tipo | Descricao |
|----------|------|-----------|
| valorPago | decimal | Valor entregue pelo cliente |
| totalVenda | decimal | Total da compra |
| troco | decimal | Valor a devolver |

### Exemplos

| Total | Valor Pago | Troco |
|-------|------------|-------|
| R$ 47,50 | R$ 50,00 | R$ 2,50 |
| R$ 31,90 | R$ 32,00 | R$ 0,10 |
| R$ 100,00 | R$ 100,00 | R$ 0,00 |

### Validacao

```javascript
function calcularTroco(valorPago, totalVenda) {
    if (valorPago < totalVenda) {
        throw new Error('Valor pago insuficiente');
    }

    return arredondar(valorPago - totalVenda, 2);
}
```

---

## 5. Desconto Percentual

### Formula

Para cada item:
```
novoPreco = precoAtual - (precoAtual * percentualDesconto / 100)
```

Ou equivalente:
```
novoPreco = precoAtual * (1 - percentualDesconto / 100)
```

### Variaveis

| Variavel | Tipo | Descricao |
|----------|------|-----------|
| precoAtual | decimal | Preco atual do item |
| percentualDesconto | inteiro | Percentual de desconto (0-100) |
| novoPreco | decimal | Preco apos desconto |

### Exemplos

| Preco Original | Desconto | Calculo | Preco Final |
|----------------|----------|---------|-------------|
| R$ 10,00 | 10% | 10 * (1 - 10/100) | R$ 9,00 |
| R$ 25,00 | 20% | 25 * (1 - 20/100) | R$ 20,00 |
| R$ 100,00 | 50% | 100 * (1 - 50/100) | R$ 50,00 |

### Aplicar Desconto ao Carrinho

```javascript
function aplicarDesconto(itens, percentualDesconto) {
    if (percentualDesconto < 0 || percentualDesconto > 100) {
        throw new Error('Percentual de desconto invalido');
    }

    return itens.map(item => ({
        ...item,
        precoVenda: arredondar(
            item.precoVenda * (1 - percentualDesconto / 100),
            2
        )
    }));
}
```

### Regras de Desconto

- Desconto maximo recomendado: 50%
- Desconto aplica a todos os itens do carrinho
- Novo desconto substitui desconto anterior
- Desconto de 0% = sem desconto
- Desconto de 100% = item gratis (evitar)

---

## 6. Lucro por Item

### Formula

```
lucroItem = (precoVenda - valorCompra) * quantidade
```

### Variaveis

| Variavel | Tipo | Descricao |
|----------|------|-----------|
| precoVenda | decimal | Preco de venda unitario |
| valorCompra | decimal | Custo unitario |
| quantidade | inteiro | Quantidade vendida |
| lucroItem | decimal | Lucro obtido no item |

### Exemplos

| Produto | Custo | Venda | Qtd | Calculo | Lucro |
|---------|-------|-------|-----|---------|-------|
| Refrigerante | R$ 5,50 | R$ 7,70 | 5 | (7,70 - 5,50) * 5 | R$ 11,00 |
| Biscoito | R$ 3,00 | R$ 4,50 | 10 | (4,50 - 3,00) * 10 | R$ 15,00 |
| Sabao | R$ 9,60 | R$ 12,00 | 2 | (12,00 - 9,60) * 2 | R$ 4,80 |

### Implementacao

```javascript
function calcularLucroItem(precoVenda, valorCompra, quantidade) {
    const lucroUnitario = precoVenda - valorCompra;
    return arredondar(lucroUnitario * quantidade, 2);
}
```

---

## 7. Total Investido (Custo)

### Formula

```
totalInvestido = SUM(valorCompra[i] * quantidade[i])
```

### Exemplo

| Item | Custo Unitario | Qtd | Investido |
|------|----------------|-----|-----------|
| Refrigerante | R$ 5,50 | 5 | R$ 27,50 |
| Biscoito | R$ 3,00 | 10 | R$ 30,00 |
| Sabao | R$ 9,60 | 2 | R$ 19,20 |
| **TOTAL** | | | **R$ 76,70** |

### Implementacao

```javascript
function calcularTotalInvestido(vendas) {
    return arredondar(
        vendas.reduce((soma, venda) => {
            return soma + (venda.valorCompra * venda.quantidade);
        }, 0),
        2
    );
}
```

---

## 8. Total de Vendas (Receita)

### Formula

```
totalVendas = SUM(precoVenda[i] * quantidade[i])
```

### Exemplo

| Item | Venda Unitaria | Qtd | Vendido |
|------|----------------|-----|---------|
| Refrigerante | R$ 7,70 | 5 | R$ 38,50 |
| Biscoito | R$ 4,50 | 10 | R$ 45,00 |
| Sabao | R$ 12,00 | 2 | R$ 24,00 |
| **TOTAL** | | | **R$ 107,50** |

### Implementacao

```javascript
function calcularTotalVendas(vendas) {
    return arredondar(
        vendas.reduce((soma, venda) => {
            return soma + venda.total; // ou venda.precoVenda * venda.quantidade
        }, 0),
        2
    );
}
```

---

## 9. Lucro Total

### Formula

```
lucroTotal = totalVendas - totalInvestido
```

Ou equivalente:
```
lucroTotal = SUM(lucroItem[i])
```

### Exemplo

| Metrica | Valor |
|---------|-------|
| Total Investido | R$ 76,70 |
| Total Vendas | R$ 107,50 |
| **Lucro Total** | **R$ 30,80** |

### Implementacao

```javascript
function calcularLucroTotal(vendas) {
    const totalInvestido = calcularTotalInvestido(vendas);
    const totalVendas = calcularTotalVendas(vendas);

    return arredondar(totalVendas - totalInvestido, 2);
}
```

### Observacao

- Lucro positivo: operacao lucrativa
- Lucro zero: empate (break-even)
- Lucro negativo: prejuizo (pode ocorrer com descontos altos)

---

## 10. Margem de Lucro Real

### Formula (Inversa)

```
margemReal = ((precoVenda - valorCompra) / valorCompra) * 100
```

### Uso

Calcular a margem real apos aplicar desconto:

| Produto | Custo | Venda Original | Desconto | Venda Final | Margem Real |
|---------|-------|----------------|----------|-------------|-------------|
| Item A | R$ 10 | R$ 15 | 10% | R$ 13,50 | 35% |
| Item B | R$ 20 | R$ 30 | 20% | R$ 24,00 | 20% |

### Implementacao

```javascript
function calcularMargemReal(precoVenda, valorCompra) {
    if (valorCompra <= 0) return 0;
    return arredondar(
        ((precoVenda - valorCompra) / valorCompra) * 100,
        2
    );
}
```

---

## Formatacao de Valores

### Moeda (Real Brasileiro)

```javascript
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Ou manual:
function formatarParaReal(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}
```

### Exemplos

| Valor | Formatado |
|-------|-----------|
| 10 | R$ 10,00 |
| 5.5 | R$ 5,50 |
| 1234.56 | R$ 1.234,56 |
| 0.99 | R$ 0,99 |

### Percentual

```javascript
function formatarPercentual(valor) {
    return valor.toFixed(0) + '%';
}
```

---

## Arredondamento

### Regra

Sempre arredondar valores monetarios para 2 casas decimais usando arredondamento matematico padrao (half-up).

### Implementacao

```javascript
function arredondar(valor, casasDecimais) {
    const fator = Math.pow(10, casasDecimais);
    return Math.round(valor * fator) / fator;
}
```

### Exemplos

| Valor Original | Arredondado (2 casas) |
|----------------|----------------------|
| 10.555 | 10.56 |
| 10.554 | 10.55 |
| 10.5 | 10.50 |
| 10.999 | 11.00 |

---

## Conversao de Entrada

### Virgula para Ponto

O usuario brasileiro pode digitar valores com virgula. Converter antes de calcular:

```javascript
function converterEntrada(valor) {
    if (typeof valor === 'string') {
        // Remover espacos
        valor = valor.trim();
        // Converter virgula para ponto
        valor = valor.replace(',', '.');
    }
    return parseFloat(valor);
}
```

### Exemplos

| Entrada | Convertido |
|---------|------------|
| "10" | 10.0 |
| "10,50" | 10.5 |
| "10.50" | 10.5 |
| "1.234,56" | Erro (tratar) |

---

## Validacoes

### Valores Monetarios

```javascript
function validarValorMonetario(valor) {
    return typeof valor === 'number' &&
           !isNaN(valor) &&
           valor >= 0 &&
           valor < 1000000; // Limite maximo
}
```

### Quantidade

```javascript
function validarQuantidade(quantidade) {
    return Number.isInteger(quantidade) &&
           quantidade > 0 &&
           quantidade < 1000000;
}
```

### Margem

```javascript
function validarMargem(margem) {
    return Number.isInteger(margem) &&
           margem >= 0 &&
           margem <= 1000;
}
```

---

## Resumo das Formulas

| Calculo | Formula |
|---------|---------|
| Preco de Venda | `custo * (1 + margem/100)` |
| Subtotal Item | `preco * quantidade` |
| Total Venda | `SUM(subtotais)` |
| Troco | `valorPago - total` |
| Desconto | `preco * (1 - desconto/100)` |
| Lucro Item | `(venda - custo) * quantidade` |
| Total Investido | `SUM(custo * quantidade)` |
| Total Vendas | `SUM(venda * quantidade)` |
| Lucro Total | `totalVendas - totalInvestido` |
| Margem Real | `((venda - custo) / custo) * 100` |

---

## Checklist de Implementacao

- [ ] Implementar funcao de arredondamento
- [ ] Implementar conversao de entrada (virgula para ponto)
- [ ] Implementar calculo de preco de venda
- [ ] Implementar calculo de subtotal
- [ ] Implementar calculo de total da venda
- [ ] Implementar calculo de troco
- [ ] Implementar aplicacao de desconto
- [ ] Implementar calculo de lucro por item
- [ ] Implementar calculo de total investido
- [ ] Implementar calculo de total de vendas
- [ ] Implementar calculo de lucro total
- [ ] Implementar formatacao de moeda
- [ ] Implementar validacoes de valores
- [ ] Testar calculos com valores limite
- [ ] Testar arredondamentos
