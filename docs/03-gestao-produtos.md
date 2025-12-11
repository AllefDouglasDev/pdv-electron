# 03 - Gestao de Produtos

Sistema de cadastro de novos produtos no estoque.

## Visao Geral

Esta tela permite cadastrar novos produtos no sistema, definindo todas as informacoes necessarias para controle de estoque e calculo de precos. O preco de venda e calculado automaticamente com base no valor de compra e margem de lucro.

**Permissao**: Admin, Gerente

---

## Tela de Cadastro de Produto

### Layout

```
+================================================================+
|  [<- Voltar]            Cadastrar Produto                      |
+================================================================+
|                                                                |
|  Nome do Produto *                                             |
|  +----------------------------------------------------------+  |
|  |                                                          |  |
|  +----------------------------------------------------------+  |
|                                                                |
|  Codigo de Barras *                                            |
|  +----------------------------------------------------------+  |
|  |                                                          |  |
|  +----------------------------------------------------------+  |
|  (Pode usar leitor de codigo de barras)                        |
|                                                                |
|  +-------------------------+  +---------------------------+    |
|  | Valor de Compra (R$) * |  | Margem de Lucro (%) *     |    |
|  | +---------------------+ |  | +-----------------------+ |    |
|  | | 0,00                | |  | | 0                     | |    |
|  | +---------------------+ |  | +-----------------------+ |    |
|  +-------------------------+  +---------------------------+    |
|                                                                |
|  +-------------------------+  +---------------------------+    |
|  | Quantidade Inicial *   |  | Preco de Venda (R$)       |    |
|  | +---------------------+ |  | +-----------------------+ |    |
|  | | 0                   | |  | | R$ 0,00 (calculado)   | |    |
|  | +---------------------+ |  | +-----------------------+ |    |
|  +-------------------------+  +---------------------------+    |
|                                                                |
|  +------------------+  +------------------+                    |
|  |    Cancelar     |  |    Cadastrar    |                    |
|  +------------------+  +------------------+                    |
|                                                                |
|  [Mensagem de feedback aqui]                                   |
|                                                                |
+================================================================+
```

### Componentes

| Componente | Tipo | Descricao |
|------------|------|-----------|
| Botao Voltar | Button | Retorna a tela principal |
| Nome do Produto | Input Text | Nome para identificacao |
| Codigo de Barras | Input Text | Codigo unico do produto |
| Valor de Compra | Input Number | Preco de custo |
| Margem de Lucro | Input Number | Percentual de lucro |
| Quantidade | Input Number | Estoque inicial |
| Preco de Venda | Label | Calculado automaticamente |
| Botao Cancelar | Button | Limpa formulario |
| Botao Cadastrar | Button | Salva produto |

---

## Campos do Formulario

### Nome do Produto

| Propriedade | Valor |
|-------------|-------|
| Tipo | texto |
| Obrigatorio | sim |
| Tamanho minimo | 2 caracteres |
| Tamanho maximo | 100 caracteres |
| Foco inicial | sim |

### Codigo de Barras

| Propriedade | Valor |
|-------------|-------|
| Tipo | texto |
| Obrigatorio | sim |
| Tamanho minimo | 1 caractere |
| Tamanho maximo | 50 caracteres |
| Validacao | unico no sistema |
| Entrada | manual ou leitor |

**Comportamento com Leitor**:
- Campo deve aceitar entrada rapida do leitor
- Apos leitura, cursor pode pular para proximo campo
- Validar se codigo ja existe no banco

### Valor de Compra

| Propriedade | Valor |
|-------------|-------|
| Tipo | decimal |
| Obrigatorio | sim |
| Valor minimo | 0.01 |
| Valor maximo | 999999.99 |
| Casas decimais | 2 |
| Formato entrada | aceitar virgula ou ponto |
| Formato exibicao | R$ 0,00 |

**Conversao de Entrada**:
- Usuario pode digitar: `10`, `10.50`, `10,50`
- Sistema converte para: `10.00`, `10.50`, `10.50`
- Armazenar sempre como decimal com ponto

### Margem de Lucro

| Propriedade | Valor |
|-------------|-------|
| Tipo | inteiro |
| Obrigatorio | sim |
| Valor minimo | 0 |
| Valor maximo | 1000 |
| Unidade | percentual (%) |

**Exemplos**:
- 0% = venda pelo preco de custo
- 50% = lucro de 50% sobre o custo
- 100% = preco de venda = 2x o custo

### Quantidade Inicial

| Propriedade | Valor |
|-------------|-------|
| Tipo | inteiro |
| Obrigatorio | sim |
| Valor minimo | 0 |
| Valor maximo | 999999 |

### Preco de Venda (Calculado)

| Propriedade | Valor |
|-------------|-------|
| Tipo | decimal (somente leitura) |
| Calculo | automatico |
| Formato | R$ 0,00 |
| Atualizacao | tempo real |

**Formula**:
```
precoVenda = valorCompra + (valorCompra * margemLucro / 100)
```

**Exemplos**:
| Valor Compra | Margem | Preco Venda |
|--------------|--------|-------------|
| R$ 10,00 | 50% | R$ 15,00 |
| R$ 100,00 | 30% | R$ 130,00 |
| R$ 5,50 | 100% | R$ 11,00 |

---

## Fluxo de Cadastro

### Diagrama

```
[Acessa tela de cadastro]
         |
         v
[Preenche campos]
         |
         v
[Sistema calcula preco em tempo real]
         |
         v
[Clica "Cadastrar"]
         |
         v
[Validacao Frontend]
    |         |
   Erro      OK
    |         |
    v         v
[Mostra    [Verifica codigo duplicado]
 erros]         |
            |       |
          Existe   Novo
            |       |
            v       v
        [Erro:   [Insere no banco]
        codigo       |
        existe]      v
               [Mostra sucesso]
                     |
                     v
               [Limpa formulario]
                     |
                     v
               [Foco no nome]
```

### Passo a Passo

1. **Acesso a Tela**
   - Usuario clica em "Cadastrar Produto" no menu
   - Sistema verifica permissao (Admin ou Gerente)
   - Exibe formulario vazio

2. **Preenchimento**
   - Usuario preenche nome do produto
   - Usuario digita ou escaneia codigo de barras
   - Usuario informa valor de compra
   - Usuario informa margem de lucro
   - Sistema calcula e exibe preco de venda
   - Usuario informa quantidade inicial

3. **Validacao Frontend**
   - Verificar campos obrigatorios
   - Verificar formatos validos
   - Se erro: destacar campos e exibir mensagens

4. **Validacao Backend**
   - Verificar se codigo de barras ja existe
   - Se existe: exibir erro especifico

5. **Gravacao**
   - Calcular preco de venda final
   - Inserir registro no banco
   - Exibir mensagem de sucesso

6. **Pos-Cadastro**
   - Limpar todos os campos
   - Retornar foco para campo nome
   - Permitir novo cadastro imediato

---

## Validacoes

### Frontend

| Campo | Regra | Mensagem |
|-------|-------|----------|
| Nome | Obrigatorio | "Informe o nome do produto" |
| Nome | Min 2 caracteres | "Nome muito curto" |
| Codigo | Obrigatorio | "Informe o codigo de barras" |
| Valor Compra | Obrigatorio | "Informe o valor de compra" |
| Valor Compra | > 0 | "Valor deve ser maior que zero" |
| Margem | Obrigatorio | "Informe a margem de lucro" |
| Margem | >= 0 | "Margem nao pode ser negativa" |
| Quantidade | Obrigatorio | "Informe a quantidade" |
| Quantidade | >= 0 | "Quantidade nao pode ser negativa" |

### Backend

| Regra | Mensagem |
|-------|----------|
| Codigo duplicado | "Este codigo de barras ja esta cadastrado" |
| Erro de conexao | "Erro ao salvar. Tente novamente" |

---

## Consultas SQL

### Verificar Codigo Duplicado

```sql
SELECT COUNT(*) as count
FROM produtos
WHERE codigo_barras = ?
```

### Inserir Produto

```sql
INSERT INTO produtos (
    nome,
    valor_compra,
    margem_lucro,
    quantidade,
    valor_venda,
    codigo_barras,
    created_at,
    updated_at
) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
```

**Parametros**:
1. nome (string)
2. valor_compra (decimal)
3. margem_lucro (integer)
4. quantidade (integer)
5. valor_venda (decimal, calculado)
6. codigo_barras (string)

---

## Calculo do Preco de Venda

### Formula

```
valorVenda = valorCompra + (valorCompra * margemLucro / 100)
```

Ou simplificado:
```
valorVenda = valorCompra * (1 + margemLucro / 100)
```

### Implementacao

```javascript
function calcularPrecoVenda(valorCompra, margemLucro) {
    if (valorCompra <= 0 || margemLucro < 0) {
        return 0;
    }
    const preco = valorCompra * (1 + margemLucro / 100);
    return Math.round(preco * 100) / 100; // Arredondar 2 casas
}
```

### Atualizacao em Tempo Real

O campo "Preco de Venda" deve atualizar automaticamente quando:
- Valor de Compra e alterado
- Margem de Lucro e alterada

Usar eventos `onInput` ou `onChange` nos campos.

---

## Interface do Usuario

### Estados do Formulario

| Estado | Descricao |
|--------|-----------|
| Vazio | Campos limpos, pronto para entrada |
| Preenchendo | Usuario digitando, preco calculando |
| Validando | Apos clique em Cadastrar, aguardando |
| Erro | Campos com erro destacados |
| Sucesso | Mensagem verde, campos limpos |

### Feedback Visual

| Situacao | Feedback |
|----------|----------|
| Campo obrigatorio vazio | Borda vermelha + mensagem abaixo |
| Valor invalido | Borda vermelha + mensagem abaixo |
| Codigo duplicado | Toast vermelho + borda no campo |
| Sucesso | Toast verde "Produto cadastrado com sucesso!" |
| Erro de sistema | Toast vermelho "Erro ao salvar. Tente novamente" |

### Formatacao de Valores

| Campo | Formato Entrada | Formato Exibicao |
|-------|-----------------|------------------|
| Valor Compra | 10 / 10.50 / 10,50 | R$ 10,50 |
| Margem | 50 | 50% |
| Quantidade | 100 | 100 |
| Preco Venda | - | R$ 15,75 |

---

## Controle de Acesso

### Verificacao de Permissao

```
SE sessao.role == 'operador' ENTAO
    Exibir mensagem: "Acesso negado"
    Redirecionar para tela principal
FIM SE
```

### Visibilidade do Menu

- Botao/menu "Cadastrar Produto" visivel apenas para Admin e Gerente
- Operador nao deve ver esta opcao

---

## Comportamento do Leitor de Codigo de Barras

### Caracteristicas

- Leitores enviam os dados como digitacao rapida
- Geralmente enviam ENTER ao final
- Tempo de leitura: ~100-300ms

### Tratamento

1. Campo codigo deve ter foco quando esperando leitura
2. Aceitar entrada rapida sem truncar
3. Se ENTER ao final: pular para proximo campo ou validar
4. Validar formato minimo do codigo

---

## Atalhos de Teclado

| Tecla | Acao |
|-------|------|
| ENTER | Submeter formulario |
| TAB | Navegar entre campos |
| ESC | Cancelar (limpar formulario) |

---

## Exemplo de Cadastro

### Entrada

| Campo | Valor |
|-------|-------|
| Nome | Refrigerante Cola 2L |
| Codigo | 7891234567890 |
| Valor Compra | 5,50 |
| Margem | 40 |
| Quantidade | 24 |

### Calculo

```
Preco Venda = 5.50 + (5.50 * 40 / 100)
Preco Venda = 5.50 + 2.20
Preco Venda = 7.70
```

### Resultado

| Campo | Valor |
|-------|-------|
| Preco de Venda | R$ 7,70 |

---

## Checklist de Implementacao

- [ ] Criar tela de cadastro de produto
- [ ] Implementar campo Nome com validacao
- [ ] Implementar campo Codigo de Barras
- [ ] Implementar campo Valor de Compra (decimal)
- [ ] Implementar campo Margem de Lucro (inteiro)
- [ ] Implementar campo Quantidade
- [ ] Implementar calculo automatico do preco de venda
- [ ] Implementar atualizacao em tempo real do preco
- [ ] Implementar validacoes de frontend
- [ ] Implementar verificacao de codigo duplicado
- [ ] Implementar insercao no banco de dados
- [ ] Implementar feedback de sucesso/erro
- [ ] Implementar limpeza do formulario apos sucesso
- [ ] Implementar controle de acesso (Admin, Gerente)
- [ ] Testar com leitor de codigo de barras
- [ ] Testar validacoes
- [ ] Testar calculos
