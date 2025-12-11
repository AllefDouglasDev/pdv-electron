# 04 - Ponto de Venda (PDV)

Tela principal de vendas para atendimento ao cliente.

## Visao Geral

O PDV e a tela mais utilizada do sistema. Permite registrar vendas de forma rapida usando leitor de codigo de barras ou digitacao manual. O operador adiciona produtos ao carrinho, aplica descontos se necessario, finaliza a venda com baixa automatica no estoque e impressao de cupom.

**Permissao**: Admin, Gerente, Operador (Todos)

---

## Layout da Tela

### Estrutura Principal

```
+====================================================================+
| [Home]  [Data/Hora: 10/12/2025 14:35:22]                           |
+====================================================================+
|                                                                    |
|  Codigo de Barras:                                                 |
|  +---------------------------+  [Adicionar]                        |
|  |                           |                                     |
|  +---------------------------+                                     |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | Nome           | Codigo      | Qtd | Valor Unit | Subtotal  |  |
|  +--------------------------------------------------------------+  |
|  | Refrigerante   | 78912345... | 2   | R$ 7,70    | R$ 15,40  |  |
|  | Biscoito       | 78998765... | 1   | R$ 4,50    | R$ 4,50   |  |
|  | Sabao em Po    | 78911111... | 1   | R$ 12,00   | R$ 12,00  |  |
|  |                |             |     |            |           |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  [Editar Qtd]  [Remover Item]  [Desconto]                          |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|                              TOTAL: R$ 31,90                       |
|                                                                    |
|  Valor Pago: [___________]    Troco: R$ 0,00                       |
|                                                                    |
|  [Calcular Troco]                        [FINALIZAR VENDA]         |
|                                                                    |
+====================================================================+
```

---

## Componentes da Tela

### Cabecalho

| Componente | Descricao |
|------------|-----------|
| Botao Home | Retorna a tela principal |
| Relogio | Data e hora em tempo real (atualiza a cada segundo) |

### Area de Entrada

| Componente | Descricao |
|------------|-----------|
| Campo Codigo | Input para digitar/escanear codigo de barras |
| Botao Adicionar | Adiciona produto ao carrinho (opcional, ENTER funciona) |

### Tabela do Carrinho

| Coluna | Descricao |
|--------|-----------|
| Nome | Nome do produto |
| Codigo | Codigo de barras (truncado se necessario) |
| Qtd | Quantidade do item |
| Valor Unit | Preco unitario de venda |
| Subtotal | Quantidade x Valor Unitario |

### Botoes de Acao do Carrinho

| Botao | Descricao |
|-------|-----------|
| Editar Qtd | Altera quantidade do item selecionado |
| Remover Item | Remove item selecionado do carrinho |
| Desconto | Aplica desconto percentual na venda |

### Area de Finalizacao

| Componente | Descricao |
|------------|-----------|
| Total | Soma de todos os subtotais |
| Valor Pago | Campo para informar valor recebido do cliente |
| Troco | Calculo automatico (Valor Pago - Total) |
| Botao Calcular Troco | Executa o calculo do troco |
| Botao Finalizar | Conclui a venda |

---

## Fluxos de Operacao

### Fluxo: Adicionar Produto

```
[Escanear/Digitar codigo]
         |
         v
[Pressionar ENTER]
         |
         v
[Buscar produto no banco]
    |         |
  Nao       Sim
  existe    existe
    |         |
    v         v
[Erro:    [Verificar estoque]
 produto      |
 nao      |       |
 encontrado] <= 0    > 0
            |       |
            v       v
        [Erro:   [Verificar se ja esta no carrinho]
        sem          |
        estoque]  |           |
               Nao          Sim
               esta         esta
                |             |
                v             v
            [Adicionar   [Incrementar
             novo item]   quantidade]
                |             |
                +------+------+
                       |
                       v
                [Atualizar total]
                       |
                       v
                [Limpar campo codigo]
                       |
                       v
                [Foco no campo codigo]
```

### Fluxo: Editar Quantidade

```
[Selecionar item na tabela]
         |
         v
[Clicar "Editar Qtd"]
         |
         v
[Abrir dialog com campo quantidade]
         |
         v
[Digitar nova quantidade]
         |
         v
[Confirmar]
         |
         v
[Validar quantidade]
    |         |
   <= 0       > 0
    |         |
    v         v
[Remover   [Verificar estoque disponivel]
 item]          |
            |       |
         Insuf.   OK
            |       |
            v       v
        [Erro:   [Atualizar quantidade]
        estoque      |
        insuf.]      v
               [Recalcular subtotal]
                     |
                     v
               [Atualizar total]
```

### Fluxo: Remover Item

```
[Selecionar item na tabela]
         |
         v
[Clicar "Remover Item"]
         |
         v
[Confirmar remocao?]
    |         |
   Nao       Sim
    |         |
    v         v
[Cancelar] [Remover da lista]
                |
                v
          [Recalcular total]
```

### Fluxo: Aplicar Desconto

```
[Clicar "Desconto"]
         |
         v
[Abrir dialog com campo percentual]
         |
         v
[Digitar percentual (ex: 10)]
         |
         v
[Confirmar]
         |
         v
[Para cada item no carrinho:]
    |
    v
[novoPreco = precoAtual - (precoAtual * desconto / 100)]
    |
    v
[Atualizar valores na tabela]
    |
    v
[Recalcular total]
```

### Fluxo: Calcular Troco

```
[Digitar valor pago]
         |
         v
[Clicar "Calcular Troco"]
         |
         v
[troco = valorPago - total]
    |
    v
[troco >= 0?]
    |         |
   Nao       Sim
    |         |
    v         v
[Erro:    [Exibir troco]
 valor
 insuficiente]
```

### Fluxo: Finalizar Venda

```
[Clicar "FINALIZAR VENDA"]
         |
         v
[Carrinho tem itens?]
    |         |
   Nao       Sim
    |         |
    v         v
[Erro:    [Para cada item:]
 carrinho     |
 vazio]       v
          [Verificar estoque disponivel]
              |
              v
          [Registrar venda no banco]
              |
              v
          [Subtrair quantidade do estoque]
              |
              v
          [Gerar dados do cupom]
              |
              v
          [Imprimir cupom]
              |
              v
          [Limpar carrinho]
              |
              v
          [Zerar total e troco]
              |
              v
          [Foco no campo codigo]
              |
              v
          [Exibir sucesso]
```

---

## Detalhamento dos Componentes

### Campo Codigo de Barras

| Propriedade | Valor |
|-------------|-------|
| Tipo | texto |
| Tamanho | 50 caracteres |
| Foco inicial | sim |
| Auto-limpar | apos adicionar produto |
| Enter | aciona adicao |

**Comportamento com Leitor**:
- Aceitar entrada rapida
- ENTER ao final do scan adiciona automaticamente
- Retornar foco apos operacao

### Tabela do Carrinho

| Propriedade | Valor |
|-------------|-------|
| Selecao | linha unica |
| Scroll | vertical se necessario |
| Ordenacao | ordem de adicao |
| Edicao | apenas via botoes |

### Campo Total

| Propriedade | Valor |
|-------------|-------|
| Tipo | somente leitura |
| Fonte | grande (destaque) |
| Formato | R$ 0,00 |
| Atualizacao | automatica |

### Campo Valor Pago

| Propriedade | Valor |
|-------------|-------|
| Tipo | decimal |
| Obrigatorio | nao (opcional) |
| Formato | aceitar virgula ou ponto |

### Campo Troco

| Propriedade | Valor |
|-------------|-------|
| Tipo | somente leitura |
| Fonte | grande (destaque) |
| Formato | R$ 0,00 |
| Cor | verde se positivo |

### Relogio

| Propriedade | Valor |
|-------------|-------|
| Formato | dd/MM/YYYY HH:mm:ss |
| Atualizacao | a cada segundo |
| Posicao | cabecalho |

---

## Estrutura de Dados do Carrinho

### Item do Carrinho

```
ItemCarrinho {
    id: integer           // ID do produto no banco
    nome: string          // Nome do produto
    codigo: string        // Codigo de barras
    quantidade: integer   // Quantidade no carrinho
    valorUnitario: decimal// Preco de venda unitario
    subtotal: decimal     // quantidade * valorUnitario
    estoqueDisponivel: integer // Para validacao
}
```

### Carrinho

```
Carrinho {
    itens: ItemCarrinho[] // Lista de itens
    total: decimal        // Soma dos subtotais
    descontoAplicado: integer // Percentual aplicado (0 se nenhum)
}
```

---

## Validacoes

### Adicionar Produto

| Validacao | Mensagem |
|-----------|----------|
| Codigo vazio | "Digite ou escaneie um codigo" |
| Produto nao encontrado | "Produto nao encontrado!" |
| Estoque zerado | "Produto sem estoque!" |
| Estoque baixo (<=5) | "Atencao: Estoque baixo! Adicionar a lista de compras" |

### Editar Quantidade

| Validacao | Mensagem |
|-----------|----------|
| Quantidade <= 0 | Remove o item |
| Quantidade > estoque | "Estoque insuficiente! Disponivel: X" |
| Valor invalido | "Informe uma quantidade valida" |

### Finalizar Venda

| Validacao | Mensagem |
|-----------|----------|
| Carrinho vazio | "Adicione produtos antes de finalizar" |
| Estoque alterado | "Estoque alterado. Verifique os itens" |

---

## Consultas SQL

### Buscar Produto por Codigo

```sql
SELECT id, nome, codigo_barras, quantidade, valor_venda
FROM produtos
WHERE codigo_barras = ?
```

### Registrar Item da Venda

```sql
INSERT INTO vendas (
    nome,
    valor_compra,
    quantidade,
    valor_venda,
    codigo_barras,
    hora,
    total,
    usuario_id,
    created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
```

### Atualizar Estoque

```sql
UPDATE produtos
SET quantidade = quantidade - ?,
    updated_at = datetime('now')
WHERE id = ?
```

---

## Calculo do Desconto

### Formula

Para cada item:
```
novoPreco = precoAtual - (precoAtual * percentualDesconto / 100)
```

### Exemplo

| Item | Preco Original | Desconto 10% | Preco Final |
|------|---------------|--------------|-------------|
| Produto A | R$ 10,00 | R$ 1,00 | R$ 9,00 |
| Produto B | R$ 25,00 | R$ 2,50 | R$ 22,50 |

### Regras

- Desconto aplica a todos os itens do carrinho
- Desconto maximo sugerido: 50% (configuravel)
- Nao acumula descontos (novo desconto substitui anterior)
- Arredondar para 2 casas decimais

---

## Calculo do Troco

### Formula

```
troco = valorPago - totalVenda
```

### Validacao

```
SE valorPago < totalVenda ENTAO
    Exibir erro: "Valor insuficiente"
    Nao permitir finalizar
FIM SE
```

---

## Impressao do Cupom

Ao finalizar a venda, gerar dados para impressao:

```
+================================+
|     MERCADO REAL               |
|================================|
| Refrigerante     2x 7,70 15,40 |
| Biscoito         1x 4,50  4,50 |
| Sabao em Po      1x12,00 12,00 |
|--------------------------------|
| TOTAL:              R$ 31,90   |
|================================|
| 10/12/2025 14:35:22            |
| Obrigado pela preferencia!     |
+================================+
```

Ver detalhes em [10-impressao-cupom.md](./10-impressao-cupom.md)

---

## Interface do Usuario

### Estados da Tela

| Estado | Descricao |
|--------|-----------|
| Aguardando | Carrinho vazio, esperando entrada |
| Vendendo | Itens no carrinho, operacoes disponiveis |
| Processando | Finalizando venda, botoes desabilitados |
| Finalizado | Venda concluida, carrinho limpo |

### Feedback Visual

| Situacao | Feedback |
|----------|----------|
| Produto adicionado | Flash verde na linha |
| Produto nao encontrado | Toast vermelho + som (opcional) |
| Estoque baixo | Toast amarelo de alerta |
| Venda finalizada | Toast verde "Venda realizada!" |
| Erro | Toast vermelho com mensagem |

### Destaque do Total

- Fonte grande (24-36pt)
- Cor de destaque
- Posicao fixa (sempre visivel)

---

## Alertas de Estoque

### Estoque Baixo (Quantidade <= 5)

Ao adicionar produto com estoque baixo:
```
+------------------------------------------+
|  (!) Atencao                             |
+------------------------------------------+
|  Estoque baixo: apenas X unidades        |
|  Adicionar a lista de compras?           |
|                                          |
|  [OK]                                    |
+------------------------------------------+
```

### Sem Estoque (Quantidade = 0)

```
+------------------------------------------+
|  (X) Produto sem estoque                 |
+------------------------------------------+
|  Nao temos "Produto X" na prateleira.    |
|                                          |
|  [OK]                                    |
+------------------------------------------+
```

---

## Atalhos de Teclado

| Tecla | Acao |
|-------|------|
| ENTER | Adicionar produto (no campo codigo) |
| F2 | Editar quantidade do item selecionado |
| DELETE | Remover item selecionado |
| F5 | Aplicar desconto |
| F10 | Finalizar venda |
| ESC | Voltar para tela principal |

---

## Sessao do Operador

### Registro de Vendas

Cada venda deve registrar:
- ID do usuario que realizou
- Data e hora da venda
- Itens vendidos com valores

### Consulta

```sql
SELECT v.*, u.username
FROM vendas v
JOIN users u ON v.usuario_id = u.id
WHERE DATE(v.created_at) = DATE('now')
```

---

## Checklist de Implementacao

### Interface
- [ ] Criar layout da tela de PDV
- [ ] Implementar campo de codigo de barras
- [ ] Implementar tabela do carrinho
- [ ] Implementar exibicao do total em destaque
- [ ] Implementar campo de valor pago
- [ ] Implementar exibicao do troco
- [ ] Implementar relogio em tempo real
- [ ] Implementar botao Home

### Adicao de Produtos
- [ ] Implementar busca por codigo de barras
- [ ] Implementar adicao ao carrinho
- [ ] Implementar incremento de quantidade para duplicados
- [ ] Implementar validacao de estoque
- [ ] Implementar alerta de estoque baixo
- [ ] Implementar mensagem de produto nao encontrado

### Operacoes do Carrinho
- [ ] Implementar selecao de item na tabela
- [ ] Implementar edicao de quantidade
- [ ] Implementar remocao de item
- [ ] Implementar aplicacao de desconto

### Finalizacao
- [ ] Implementar calculo do troco
- [ ] Implementar finalizacao da venda
- [ ] Implementar baixa no estoque
- [ ] Implementar registro no banco
- [ ] Implementar impressao do cupom
- [ ] Implementar limpeza do carrinho

### Extras
- [ ] Implementar atalhos de teclado
- [ ] Implementar feedback visual
- [ ] Testar com leitor de codigo de barras
- [ ] Testar fluxo completo de venda
- [ ] Testar cenarios de erro
