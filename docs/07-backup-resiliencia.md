# 07 - Backup e Resiliencia

Sistema de backup automatico, backup manual e recuperacao de dados.

## Visao Geral

Este e um dos componentes mais criticos do sistema. O objetivo e **NUNCA** perder dados do usuario. O sistema implementa multiplas camadas de protecao:

1. **Backup Automatico**: A cada inicializacao do sistema
2. **Backup Manual**: Sob demanda do usuario
3. **Retencao**: Manter ultimos 30 backups automaticos
4. **Restauracao**: Recuperar dados de backup selecionado
5. **Auto-recuperacao**: Restaurar automaticamente se banco corrompido

**Permissao para Backup/Restauracao Manual**: Apenas Admin

---

## Estrutura de Arquivos

### Localizacao

```
[raiz do sistema]/
├── mercado.db              # Banco de dados principal
├── backups/                # Pasta de backups
│   ├── mercado_INICIAL.db  # Backup inicial (primeiro uso)
│   ├── mercado_2025-12-10_08-00-00.db
│   ├── mercado_2025-12-10_14-30-15.db
│   ├── mercado_2025-12-09_08-00-00.db
│   └── ...
```

### Nomenclatura dos Arquivos

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Banco Principal | `mercado.db` | `mercado.db` |
| Backup Inicial | `mercado_INICIAL.db` | `mercado_INICIAL.db` |
| Backup Automatico | `mercado_YYYY-MM-DD_HH-mm-ss.db` | `mercado_2025-12-10_14-30-15.db` |
| Backup Manual | `mercado_MANUAL_YYYY-MM-DD_HH-mm-ss.db` | `mercado_MANUAL_2025-12-10_18-45-00.db` |

---

## Backup Automatico

### Quando Ocorre

- **Ao iniciar o sistema**: Antes de abrir a tela de login
- **Frequencia**: Uma vez por inicializacao

### Fluxo

```
[Sistema Inicia]
         |
         v
[Verificar se pasta backups/ existe]
    |         |
   Nao       Sim
    |         |
    v         v
[Criar    [Verificar se mercado.db existe]
 pasta]       |
    |     |       |
    |    Nao     Sim
    |     |       |
    |     v       v
    |  [Criar  [Verificar integridade]
    |   banco      |
    |   vazio]  |       |
    |          Erro    OK
    |           |       |
    |           v       v
    |      [Restaurar [Criar backup]
    |       ultimo        |
    |       backup]       v
    |           |    [Gerenciar retencao]
    |           v         |
    +----->[Continuar inicializacao]
```

### Implementacao

```javascript
async function backupAutomatico() {
    const pastaBackup = './backups';
    const bancoOrigem = './mercado.db';

    // 1. Garantir que pasta existe
    if (!existePasta(pastaBackup)) {
        criarPasta(pastaBackup);
    }

    // 2. Verificar se banco existe
    if (!existeArquivo(bancoOrigem)) {
        // Primeiro uso - criar banco vazio
        criarBancoVazio(bancoOrigem);
        // Criar backup inicial
        copiarArquivo(bancoOrigem, `${pastaBackup}/mercado_INICIAL.db`);
        return;
    }

    // 3. Verificar integridade
    if (!verificarIntegridade(bancoOrigem)) {
        // Banco corrompido - restaurar ultimo backup
        await restaurarUltimoBackup();
        return;
    }

    // 4. Criar backup com timestamp
    const timestamp = formatarTimestamp(new Date());
    const nomeBackup = `mercado_${timestamp}.db`;
    copiarArquivo(bancoOrigem, `${pastaBackup}/${nomeBackup}`);

    // 5. Gerenciar retencao (manter apenas 30)
    await gerenciarRetencao(pastaBackup, 30);
}
```

---

## Backup Manual

### Quando Usar

- Antes de operacoes criticas
- Antes de atualizacoes do sistema
- Por seguranca adicional
- Quando solicitado pelo usuario

### Interface

Botao na tela principal ou menu de configuracoes:

```
+------------------------------------------+
|  [Fazer Backup]                          |
+------------------------------------------+
```

### Fluxo

```
[Usuario clica "Fazer Backup"]
         |
         v
[Verificar permissao (Admin)]
    |         |
   Nao       Sim
    |         |
    v         v
[Erro:    [Criar backup com prefixo MANUAL]
 sem           |
 permissao]    v
          [Exibir sucesso com nome do arquivo]
```

### Feedback

```
+------------------------------------------+
|  Backup criado com sucesso!              |
|                                          |
|  Arquivo: mercado_MANUAL_2025-12-10...   |
|                                          |
|  [OK]                                    |
+------------------------------------------+
```

---

## Gerenciamento de Retencao

### Regra

- Manter no maximo **30 backups automaticos**
- Backups manuais **NAO contam** no limite
- Backup inicial (INICIAL) **NUNCA e removido**

### Algoritmo

```javascript
async function gerenciarRetencao(pasta, limite) {
    // Listar apenas backups automaticos
    const backups = listarArquivos(pasta)
        .filter(f => f.startsWith('mercado_') &&
                    !f.includes('MANUAL') &&
                    !f.includes('INICIAL'))
        .sort(); // Ordenar por data (mais antigo primeiro)

    // Remover excedentes
    while (backups.length > limite) {
        const maisAntigo = backups.shift();
        removerArquivo(`${pasta}/${maisAntigo}`);
    }
}
```

---

## Restauracao de Backup

### Opcao 1: Restauracao Manual (Via Interface)

```
+================================================================+
|                    Restaurar Backup                            |
+================================================================+
|                                                                |
|  Selecione o backup para restaurar:                            |
|                                                                |
|  +----------------------------------------------------------+  |
|  | Arquivo                         | Data        | Tamanho |  |
|  +----------------------------------------------------------+  |
|  | mercado_MANUAL_2025-12-10...    | 10/12 18:45 | 2.4 MB  |  |
|  | mercado_2025-12-10_14-30-15.db  | 10/12 14:30 | 2.3 MB  |  |
|  | mercado_2025-12-10_08-00-00.db  | 10/12 08:00 | 2.2 MB  |  |
|  | mercado_INICIAL.db              | 01/12 10:00 | 0.1 MB  |  |
|  +----------------------------------------------------------+  |
|                                                                |
|  ATENCAO: A restauracao substituira TODOS os dados atuais!     |
|                                                                |
|  +------------------+  +------------------+                    |
|  |    Cancelar     |  |    Restaurar    |                    |
|  +------------------+  +------------------+                    |
|                                                                |
+================================================================+
```

### Fluxo de Restauracao Manual

```
[Usuario seleciona backup]
         |
         v
[Clica "Restaurar"]
         |
         v
[Confirmar operacao?]
    |         |
   Nao       Sim
    |         |
    v         v
[Cancelar] [Criar backup do estado atual (seguranca)]
               |
               v
          [Fechar conexoes com banco]
               |
               v
          [Substituir mercado.db pelo backup]
               |
               v
          [Reabrir conexoes]
               |
               v
          [Exibir sucesso]
               |
               v
          [Reiniciar aplicacao (opcional)]
```

### Opcao 2: Auto-restauracao (Automatica)

Quando o sistema detecta corrupcao:

```
[Verificar integridade do banco]
         |
         v
[Banco corrompido?]
    |         |
   Nao       Sim
    |         |
    v         v
[Normal] [Buscar backup mais recente]
               |
               v
          [Existe backup valido?]
              |         |
             Nao       Sim
              |         |
              v         v
          [Erro     [Restaurar automaticamente]
           fatal]        |
                         v
                    [Notificar usuario]
                         |
                         v
                    [Continuar operacao]
```

---

## Verificacao de Integridade

### O que Verificar

1. **Arquivo existe**: O arquivo mercado.db esta presente
2. **Arquivo legivel**: Pode ser aberto para leitura
3. **Formato valido**: E um arquivo SQLite valido
4. **Tabelas existem**: As tabelas esperadas estao presentes

### Implementacao

```javascript
function verificarIntegridade(caminhoDb) {
    try {
        // 1. Arquivo existe?
        if (!existeArquivo(caminhoDb)) {
            return false;
        }

        // 2. Abrir conexao
        const db = abrirConexao(caminhoDb);

        // 3. Verificar integridade SQLite
        const resultado = db.execute('PRAGMA integrity_check;');
        if (resultado !== 'ok') {
            return false;
        }

        // 4. Verificar tabelas
        const tabelas = ['users', 'produtos', 'vendas'];
        for (const tabela of tabelas) {
            const existe = db.execute(
                `SELECT name FROM sqlite_master
                 WHERE type='table' AND name=?`,
                [tabela]
            );
            if (!existe) {
                return false;
            }
        }

        db.fechar();
        return true;

    } catch (erro) {
        return false;
    }
}
```

### Comando SQLite de Verificacao

```sql
PRAGMA integrity_check;
```

Retorna 'ok' se o banco estiver integro.

---

## Criacao de Banco Vazio

### Quando Criar

- Primeira execucao do sistema
- Backup inicial nao existe
- Auto-recuperacao falhou completamente

### Estrutura Inicial

```sql
-- Tabela de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'operador',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo_barras TEXT UNIQUE NOT NULL,
    valor_compra REAL NOT NULL,
    margem_lucro INTEGER NOT NULL,
    valor_venda REAL NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo_barras TEXT NOT NULL,
    valor_compra REAL NOT NULL,
    valor_venda REAL NOT NULL,
    quantidade INTEGER NOT NULL,
    total REAL NOT NULL,
    hora TEXT NOT NULL,
    usuario_id INTEGER,
    created_at TEXT NOT NULL
);

-- Usuario admin padrao
INSERT INTO users (username, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES ('admin', '<hash_de_admin>', 'Administrador', 'admin', 1, datetime('now'), datetime('now'));
```

---

## Estrategias de Seguranca

### Antes de Qualquer Restauracao

**SEMPRE** criar backup do estado atual antes de restaurar:

```javascript
async function restaurarBackup(arquivoBackup) {
    // 1. Backup de seguranca do estado atual
    const timestamp = formatarTimestamp(new Date());
    const backupSeguranca = `mercado_PRE_RESTORE_${timestamp}.db`;
    copiarArquivo('./mercado.db', `./backups/${backupSeguranca}`);

    // 2. Realizar restauracao
    copiarArquivo(arquivoBackup, './mercado.db');
}
```

### Validar Backup Antes de Usar

```javascript
function validarBackup(caminhoBackup) {
    // Usar mesma verificacao de integridade
    return verificarIntegridade(caminhoBackup);
}
```

---

## Permissoes de Acesso

### Backup Automatico

- Executado pelo sistema
- Nao requer permissao de usuario
- Acontece silenciosamente

### Backup Manual

- **Admin**: Pode executar
- **Gerente**: Nao pode executar
- **Operador**: Nao pode executar

### Restauracao

- **Admin**: Pode executar
- **Gerente**: Nao pode executar
- **Operador**: Nao pode executar

### Interface

Botoes de backup/restauracao visiveis apenas para Admin.

---

## Notificacoes ao Usuario

### Backup Automatico com Sucesso

Nao notificar (operacao silenciosa)

### Backup Automatico com Erro

```
+------------------------------------------+
|  (!) Atencao                             |
+------------------------------------------+
|  Nao foi possivel criar backup           |
|  automatico. Verifique o espaco em       |
|  disco e permissoes da pasta.            |
|                                          |
|  [OK]                                    |
+------------------------------------------+
```

### Auto-restauracao Executada

```
+------------------------------------------+
|  (i) Recuperacao Automatica              |
+------------------------------------------+
|  O banco de dados foi recuperado de      |
|  um backup anterior.                     |
|                                          |
|  Backup usado:                           |
|  mercado_2025-12-10_14-30-15.db          |
|                                          |
|  Algumas informacoes recentes podem      |
|  ter sido perdidas.                      |
|                                          |
|  [OK]                                    |
+------------------------------------------+
```

### Falha Total (Sem Backup Disponivel)

```
+------------------------------------------+
|  (X) Erro Critico                        |
+------------------------------------------+
|  O banco de dados esta corrompido e      |
|  nao foi possivel recuperar de backup.   |
|                                          |
|  Opcoes:                                 |
|  1. Verificar pasta de backups           |
|  2. Restaurar de backup externo          |
|  3. Iniciar com banco vazio              |
|                                          |
|  [Iniciar Vazio]  [Selecionar Backup]    |
+------------------------------------------+
```

---

## Boas Praticas

### Para o Usuario

1. **Fazer backups manuais** antes de operacoes importantes
2. **Copiar backups** para local externo periodicamente
3. **Nao deletar** a pasta de backups
4. **Verificar espaco em disco** regularmente

### Para o Desenvolvedor

1. **Sempre validar** backups antes de usar
2. **Nunca deletar** o backup INICIAL
3. **Criar backup** antes de qualquer restauracao
4. **Logar eventos** de backup/restauracao
5. **Testar recuperacao** periodicamente

---

## Scripts de Backup (Opcional)

### Windows (FAZER_BACKUP.bat)

```batch
@echo off
set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
copy mercado.db backups\mercado_MANUAL_%TIMESTAMP%.db
echo Backup criado: mercado_MANUAL_%TIMESTAMP%.db
pause
```

### Windows (RESTAURAR_BACKUP.bat)

```batch
@echo off
echo Backups disponiveis:
dir backups\*.db /b
echo.
set /p ARQUIVO=Digite o nome do arquivo para restaurar:
copy backups\%ARQUIVO% mercado.db
echo Banco restaurado!
pause
```

---

## Checklist de Implementacao

### Backup Automatico
- [ ] Criar pasta backups/ se nao existir
- [ ] Verificar existencia do banco principal
- [ ] Implementar verificacao de integridade
- [ ] Implementar copia do banco para backup
- [ ] Implementar gerenciamento de retencao (30 arquivos)
- [ ] Executar ao iniciar o sistema

### Backup Manual
- [ ] Criar interface/botao para backup manual
- [ ] Implementar controle de permissao (Admin)
- [ ] Criar backup com prefixo MANUAL
- [ ] Exibir feedback de sucesso

### Restauracao
- [ ] Criar interface de listagem de backups
- [ ] Implementar selecao de backup
- [ ] Implementar confirmacao de restauracao
- [ ] Criar backup de seguranca antes de restaurar
- [ ] Implementar substituicao do banco
- [ ] Exibir feedback de sucesso/erro

### Auto-recuperacao
- [ ] Detectar corrupcao ao iniciar
- [ ] Buscar backup mais recente valido
- [ ] Restaurar automaticamente
- [ ] Notificar usuario sobre recuperacao
- [ ] Tratar caso sem backup disponivel

### Extras
- [ ] Implementar criacao de banco vazio
- [ ] Implementar scripts de backup (opcional)
- [ ] Testar todos os cenarios
- [ ] Documentar procedimentos para usuario
