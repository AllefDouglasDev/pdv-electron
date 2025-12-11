# 10 - Impressao de Cupom

Sistema de geracao e impressao de cupom fiscal/recibo.

## Visao Geral

Apos finalizar uma venda, o sistema gera um cupom para impressao em impressora termica (bobina de 80mm ou 58mm). O cupom contem o resumo da venda com produtos, quantidades, valores e total.

---

## Layout do Cupom

### Estrutura Padrao (80mm)

```
================================
       MERCADO REAL
    Fluxo de Caixa
================================
CUPOM NAO FISCAL

Nome          Qtd  Valor  Subtot
--------------------------------
Refrige...     5   7,70   38,50
Biscoito      10   4,50   45,00
Sabao em..     2  12,00   24,00
--------------------------------
TOTAL:              R$ 107,50
================================
10/12/2025 14:35:22
Operador: Maria

Obrigado pela preferencia!
================================
```

### Estrutura Padrao (58mm)

```
========================
    MERCADO REAL
========================
CUPOM NAO FISCAL

Nome       Qtd   Valor
------------------------
Refrig..    5    38,50
Biscoito   10    45,00
Sabao..     2    24,00
------------------------
TOTAL:    R$ 107,50
========================
10/12/2025 14:35
Operador: Maria

Obrigado!
========================
```

---

## Secoes do Cupom

### 1. Cabecalho

| Elemento | Descricao |
|----------|-----------|
| Nome da Loja | Nome do estabelecimento |
| Subtitulo | Descricao ou slogan (opcional) |
| Separador | Linha de "=" ou "-" |
| Tipo | "CUPOM NAO FISCAL" |

### 2. Cabecalho da Tabela

| Coluna | Descricao |
|--------|-----------|
| Nome | Nome do produto (truncado) |
| Qtd | Quantidade |
| Valor | Preco unitario |
| Subtot | Subtotal (qtd * valor) |

### 3. Lista de Itens

Para cada produto vendido:
- Nome truncado (maximo 10-12 caracteres)
- Quantidade (inteiro)
- Valor unitario (2 casas decimais)
- Subtotal (2 casas decimais)

### 4. Total

- Linha separadora
- Texto "TOTAL:" alinhado
- Valor total formatado como moeda

### 5. Rodape

| Elemento | Descricao |
|----------|-----------|
| Data/Hora | Momento da venda |
| Operador | Nome do usuario que realizou |
| Mensagem | Agradecimento ao cliente |

---

## Formatacao

### Largura da Linha

| Tipo Impressora | Caracteres |
|-----------------|------------|
| 80mm | 42-48 caracteres |
| 58mm | 32-35 caracteres |

### Truncamento de Texto

```javascript
function truncar(texto, tamanhoMax) {
    if (texto.length <= tamanhoMax) {
        return texto;
    }
    return texto.substring(0, tamanhoMax - 2) + '..';
}
```

### Alinhamento

```javascript
function alinharDireita(texto, largura) {
    return texto.padStart(largura);
}

function alinharEsquerda(texto, largura) {
    return texto.padEnd(largura);
}

function centralizar(texto, largura) {
    const espacos = largura - texto.length;
    const esquerda = Math.floor(espacos / 2);
    return ' '.repeat(esquerda) + texto;
}
```

### Formatacao de Valores

```javascript
function formatarValor(valor) {
    return valor.toFixed(2).replace('.', ',');
}

function formatarMoeda(valor) {
    return 'R$ ' + formatarValor(valor);
}
```

---

## Geracao do Cupom

### Dados de Entrada

```javascript
const dadosVenda = {
    itens: [
        { nome: 'Refrigerante Cola 2L', quantidade: 5, valorUnitario: 7.70, subtotal: 38.50 },
        { nome: 'Biscoito Recheado', quantidade: 10, valorUnitario: 4.50, subtotal: 45.00 },
        { nome: 'Sabao em Po 1kg', quantidade: 2, valorUnitario: 12.00, subtotal: 24.00 }
    ],
    total: 107.50,
    dataHora: '10/12/2025 14:35:22',
    operador: 'Maria'
};
```

### Funcao de Geracao

```javascript
function gerarCupom(dadosVenda, largura = 42) {
    const linhas = [];
    const separador = '='.repeat(largura);
    const separadorFino = '-'.repeat(largura);

    // Cabecalho
    linhas.push(separador);
    linhas.push(centralizar('MERCADO REAL', largura));
    linhas.push(centralizar('Fluxo de Caixa', largura));
    linhas.push(separador);
    linhas.push('CUPOM NAO FISCAL');
    linhas.push('');

    // Cabecalho da tabela
    const colNome = 12;
    const colQtd = 4;
    const colValor = 8;
    const colSubtot = largura - colNome - colQtd - colValor - 3;

    linhas.push(
        alinharEsquerda('Nome', colNome) + ' ' +
        alinharDireita('Qtd', colQtd) + ' ' +
        alinharDireita('Valor', colValor) + ' ' +
        alinharDireita('Subtot', colSubtot)
    );
    linhas.push(separadorFino);

    // Itens
    for (const item of dadosVenda.itens) {
        linhas.push(
            alinharEsquerda(truncar(item.nome, colNome), colNome) + ' ' +
            alinharDireita(item.quantidade.toString(), colQtd) + ' ' +
            alinharDireita(formatarValor(item.valorUnitario), colValor) + ' ' +
            alinharDireita(formatarValor(item.subtotal), colSubtot)
        );
    }

    // Total
    linhas.push(separadorFino);
    linhas.push(alinharDireita('TOTAL: ' + formatarMoeda(dadosVenda.total), largura));

    // Rodape
    linhas.push(separador);
    linhas.push(dadosVenda.dataHora);
    linhas.push('Operador: ' + dadosVenda.operador);
    linhas.push('');
    linhas.push(centralizar('Obrigado pela preferencia!', largura));
    linhas.push(separador);

    return linhas.join('\n');
}
```

### Exemplo de Saida

```
==========================================
            MERCADO REAL
           Fluxo de Caixa
==========================================
CUPOM NAO FISCAL

Nome          Qtd    Valor    Subtot
------------------------------------------
Refrigera..     5     7,70     38,50
Biscoito R..   10     4,50     45,00
Sabao em P..    2    12,00     24,00
------------------------------------------
                   TOTAL: R$ 107,50
==========================================
10/12/2025 14:35:22
Operador: Maria

        Obrigado pela preferencia!
==========================================
```

---

## Impressao

### Opcao 1: Impressora Termica via Sistema

```javascript
async function imprimirCupom(conteudo) {
    // Usando API de impressao do sistema/framework
    const impressora = await obterImpressoraPadrao();

    if (!impressora) {
        throw new Error('Nenhuma impressora disponivel');
    }

    await impressora.imprimir({
        conteudo: conteudo,
        tipo: 'texto',
        fonte: 'monospace',
        tamanho: 9
    });
}
```

### Opcao 2: Impressao via Navegador (Electron/Web)

```javascript
function imprimirViaNavegador(conteudo) {
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
        <html>
        <head>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 10pt;
                    width: 80mm;
                    margin: 0;
                    padding: 5mm;
                }
                pre {
                    margin: 0;
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <pre>${conteudo}</pre>
        </body>
        </html>
    `);
    janelaImpressao.document.close();
    janelaImpressao.print();
    janelaImpressao.close();
}
```

### Opcao 3: Impressao Direta (ESC/POS)

Para impressoras termicas que suportam comandos ESC/POS:

```javascript
function gerarComandosESCPOS(dadosVenda) {
    const comandos = [];

    // Inicializar impressora
    comandos.push([0x1B, 0x40]); // ESC @

    // Centralizar
    comandos.push([0x1B, 0x61, 0x01]); // ESC a 1

    // Texto em negrito
    comandos.push([0x1B, 0x45, 0x01]); // ESC E 1
    comandos.push(textoParaBytes('MERCADO REAL\n'));
    comandos.push([0x1B, 0x45, 0x00]); // ESC E 0

    // Texto normal
    comandos.push(textoParaBytes('Fluxo de Caixa\n'));
    comandos.push(textoParaBytes('================================\n'));

    // Alinhar esquerda
    comandos.push([0x1B, 0x61, 0x00]); // ESC a 0

    // ... adicionar itens e total

    // Cortar papel
    comandos.push([0x1D, 0x56, 0x00]); // GS V 0

    return comandos.flat();
}
```

---

## Configuracoes

### Parametros Configuraveis

| Parametro | Padrao | Descricao |
|-----------|--------|-----------|
| nomeLoja | "MERCADO REAL" | Nome exibido no cabecalho |
| subtitulo | "Fluxo de Caixa" | Segunda linha do cabecalho |
| larguraPapel | 80 | 80mm ou 58mm |
| mostrarOperador | true | Exibir nome do operador |
| mensagemRodape | "Obrigado pela preferencia!" | Mensagem final |

### Arquivo de Configuracao

```json
{
    "impressao": {
        "nomeLoja": "MERCADO REAL",
        "subtitulo": "Fluxo de Caixa",
        "larguraPapel": 80,
        "mostrarOperador": true,
        "mensagemRodape": "Obrigado pela preferencia!",
        "impressoraPadrao": "EPSON TM-T20"
    }
}
```

---

## Tratamento de Erros

### Impressora Nao Disponivel

```javascript
try {
    await imprimirCupom(conteudo);
} catch (erro) {
    if (erro.message.includes('impressora')) {
        // Oferecer alternativas
        const opcao = await perguntarUsuario(
            'Impressora nao disponivel. Deseja:',
            ['Tentar novamente', 'Salvar como arquivo', 'Cancelar']
        );

        switch (opcao) {
            case 0:
                await imprimirCupom(conteudo);
                break;
            case 1:
                await salvarComoArquivo(conteudo);
                break;
            case 2:
                // Cancelar - nao fazer nada
                break;
        }
    }
}
```

### Erro Durante Impressao

```
+------------------------------------------+
|  (!) Erro de Impressao                   |
+------------------------------------------+
|  Nao foi possivel imprimir o cupom.      |
|                                          |
|  A venda foi registrada normalmente.     |
|                                          |
|  [Tentar Novamente]  [OK]                |
+------------------------------------------+
```

---

## Pre-visualizacao

### Tela de Pre-visualizacao (Opcional)

```
+================================================+
|           Pre-visualizacao do Cupom            |
+================================================+
|                                                |
|  +------------------------------------------+  |
|  | ========================================|  |
|  |           MERCADO REAL                  |  |
|  |          Fluxo de Caixa                 |  |
|  | ========================================|  |
|  | CUPOM NAO FISCAL                        |  |
|  |                                         |  |
|  | Nome          Qtd   Valor   Subtot      |  |
|  | ----------------------------------------|  |
|  | Refrigera..     5    7,70    38,50      |  |
|  | ...                                     |  |
|  +------------------------------------------+  |
|                                                |
|  +------------------+  +------------------+    |
|  |    Cancelar     |  |    Imprimir     |    |
|  +------------------+  +------------------+    |
|                                                |
+================================================+
```

---

## Caracteres Especiais

### Tratamento de Acentos

Impressoras termicas podem ter problemas com acentos. Opcoes:

1. **Remover acentos**:
```javascript
function removerAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
```

2. **Usar codepage correto** (se impressora suportar):
```javascript
// ESC t n - Selecionar codepage
comandos.push([0x1B, 0x74, 0x02]); // CP850 (Latin-1)
```

### Simbolo de Moeda

- R$ pode ser usado se impressora suportar
- Alternativa: usar "R$" como texto ASCII

---

## Integracao com Sistema Original

### Sistema Java Original

O sistema Java usa `PrintServiceLookup` para encontrar impressora:

```java
public static void imprimirCupom(ArrayList<Produto> produtos) {
    PrintService service = PrintServiceLookup.lookupDefaultPrintService();

    if (service != null) {
        // Formatar cupom
        StringBuilder cupom = new StringBuilder();
        cupom.append("========= Mercado Real ========\n");
        // ... adicionar itens

        // Enviar para impressora
        DocPrintJob job = service.createPrintJob();
        // ...
    }
}
```

---

## Checklist de Implementacao

### Geracao do Cupom
- [ ] Implementar funcao de truncamento de texto
- [ ] Implementar funcoes de alinhamento
- [ ] Implementar formatacao de valores
- [ ] Implementar geracao do cabecalho
- [ ] Implementar geracao da lista de itens
- [ ] Implementar geracao do total
- [ ] Implementar geracao do rodape
- [ ] Testar com diferentes quantidades de itens

### Impressao
- [ ] Implementar deteccao de impressora
- [ ] Implementar impressao via sistema
- [ ] Implementar fallback (salvar arquivo)
- [ ] Implementar tratamento de erros
- [ ] Testar com impressora termica real

### Configuracao
- [ ] Criar arquivo de configuracao
- [ ] Permitir customizar nome da loja
- [ ] Permitir customizar mensagem de rodape
- [ ] Permitir selecionar impressora

### Extras
- [ ] Implementar pre-visualizacao (opcional)
- [ ] Testar com larguras diferentes (80mm, 58mm)
- [ ] Testar tratamento de acentos
- [ ] Documentar requisitos de impressora
