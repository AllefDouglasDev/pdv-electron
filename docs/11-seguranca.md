# 11 - Seguranca

Recomendacoes e praticas de seguranca para o sistema.

## Visao Geral

Este documento descreve as praticas de seguranca recomendadas para proteger os dados do sistema e dos usuarios. Inclui recomendacoes que **NAO existem** no sistema Java original, mas sao essenciais para uma implementacao segura.

**Status**: Estas sao RECOMENDACOES para a nova implementacao.

---

## 1. Hash de Senha

### Problema (Sistema Atual)

O sistema Java original armazena senhas em texto plano:
```java
// INSEGURO - senha em texto plano
db.execute("SELECT * FROM user WHERE password = ?", [senhaDigitada]);
```

### Solucao Recomendada

Usar algoritmo de hash seguro (bcrypt, argon2, ou scrypt):

```javascript
const bcrypt = require('bcrypt');

// Ao criar usuario
async function criarUsuario(username, senha) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(senha, saltRounds);

    await db.execute(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        [username, hash]
    );
}

// Ao fazer login
async function verificarSenha(username, senhaDigitada) {
    const usuario = await db.query(
        'SELECT password_hash FROM users WHERE username = ?',
        [username]
    );

    if (!usuario) {
        return false;
    }

    return await bcrypt.compare(senhaDigitada, usuario.password_hash);
}
```

### Caracteristicas do bcrypt

| Propriedade | Valor |
|-------------|-------|
| Algoritmo | Blowfish-based |
| Salt | Gerado automaticamente |
| Custo (rounds) | 10-12 recomendado |
| Tempo por hash | ~100ms |
| Resistencia | Brute force, rainbow tables |

### Alternativas

| Algoritmo | Quando Usar |
|-----------|-------------|
| bcrypt | Padrao recomendado |
| argon2 | Mais moderno, se disponivel |
| scrypt | Alta seguranca, mais lento |
| PBKDF2 | Compatibilidade maxima |

**NUNCA usar**: MD5, SHA1, SHA256 simples (sem salt)

---

## 2. Prevencao de SQL Injection

### Problema

SQL Injection permite que atacantes executem comandos arbitrarios no banco:

```javascript
// VULNERAVEL
const query = `SELECT * FROM users WHERE username = '${username}'`;
// Se username = "admin' OR '1'='1" -> retorna todos os usuarios
```

### Solucao: Prepared Statements

**SEMPRE** usar prepared statements com parametros:

```javascript
// SEGURO
const usuario = await db.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
);
```

### Exemplo Completo

```javascript
// CORRETO - Parametros seguros
async function buscarProduto(codigo) {
    return await db.query(
        'SELECT * FROM produtos WHERE codigo_barras = ?',
        [codigo]
    );
}

// CORRETO - Multiplos parametros
async function atualizarProduto(id, nome, valor) {
    return await db.execute(
        'UPDATE produtos SET nome = ?, valor_compra = ? WHERE id = ?',
        [nome, valor, id]
    );
}

// INCORRETO - Concatenacao de string
async function buscarProdutoINSEGURO(codigo) {
    // NUNCA FAZER ISSO!
    return await db.query(
        `SELECT * FROM produtos WHERE codigo_barras = '${codigo}'`
    );
}
```

### Bibliotecas que Ajudam

| Biblioteca | Linguagem | Como Usar |
|------------|-----------|-----------|
| better-sqlite3 | Node.js | `db.prepare(sql).get(params)` |
| sqlite3 | Node.js | `db.get(sql, params, callback)` |
| knex.js | Node.js | Query builder com escape automatico |

---

## 3. Validacao de Entrada

### Tipos de Validacao

1. **Tipo de dado**: Garantir que numeros sao numeros
2. **Tamanho**: Limitar comprimento de strings
3. **Formato**: Validar padroes esperados
4. **Limites**: Verificar valores minimos e maximos

### Implementacao

```javascript
const validacao = {
    // Username
    validarUsername(username) {
        if (!username || typeof username !== 'string') {
            throw new Error('Username invalido');
        }
        if (username.length < 3 || username.length > 50) {
            throw new Error('Username deve ter 3-50 caracteres');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new Error('Username deve conter apenas letras, numeros e underscore');
        }
        return username.trim();
    },

    // Valor monetario
    validarValor(valor) {
        const numero = parseFloat(valor);
        if (isNaN(numero) || numero < 0 || numero > 999999.99) {
            throw new Error('Valor invalido');
        }
        return Math.round(numero * 100) / 100;
    },

    // Quantidade
    validarQuantidade(qtd) {
        const numero = parseInt(qtd, 10);
        if (isNaN(numero) || numero < 0 || numero > 999999) {
            throw new Error('Quantidade invalida');
        }
        return numero;
    },

    // Codigo de barras
    validarCodigo(codigo) {
        if (!codigo || typeof codigo !== 'string') {
            throw new Error('Codigo invalido');
        }
        codigo = codigo.trim();
        if (codigo.length < 1 || codigo.length > 50) {
            throw new Error('Codigo deve ter 1-50 caracteres');
        }
        return codigo;
    }
};
```

### Onde Validar

1. **Frontend**: Feedback imediato ao usuario
2. **Backend**: Validacao definitiva antes de processar
3. **Banco**: Constraints como ultima linha de defesa

```
Usuario -> [Frontend] -> [Backend] -> [Banco]
           Validacao     Validacao    Constraints
           rapida        definitiva   CHECK/NOT NULL
```

---

## 4. Controle de Acesso

### Matriz de Permissoes

| Recurso | Admin | Gerente | Operador |
|---------|-------|---------|----------|
| Login | Sim | Sim | Sim |
| Gestao Usuarios | Sim | Nao | Nao |
| Cadastro Produtos | Sim | Sim | Nao |
| Edicao Produtos | Sim | Sim | Nao |
| Consulta Estoque | Sim | Sim | Sim |
| PDV (Vendas) | Sim | Sim | Sim |
| Relatorios | Sim | Sim | Nao |
| Fechamento Caixa | Sim | Sim | Nao |
| Backup | Sim | Nao | Nao |
| Restauracao | Sim | Nao | Nao |

### Implementacao

```javascript
const permissoes = {
    admin: ['*'], // Acesso total
    gerente: ['produtos', 'estoque', 'vendas', 'relatorios', 'fechamento'],
    operador: ['estoque.leitura', 'vendas']
};

function temPermissao(role, recurso) {
    if (permissoes[role].includes('*')) {
        return true;
    }
    return permissoes[role].includes(recurso);
}

// Middleware de verificacao
function verificarPermissao(recurso) {
    return (req, res, next) => {
        const { role } = req.sessao.usuario;
        if (!temPermissao(role, recurso)) {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        next();
    };
}
```

### Verificacao na Interface

```javascript
// Ocultar botoes sem permissao
function renderizarMenu(usuario) {
    const itens = [
        { nome: 'Vendas', recurso: 'vendas', visivel: true },
        { nome: 'Produtos', recurso: 'produtos', visivel: temPermissao(usuario.role, 'produtos') },
        { nome: 'Usuarios', recurso: 'usuarios', visivel: usuario.role === 'admin' }
    ];

    return itens.filter(i => i.visivel);
}
```

---

## 5. Gerenciamento de Sessao

### Estrutura da Sessao

```javascript
const sessao = {
    id: 'uuid-unico',
    usuario: {
        id: 1,
        username: 'maria',
        role: 'gerente',
        nome: 'Maria Silva'
    },
    criadaEm: '2025-12-10T14:35:22',
    ultimaAtividade: '2025-12-10T15:20:00'
};
```

### Timeout por Inatividade

```javascript
const TIMEOUT_MINUTOS = 30;

function verificarSessao(sessao) {
    const agora = new Date();
    const ultimaAtividade = new Date(sessao.ultimaAtividade);
    const diferencaMinutos = (agora - ultimaAtividade) / 1000 / 60;

    if (diferencaMinutos > TIMEOUT_MINUTOS) {
        destruirSessao(sessao.id);
        return false;
    }

    // Atualizar timestamp
    sessao.ultimaAtividade = agora.toISOString();
    return true;
}
```

### Logout

```javascript
function logout(sessaoId) {
    // Destruir sessao
    sessoes.delete(sessaoId);

    // Redirecionar para login
    navegarPara('/login');
}
```

---

## 6. Log de Acoes Criticas

### O que Registrar

| Acao | Dados a Registrar |
|------|-------------------|
| Login | usuario, data/hora, sucesso/falha |
| Logout | usuario, data/hora |
| Criar Usuario | admin, novo usuario, data/hora |
| Alterar Usuario | admin, usuario alterado, campos |
| Excluir Usuario | admin, usuario excluido |
| Venda Finalizada | operador, total, itens |
| Fechamento Caixa | usuario, total, data/hora |
| Backup | usuario, arquivo, data/hora |
| Restauracao | usuario, arquivo, data/hora |

### Estrutura do Log

```javascript
const logEntry = {
    timestamp: '2025-12-10T14:35:22.123Z',
    tipo: 'VENDA_FINALIZADA',
    usuario: {
        id: 2,
        username: 'maria'
    },
    detalhes: {
        total: 107.50,
        itens: 3
    },
    ip: '192.168.1.100' // Se aplicavel
};
```

### Implementacao Simples

```javascript
const fs = require('fs');
const path = require('path');

function registrarLog(tipo, usuario, detalhes) {
    const entry = {
        timestamp: new Date().toISOString(),
        tipo,
        usuario: {
            id: usuario.id,
            username: usuario.username
        },
        detalhes
    };

    const linha = JSON.stringify(entry) + '\n';
    const arquivo = path.join('logs', `${getDataAtual()}.log`);

    fs.appendFileSync(arquivo, linha);
}

// Uso
registrarLog('LOGIN', usuario, { sucesso: true });
registrarLog('VENDA', usuario, { total: 107.50, itens: 3 });
```

---

## 7. Protecao do Banco de Dados

### Permissoes de Arquivo

```bash
# Linux/Mac - apenas usuario pode ler/escrever
chmod 600 mercado.db

# Pasta de backups
chmod 700 backups/
```

### Localizacao Segura

- Nao colocar banco em pasta publica
- Evitar sincronizacao automatica (Dropbox, etc.)
- Fazer backup em local separado

### Criptografia (Opcional)

Para dados muito sensiveis, considerar SQLCipher:

```javascript
const Database = require('better-sqlite3-sqlcipher');
const db = new Database('mercado.db');
db.pragma(`key = 'senha-forte'`);
```

---

## 8. Protecao contra CSRF (Se Web)

Se implementar como aplicacao web:

```javascript
// Gerar token
function gerarTokenCSRF() {
    return crypto.randomBytes(32).toString('hex');
}

// Verificar em cada requisicao POST
function verificarCSRF(req) {
    const tokenSessao = req.sessao.csrfToken;
    const tokenRecebido = req.body._csrf || req.headers['x-csrf-token'];

    if (tokenSessao !== tokenRecebido) {
        throw new Error('Token CSRF invalido');
    }
}
```

---

## 9. Atualizacoes de Seguranca

### Dependencias

Manter bibliotecas atualizadas:

```bash
# npm
npm audit
npm update

# yarn
yarn audit
yarn upgrade
```

### Verificacao Periodica

| Frequencia | Acao |
|------------|------|
| Semanal | Verificar alertas de seguranca |
| Mensal | Atualizar dependencias |
| Trimestral | Revisar permissoes e acessos |

---

## 10. Boas Praticas Gerais

### Principio do Menor Privilegio

- Usuarios devem ter apenas as permissoes necessarias
- Nao usar admin para operacoes do dia-a-dia

### Mensagens de Erro

```javascript
// RUIM - revela informacao
throw new Error('Usuario admin nao encontrado');

// BOM - mensagem generica
throw new Error('Usuario ou senha invalidos');
```

### Dados Sensiveis

- Nunca logar senhas (nem hash)
- Nunca exibir senhas em tela
- Limpar dados sensiveis da memoria apos uso

### Senhas Fortes

Requisitos recomendados:
- Minimo 8 caracteres
- Mistura de maiusculas/minusculas
- Pelo menos um numero
- Pelo menos um caractere especial (opcional)

```javascript
function validarForcaSenha(senha) {
    if (senha.length < 8) {
        return { valida: false, motivo: 'Minimo 8 caracteres' };
    }
    if (!/[a-z]/.test(senha)) {
        return { valida: false, motivo: 'Incluir letra minuscula' };
    }
    if (!/[A-Z]/.test(senha)) {
        return { valida: false, motivo: 'Incluir letra maiuscula' };
    }
    if (!/[0-9]/.test(senha)) {
        return { valida: false, motivo: 'Incluir numero' };
    }
    return { valida: true };
}
```

---

## Checklist de Seguranca

### Autenticacao
- [ ] Implementar hash de senha (bcrypt)
- [ ] Usar prepared statements em todas as queries
- [ ] Validar todos os inputs
- [ ] Implementar timeout de sessao
- [ ] Criar usuario admin com senha forte

### Autorizacao
- [ ] Implementar verificacao de role
- [ ] Ocultar funcionalidades nao permitidas
- [ ] Verificar permissao no backend

### Dados
- [ ] Proteger arquivo do banco
- [ ] Implementar backup automatico
- [ ] Nao logar dados sensiveis

### Monitoramento
- [ ] Implementar log de acoes criticas
- [ ] Monitorar tentativas de login falhas
- [ ] Manter logs por periodo adequado

### Manutencao
- [ ] Manter dependencias atualizadas
- [ ] Revisar permissoes periodicamente
- [ ] Documentar procedimentos de seguranca
