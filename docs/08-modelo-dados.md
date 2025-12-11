# 08 - Modelo de Dados

Schema completo do banco de dados SQLite.

## Visao Geral

O sistema utiliza SQLite como banco de dados, armazenado em um arquivo local (`mercado.db`). Esta documentacao descreve todas as tabelas, campos, tipos e relacionamentos.

**Banco de Dados**: SQLite
**Arquivo**: `mercado.db`
**Encoding**: UTF-8

---

## Diagrama de Entidades

```
+------------------+       +------------------+       +------------------+
|      users       |       |     produtos     |       |      vendas      |
+------------------+       +------------------+       +------------------+
| id (PK)          |       | id (PK)          |       | id (PK)          |
| username         |       | nome             |       | nome             |
| password_hash    |       | codigo_barras    |       | codigo_barras    |
| full_name        |       | valor_compra     |       | valor_compra     |
| role             |       | margem_lucro     |       | valor_venda      |
| is_active        |       | valor_venda      |       | quantidade       |
| created_at       |       | quantidade       |       | total            |
| updated_at       |       | created_at       |       | hora             |
+------------------+       | updated_at       |       | usuario_id (FK)  |
                           +------------------+       | created_at       |
                                                      +------------------+
```

---

## Tabela: users

Armazena os usuarios do sistema com suas credenciais e permissoes.

### Estrutura

| Campo | Tipo | Nulo | Padrao | Descricao |
|-------|------|------|--------|-----------|
| id | INTEGER | NAO | AUTO | Chave primaria |
| username | TEXT | NAO | - | Nome de usuario (unico) |
| password_hash | TEXT | NAO | - | Hash da senha |
| full_name | TEXT | SIM | NULL | Nome completo para exibicao |
| role | TEXT | NAO | 'operador' | Perfil: admin, gerente, operador |
| is_active | INTEGER | NAO | 1 | 1=ativo, 0=inativo |
| created_at | TEXT | NAO | - | Data/hora de criacao |
| updated_at | TEXT | NAO | - | Data/hora de atualizacao |

### DDL

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'operador'
        CHECK (role IN ('admin', 'gerente', 'operador')),
    is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Indice para busca por username
CREATE INDEX idx_users_username ON users(username);

-- Indice para busca por role
CREATE INDEX idx_users_role ON users(role);
```

### Dados Iniciais

```sql
INSERT INTO users (username, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    'admin',
    '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- Hash de 'admin'
    'Administrador',
    'admin',
    1,
    datetime('now', 'localtime'),
    datetime('now', 'localtime')
);
```

### Valores de Role

| Valor | Descricao |
|-------|-----------|
| admin | Acesso total ao sistema |
| gerente | Produtos, vendas, relatorios |
| operador | Apenas vendas |

---

## Tabela: produtos

Armazena o catalogo de produtos e controle de estoque.

### Estrutura

| Campo | Tipo | Nulo | Padrao | Descricao |
|-------|------|------|--------|-----------|
| id | INTEGER | NAO | AUTO | Chave primaria |
| nome | TEXT | NAO | - | Nome do produto |
| codigo_barras | TEXT | NAO | - | Codigo de barras (unico) |
| valor_compra | REAL | NAO | - | Preco de custo |
| margem_lucro | INTEGER | NAO | - | Margem de lucro (%) |
| valor_venda | REAL | NAO | - | Preco de venda (calculado) |
| quantidade | INTEGER | NAO | 0 | Quantidade em estoque |
| created_at | TEXT | NAO | - | Data/hora de criacao |
| updated_at | TEXT | NAO | - | Data/hora de atualizacao |

### DDL

```sql
CREATE TABLE produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo_barras TEXT UNIQUE NOT NULL,
    valor_compra REAL NOT NULL CHECK (valor_compra >= 0),
    margem_lucro INTEGER NOT NULL CHECK (margem_lucro >= 0),
    valor_venda REAL NOT NULL CHECK (valor_venda >= 0),
    quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Indice para busca por codigo de barras
CREATE INDEX idx_produtos_codigo ON produtos(codigo_barras);

-- Indice para busca por nome
CREATE INDEX idx_produtos_nome ON produtos(nome);

-- Indice para produtos com estoque baixo
CREATE INDEX idx_produtos_estoque ON produtos(quantidade);
```

### Campos Calculados

O campo `valor_venda` e calculado antes de inserir/atualizar:

```
valor_venda = valor_compra + (valor_compra * margem_lucro / 100)
```

---

## Tabela: vendas

Registra todas as vendas realizadas (itens vendidos).

### Estrutura

| Campo | Tipo | Nulo | Padrao | Descricao |
|-------|------|------|--------|-----------|
| id | INTEGER | NAO | AUTO | Chave primaria |
| nome | TEXT | NAO | - | Nome do produto vendido |
| codigo_barras | TEXT | NAO | - | Codigo do produto |
| valor_compra | REAL | NAO | - | Custo unitario no momento |
| valor_venda | REAL | NAO | - | Preco de venda unitario |
| quantidade | INTEGER | NAO | - | Quantidade vendida |
| total | REAL | NAO | - | valor_venda * quantidade |
| hora | TEXT | NAO | - | Horario da venda (HH:mm:ss) |
| usuario_id | INTEGER | SIM | NULL | ID do usuario que vendeu |
| created_at | TEXT | NAO | - | Data/hora do registro |

### DDL

```sql
CREATE TABLE vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo_barras TEXT NOT NULL,
    valor_compra REAL NOT NULL,
    valor_venda REAL NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    total REAL NOT NULL,
    hora TEXT NOT NULL,
    usuario_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indice para busca por data
CREATE INDEX idx_vendas_created ON vendas(created_at);

-- Indice para busca por usuario
CREATE INDEX idx_vendas_usuario ON vendas(usuario_id);

-- Indice para busca por codigo
CREATE INDEX idx_vendas_codigo ON vendas(codigo_barras);
```

### Observacoes

- **Desnormalizacao intencional**: Os dados do produto (nome, valor_compra, valor_venda) sao copiados para a venda para manter o historico mesmo se o produto for alterado posteriormente.
- **usuario_id**: Permite rastrear quem realizou cada venda.
- **hora**: Armazenado separadamente para facilitar exibicao.

---

## Tipos de Dados SQLite

| Tipo SQL | Tipo SQLite | Uso no Sistema |
|----------|-------------|----------------|
| INTEGER | INTEGER | IDs, quantidades, booleanos (0/1) |
| TEXT | TEXT | Strings, datas (ISO 8601) |
| REAL | REAL | Valores monetarios (decimais) |

### Datas

SQLite nao tem tipo DATE nativo. Usar TEXT no formato ISO 8601:

```
YYYY-MM-DD HH:MM:SS
Exemplo: 2025-12-10 14:35:22
```

Funcoes uteis:
- `datetime('now', 'localtime')` - Data/hora atual local
- `date('now')` - Data atual
- `strftime('%H:%M:%S', 'now', 'localtime')` - Hora atual

---

## Consultas Comuns

### Usuarios

```sql
-- Buscar usuario por username
SELECT * FROM users WHERE username = ?;

-- Listar usuarios ativos
SELECT * FROM users WHERE is_active = 1 ORDER BY username;

-- Contar admins ativos
SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1;
```

### Produtos

```sql
-- Buscar produto por codigo
SELECT * FROM produtos WHERE codigo_barras = ?;

-- Listar produtos paginado
SELECT * FROM produtos ORDER BY nome LIMIT ? OFFSET ?;

-- Produtos com estoque baixo
SELECT * FROM produtos WHERE quantidade <= 5;

-- Contar total de produtos
SELECT COUNT(*) FROM produtos;
```

### Vendas

```sql
-- Todas as vendas (para relatorio)
SELECT * FROM vendas ORDER BY created_at;

-- Vendas de hoje
SELECT * FROM vendas WHERE DATE(created_at) = DATE('now', 'localtime');

-- Vendas por usuario
SELECT * FROM vendas WHERE usuario_id = ?;

-- Limpar vendas (fechamento)
DELETE FROM vendas;
```

### Calculos

```sql
-- Total investido (custo)
SELECT SUM(valor_compra * quantidade) as total_investido FROM vendas;

-- Total vendido
SELECT SUM(total) as total_vendido FROM vendas;

-- Lucro total
SELECT SUM((valor_venda - valor_compra) * quantidade) as lucro FROM vendas;
```

---

## Migracoes

### Adicionar Nova Coluna

```sql
-- Adicionar coluna a tabela existente
ALTER TABLE produtos ADD COLUMN categoria TEXT;

-- Definir valor padrao para registros existentes
UPDATE produtos SET categoria = 'Geral' WHERE categoria IS NULL;
```

### Criar Nova Tabela

```sql
-- Verificar se tabela existe antes de criar
CREATE TABLE IF NOT EXISTS nova_tabela (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ...
);
```

---

## Script de Criacao Completo

```sql
-- ==================================================
-- SCRIPT DE CRIACAO DO BANCO DE DADOS
-- FuxoDeCaixa - Sistema de Fluxo de Caixa
-- ==================================================

-- Habilitar foreign keys
PRAGMA foreign_keys = ON;

-- ==================================================
-- TABELA: users
-- ==================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'operador'
        CHECK (role IN ('admin', 'gerente', 'operador')),
    is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==================================================
-- TABELA: produtos
-- ==================================================
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo_barras TEXT UNIQUE NOT NULL,
    valor_compra REAL NOT NULL CHECK (valor_compra >= 0),
    margem_lucro INTEGER NOT NULL CHECK (margem_lucro >= 0),
    valor_venda REAL NOT NULL CHECK (valor_venda >= 0),
    quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque ON produtos(quantidade);

-- ==================================================
-- TABELA: vendas
-- ==================================================
CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo_barras TEXT NOT NULL,
    valor_compra REAL NOT NULL,
    valor_venda REAL NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    total REAL NOT NULL,
    hora TEXT NOT NULL,
    usuario_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vendas_created ON vendas(created_at);
CREATE INDEX IF NOT EXISTS idx_vendas_usuario ON vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vendas_codigo ON vendas(codigo_barras);

-- ==================================================
-- DADOS INICIAIS
-- ==================================================

-- Usuario admin padrao (senha: admin)
-- IMPORTANTE: Alterar a senha no primeiro acesso!
INSERT OR IGNORE INTO users (username, password_hash, full_name, role, is_active)
VALUES (
    'admin',
    '$2b$10$placeholder_hash_deve_ser_gerado_pela_aplicacao',
    'Administrador',
    'admin',
    1
);

-- ==================================================
-- FIM DO SCRIPT
-- ==================================================
```

---

## Verificacao de Integridade

```sql
-- Verificar integridade do banco
PRAGMA integrity_check;

-- Verificar foreign keys
PRAGMA foreign_key_check;

-- Listar tabelas
SELECT name FROM sqlite_master WHERE type='table';

-- Listar indices
SELECT name FROM sqlite_master WHERE type='index';
```

---

## Boas Praticas

### Prepared Statements

**SEMPRE** usar prepared statements para prevenir SQL Injection:

```javascript
// CORRETO
db.execute('SELECT * FROM users WHERE username = ?', [username]);

// INCORRETO (vulneravel!)
db.execute(`SELECT * FROM users WHERE username = '${username}'`);
```

### Transacoes

Para operacoes que afetam multiplas tabelas:

```sql
BEGIN TRANSACTION;
-- Operacoes aqui
COMMIT;

-- Em caso de erro:
ROLLBACK;
```

### Backup antes de Migracoes

Sempre fazer backup antes de alterar estrutura:

```javascript
await criarBackup('pre_migration_' + versao);
await executarMigracao();
```

---

## Checklist de Implementacao

- [ ] Criar arquivo mercado.db
- [ ] Criar tabela users com campos corretos
- [ ] Criar tabela produtos com campos corretos
- [ ] Criar tabela vendas com campos corretos
- [ ] Criar indices para otimizacao
- [ ] Inserir usuario admin padrao
- [ ] Testar constraints (CHECK, UNIQUE, NOT NULL)
- [ ] Testar foreign keys
- [ ] Implementar prepared statements
- [ ] Testar integridade do banco
