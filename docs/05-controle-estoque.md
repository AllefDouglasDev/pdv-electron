# 05 - Controle de Estoque

Tela de listagem, busca e edicao de produtos cadastrados.

## Visao Geral

Esta tela permite visualizar todos os produtos cadastrados, buscar por codigo de barras e editar informacoes dos produtos existentes. O estoque e atualizado automaticamente apos cada venda, mas ajustes manuais podem ser feitos nesta tela.

**Permissoes**:
- Admin: Visualizacao e edicao completa
- Gerente: Visualizacao e edicao completa
- Operador: Apenas visualizacao (consulta)

---

## Layout da Tela

### Estrutura Principal

```
+====================================================================+
| [<- Voltar]             Controle de Estoque                        |
+====================================================================+
|                                                                    |
|  [Listar Todos]    Buscar: [________________] [Buscar]             |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+  |
|  | Nome           | Codigo      | Qtd | Margem | Preco Venda   |  |
|  +--------------------------------------------------------------+  |
|  | Refrigerante   | 78912345... | 24  | 40%    | R$ 7,70       |  |
|  | Biscoito       | 78998765... | 50  | 35%    | R$ 4,50       |  |
|  | Sabao em Po    | 78911111... |  5  | 25%    | R$ 12,00      |  |
|  | Arroz 5kg      | 78922222... | 15  | 20%    | R$ 28,00      |  |
|  +--------------------------------------------------------------+  |
|                                                                    |
|  Mostrando 4 de 120 produtos                   [< Anterior] [Prox >]|
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|  EDITAR PRODUTO (selecione um item acima)                          |
|                                                                    |
|  Nome: [_______________________]  Codigo: [____________] (fixo)    |
|                                                                    |
|  Valor Compra: [_________]  Margem: [____]%  Quantidade: [_____]   |
|                                                                    |
|  Preco de Venda: R$ 0,00 (calculado)                               |
|                                                                    |
|  [Salvar Alteracoes]                                               |
|                                                                    |
+====================================================================+
```

---

## Componentes da Tela

### Area de Busca

| Componente | Descricao |
|------------|-----------|
| Botao Listar Todos | Carrega todos os produtos |
| Campo Busca | Input para codigo de barras |
| Botao Buscar | Executa busca por codigo |

### Tabela de Produtos

| Coluna | Descricao |
|--------|-----------|
| Nome | Nome do produto |
| Codigo | Codigo de barras |
| Qtd | Quantidade em estoque |
| Margem | Margem de lucro (%) |
| Preco Venda | Preco de venda calculado |

### Paginacao

| Componente | Descricao |
|------------|-----------|
| Contador | "Mostrando X de Y produtos" |
| Botao Anterior | Pagina anterior |
| Botao Proximo | Proxima pagina |

### Formulario de Edicao

| Campo | Tipo | Editavel |
|-------|------|----------|
| Nome | texto | sim |
| Codigo | texto | nao (somente leitura) |
| Valor Compra | decimal | sim |
| Margem | inteiro | sim |
| Quantidade | inteiro | sim |
| Preco Venda | decimal | nao (calculado) |

---

## Fluxos de Operacao

### Fluxo: Listar Todos os Produtos

```
[Clicar "Listar Todos"]
         |
         v
[Consultar banco - primeiros 20]
         |
         v
[Preencher tabela]
         |
         v
[Atualizar contador]
         |
         v
[Habilitar paginacao se necessario]
```

### Fluxo: Buscar por Codigo

```
[Digitar codigo no campo]
         |
         v
[Clicar "Buscar" ou ENTER]
         |
         v
[Consultar banco por codigo]
    |         |
  Nao       Sim
  encontrado encontrado
    |         |
    v         v
[Msg:      [Exibir na tabela]
 nao           |
 encontrado]   v
          [Limpar campo busca]
```

### Fluxo: Selecionar para Edicao

```
[Clicar em linha da tabela]
         |
         v
[Destacar linha selecionada]
         |
         v
[Preencher formulario de edicao]
         |
         v
[Calcular e exibir preco de venda]
```

### Fluxo: Salvar Alteracoes

```
[Editar campos do formulario]
         |
         v
[Clicar "Salvar Alteracoes"]
         |
         v
[Validacao Frontend]
    |         |
   Erro      OK
    |         |
    v         v
[Mostrar  [Recalcular preco de venda]
 erros]        |
               v
          [Atualizar no banco]
               |
               v
          [Atualizar linha na tabela]
               |
               v
          [Exibir sucesso]
               |
               v
          [Limpar formulario]
```

---

## Paginacao

### Configuracao

| Parametro | Valor |
|-----------|-------|
| Itens por pagina | 20 |
| Pagina inicial | 1 |

### Calculo

```
offset = (paginaAtual - 1) * itensPorPagina
totalPaginas = TETO(totalItens / itensPorPagina)
```

### Consulta SQL com Paginacao

```sql
SELECT id, nome, codigo_barras, quantidade, margem_lucro, valor_venda
FROM produtos
ORDER BY nome ASC
LIMIT 20 OFFSET ?
```

### Contar Total

```sql
SELECT COUNT(*) as total FROM produtos
```

---

## Campos do Formulario de Edicao

### Nome do Produto

| Propriedade | Valor |
|-------------|-------|
| Tipo | texto |
| Editavel | sim |
| Obrigatorio | sim |
| Min | 2 caracteres |
| Max | 100 caracteres |

### Codigo de Barras

| Propriedade | Valor |
|-------------|-------|
| Tipo | texto |
| Editavel | **nao** |
| Exibicao | somente leitura (cinza) |

**Nota**: Codigo de barras nao pode ser alterado pois e a chave de identificacao do produto.

### Valor de Compra

| Propriedade | Valor |
|-------------|-------|
| Tipo | decimal |
| Editavel | sim |
| Obrigatorio | sim |
| Min | 0.01 |
| Formato | aceitar virgula ou ponto |

### Margem de Lucro

| Propriedade | Valor |
|-------------|-------|
| Tipo | inteiro |
| Editavel | sim |
| Obrigatorio | sim |
| Min | 0 |
| Max | 1000 |
| Unidade | % |

### Quantidade

| Propriedade | Valor |
|-------------|-------|
| Tipo | inteiro |
| Editavel | sim |
| Obrigatorio | sim |
| Min | 0 |

**Uso**: Ajuste manual de estoque (inventario, devolucoes, etc.)

### Preco de Venda

| Propriedade | Valor |
|-------------|-------|
| Tipo | decimal |
| Editavel | **nao** |
| Calculo | automatico |
| Formato | R$ 0,00 |

---

## Validacoes

### Validacoes do Formulario

| Campo | Regra | Mensagem |
|-------|-------|----------|
| Nome | Obrigatorio | "Informe o nome do produto" |
| Nome | Min 2 caracteres | "Nome muito curto" |
| Valor Compra | Obrigatorio | "Informe o valor de compra" |
| Valor Compra | > 0 | "Valor deve ser maior que zero" |
| Margem | Obrigatorio | "Informe a margem de lucro" |
| Margem | >= 0 | "Margem nao pode ser negativa" |
| Quantidade | Obrigatorio | "Informe a quantidade" |
| Quantidade | >= 0 | "Quantidade nao pode ser negativa" |

### Validacoes do Sistema

| Regra | Mensagem |
|-------|----------|
| Produto nao selecionado | "Selecione um produto para editar" |
| Erro de conexao | "Erro ao salvar. Tente novamente" |

---

## Consultas SQL

### Listar Produtos (Paginado)

```sql
SELECT id, nome, codigo_barras, quantidade, margem_lucro, valor_venda, valor_compra
FROM produtos
ORDER BY nome ASC
LIMIT ? OFFSET ?
```

### Buscar por Codigo

```sql
SELECT id, nome, codigo_barras, quantidade, margem_lucro, valor_venda, valor_compra
FROM produtos
WHERE codigo_barras = ?
```

### Atualizar Produto

```sql
UPDATE produtos
SET nome = ?,
    valor_compra = ?,
    margem_lucro = ?,
    quantidade = ?,
    valor_venda = ?,
    updated_at = datetime('now')
WHERE id = ?
```

### Contar Total de Produtos

```sql
SELECT COUNT(*) as total FROM produtos
```

---

## Recalculo do Preco de Venda

### Quando Recalcular

O preco de venda deve ser recalculado sempre que:
- Valor de compra e alterado
- Margem de lucro e alterada

### Formula

```
precoVenda = valorCompra + (valorCompra * margemLucro / 100)
```

### Implementacao

Ao alterar campo valor_compra ou margem:
1. Obter valor atual de ambos os campos
2. Calcular novo preco de venda
3. Atualizar campo preco de venda (exibicao)
4. Ao salvar: incluir novo preco no UPDATE

---

## Controle de Acesso

### Admin e Gerente

- Visualizar lista de produtos
- Buscar produtos
- Editar todos os campos
- Salvar alteracoes

### Operador

- Visualizar lista de produtos
- Buscar produtos
- **Nao pode editar** (formulario desabilitado ou oculto)
- **Nao pode salvar**

### Implementacao

```
SE sessao.role == 'operador' ENTAO
    Esconder ou desabilitar formulario de edicao
    Esconder botao "Salvar Alteracoes"
FIM SE
```

---

## Interface do Usuario

### Estados da Tela

| Estado | Descricao |
|--------|-----------|
| Inicial | Tabela vazia, aguardando acao |
| Listando | Tabela com produtos, paginacao ativa |
| Buscando | Resultado da busca na tabela |
| Editando | Produto selecionado, formulario preenchido |
| Salvando | Processando, botao desabilitado |

### Feedback Visual

| Situacao | Feedback |
|----------|----------|
| Listagem carregada | Tabela preenchida |
| Busca sem resultado | Toast amarelo "Produto nao encontrado" |
| Busca com resultado | Tabela com 1 item |
| Salvo com sucesso | Toast verde "Produto atualizado!" |
| Erro ao salvar | Toast vermelho com mensagem |

### Destaque de Estoque Baixo

Produtos com quantidade <= 5:
- Linha com fundo amarelo claro
- Ou indicador visual (icone de alerta)

---

## Layout Responsivo

### Desktop (Padrao)

- Tabela completa com todas as colunas
- Formulario abaixo da tabela

### Tablet/Mobile (Se aplicavel)

- Tabela com colunas reduzidas (Nome, Qtd, Preco)
- Formulario em modal/drawer
- Toque na linha abre edicao

---

## Atalhos de Teclado

| Tecla | Acao |
|-------|------|
| ENTER | Executar busca (no campo de busca) |
| F5 | Atualizar lista |
| ESC | Limpar selecao |

---

## Exemplos de Uso

### Exemplo 1: Ajuste de Inventario

1. Usuario faz contagem fisica: 30 unidades de "Arroz 5kg"
2. Sistema mostra: 25 unidades
3. Usuario busca pelo codigo do arroz
4. Seleciona o produto
5. Altera quantidade de 25 para 30
6. Clica "Salvar Alteracoes"
7. Sistema atualiza banco

### Exemplo 2: Alteracao de Margem

1. Fornecedor aumentou preco de compra
2. Usuario busca o produto
3. Atualiza valor de compra
4. Sistema recalcula preco de venda automaticamente
5. Usuario confirma e salva

---

## Checklist de Implementacao

### Interface
- [ ] Criar layout da tela de estoque
- [ ] Implementar botao "Listar Todos"
- [ ] Implementar campo e botao de busca
- [ ] Implementar tabela de produtos
- [ ] Implementar paginacao
- [ ] Implementar formulario de edicao
- [ ] Implementar campo de preco calculado

### Funcionalidades
- [ ] Implementar listagem paginada
- [ ] Implementar busca por codigo de barras
- [ ] Implementar selecao de produto na tabela
- [ ] Implementar preenchimento do formulario
- [ ] Implementar recalculo do preco de venda
- [ ] Implementar validacoes do formulario
- [ ] Implementar salvamento no banco
- [ ] Implementar atualizacao da tabela apos salvar

### Permissoes
- [ ] Implementar visualizacao para todos
- [ ] Implementar edicao apenas para Admin e Gerente
- [ ] Ocultar/desabilitar edicao para Operador

### Extras
- [ ] Implementar destaque de estoque baixo
- [ ] Implementar atalhos de teclado
- [ ] Implementar feedback visual
- [ ] Testar paginacao
- [ ] Testar edicao e recalculo
- [ ] Testar permissoes por role
