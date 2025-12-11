# 02 - Gestao de Usuarios

Sistema de CRUD (Criar, Ler, Atualizar, Deletar) de usuarios com controle de permissoes.

## Visao Geral

Esta funcionalidade permite ao administrador gerenciar os usuarios do sistema, definindo quem pode acessar e quais permissoes cada usuario possui. Apenas usuarios com role "Admin" podem acessar esta tela.

**Nota**: Esta e uma funcionalidade NOVA que nao existe no sistema Java original. Foi adicionada conforme solicitacao do usuario.

---

## Roles (Perfis de Acesso)

### Admin (Administrador)
- Acesso total ao sistema
- Unico que pode gerenciar usuarios
- Pode fazer backup e restauracao
- Pode acessar todas as funcionalidades

### Gerente
- Cadastro e edicao de produtos
- Acesso ao PDV (vendas)
- Acesso aos relatorios
- Nao pode gerenciar usuarios
- Nao pode fazer backup/restauracao

### Operador
- Acesso apenas ao PDV (vendas)
- Consulta de estoque (somente leitura)
- Nao pode cadastrar/editar produtos
- Nao pode acessar relatorios
- Nao pode gerenciar usuarios

---

## Tela de Listagem de Usuarios

### Layout

```
+================================================================+
|  [<- Voltar]                 Gestao de Usuarios                |
+================================================================+
|                                                                |
|  [+ Novo Usuario]                          [Buscar: _______]   |
|                                                                |
|  +----------------------------------------------------------+  |
|  | Usuario    | Nome Completo | Perfil    | Status | Acoes  |  |
|  +----------------------------------------------------------+  |
|  | admin      | Administrador | Admin     | Ativo  | [E][X] |  |
|  | maria      | Maria Silva   | Gerente   | Ativo  | [E][X] |  |
|  | joao       | Joao Santos   | Operador  | Ativo  | [E][X] |  |
|  | pedro      | Pedro Lima    | Operador  | Inativo| [E][X] |  |
|  +----------------------------------------------------------+  |
|                                                                |
|  Mostrando 4 de 4 usuarios                                     |
|                                                                |
+================================================================+
```

### Componentes

| Componente | Descricao |
|------------|-----------|
| Botao Voltar | Retorna a tela principal |
| Botao Novo Usuario | Abre formulario de criacao |
| Campo Buscar | Filtra usuarios por nome ou username |
| Tabela | Lista todos os usuarios |
| Botao Editar [E] | Abre formulario de edicao |
| Botao Excluir [X] | Inicia processo de exclusao |

### Colunas da Tabela

| Coluna | Descricao |
|--------|-----------|
| Usuario | Username de login |
| Nome Completo | Nome para exibicao |
| Perfil | Role do usuario (Admin, Gerente, Operador) |
| Status | Ativo ou Inativo |
| Acoes | Botoes de editar e excluir |

---

## Tela de Criar/Editar Usuario

### Layout

```
+================================================+
|  [X]           Novo Usuario / Editar Usuario   |
+================================================+
|                                                |
|  Usuario *                                     |
|  +------------------------------------------+  |
|  | joao.silva                               |  |
|  +------------------------------------------+  |
|  (Apenas letras, numeros e underscore)         |
|                                                |
|  Nome Completo *                               |
|  +------------------------------------------+  |
|  | Joao da Silva                            |  |
|  +------------------------------------------+  |
|                                                |
|  Senha *                                       |
|  +------------------------------------------+  |
|  | ********                                 |  |
|  +------------------------------------------+  |
|  (Minimo 4 caracteres)                         |
|                                                |
|  Confirmar Senha *                             |
|  +------------------------------------------+  |
|  | ********                                 |  |
|  +------------------------------------------+  |
|                                                |
|  Perfil *                                      |
|  +------------------------------------------+  |
|  | [v] Operador                             |  |
|  +------------------------------------------+  |
|      ( ) Admin                                 |
|      ( ) Gerente                               |
|      (x) Operador                              |
|                                                |
|  Status                                        |
|  [x] Usuario ativo                             |
|                                                |
|  +------------------+  +------------------+    |
|  |    Cancelar     |  |     Salvar       |    |
|  +------------------+  +------------------+    |
|                                                |
+================================================+
```

### Campos do Formulario

| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| Usuario | texto | sim | 3-50 caracteres, unico, alfanumerico + underscore |
| Nome Completo | texto | sim | 2-100 caracteres |
| Senha | password | sim (criar) | minimo 4 caracteres |
| Confirmar Senha | password | sim (criar) | deve ser igual a Senha |
| Perfil | select | sim | Admin, Gerente ou Operador |
| Status | checkbox | nao | padrao: ativo |

### Regras de Edicao

- **Usuario**: Nao pode ser alterado apos criacao
- **Senha**: Opcional na edicao (deixar vazio para manter)
- **Perfil Admin**: Deve haver pelo menos 1 admin ativo no sistema
- **Auto-exclusao**: Usuario nao pode excluir a si mesmo
- **Auto-inativacao**: Usuario nao pode se desativar

---

## Fluxos de Operacao

### Fluxo: Criar Usuario

```
[Clica "Novo Usuario"]
         |
         v
[Abre formulario vazio]
         |
         v
[Preenche campos]
         |
         v
[Clica "Salvar"]
         |
         v
[Validacao Frontend]
    |         |
   Erro      OK
    |         |
    v         v
[Mostra    [Verifica username unico]
 erros]         |
            |       |
          Existe   Novo
            |       |
            v       v
        [Erro:   [Gera hash da senha]
        ja existe]   |
                     v
               [Insere no banco]
                     |
                     v
               [Atualiza lista]
                     |
                     v
               [Fecha formulario]
```

### Fluxo: Editar Usuario

```
[Clica botao Editar na linha]
         |
         v
[Abre formulario com dados]
         |
         v
[Altera campos desejados]
         |
         v
[Clica "Salvar"]
         |
         v
[Validacao Frontend]
         |
         v
[Se senha preenchida: gera novo hash]
         |
         v
[Atualiza no banco]
         |
         v
[Atualiza lista]
         |
         v
[Fecha formulario]
```

### Fluxo: Excluir Usuario

```
[Clica botao Excluir na linha]
         |
         v
[Verifica se e o proprio usuario]
    |              |
   Sim            Nao
    |              |
    v              v
[Erro:         [Confirma exclusao?]
nao pode]          |
               |       |
              Nao     Sim
               |       |
               v       v
           [Cancela] [Verifica se e ultimo admin]
                          |
                      |       |
                     Sim     Nao
                      |       |
                      v       v
                  [Erro:  [Exclui do banco]
                  ultimo]      |
                               v
                         [Atualiza lista]
```

---

## Validacoes

### Validacoes de Frontend

| Campo | Regra | Mensagem |
|-------|-------|----------|
| Usuario | Obrigatorio | "Informe o usuario" |
| Usuario | Min 3 caracteres | "Usuario muito curto" |
| Usuario | Max 50 caracteres | "Usuario muito longo" |
| Usuario | Apenas alfanumerico | "Usuario invalido" |
| Nome | Obrigatorio | "Informe o nome" |
| Nome | Min 2 caracteres | "Nome muito curto" |
| Senha | Obrigatorio (criar) | "Informe a senha" |
| Senha | Min 4 caracteres | "Senha muito curta" |
| Confirmar | Igual a Senha | "Senhas nao conferem" |
| Perfil | Obrigatorio | "Selecione um perfil" |

### Validacoes de Backend

| Regra | Mensagem |
|-------|----------|
| Username duplicado | "Este usuario ja existe" |
| Ultimo admin | "Deve haver pelo menos um administrador" |
| Auto-exclusao | "Voce nao pode excluir seu proprio usuario" |
| Auto-inativacao | "Voce nao pode desativar seu proprio usuario" |

---

## Consultas SQL

### Listar Usuarios

```sql
SELECT id, username, full_name, role, is_active, created_at, updated_at
FROM users
ORDER BY username ASC
```

### Buscar Usuario por ID

```sql
SELECT id, username, full_name, role, is_active
FROM users
WHERE id = ?
```

### Verificar Username Existe

```sql
SELECT COUNT(*) as count
FROM users
WHERE username = ?
AND id != ?  -- Excluir proprio registro na edicao
```

### Criar Usuario

```sql
INSERT INTO users (username, full_name, password_hash, role, is_active, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
```

### Atualizar Usuario (com senha)

```sql
UPDATE users
SET full_name = ?,
    password_hash = ?,
    role = ?,
    is_active = ?,
    updated_at = datetime('now')
WHERE id = ?
```

### Atualizar Usuario (sem senha)

```sql
UPDATE users
SET full_name = ?,
    role = ?,
    is_active = ?,
    updated_at = datetime('now')
WHERE id = ?
```

### Excluir Usuario

```sql
DELETE FROM users
WHERE id = ?
```

### Contar Admins Ativos

```sql
SELECT COUNT(*) as count
FROM users
WHERE role = 'admin'
AND is_active = 1
```

---

## Controle de Acesso

### Verificacao de Permissao

Ao acessar esta tela, verificar:

```
SE sessao.role != 'admin' ENTAO
    Exibir mensagem: "Acesso negado"
    Redirecionar para tela principal
FIM SE
```

### Navegacao

- Botao/menu para acessar Gestao de Usuarios deve ser visivel apenas para Admin
- URL/rota deve validar permissao no backend

---

## Interface do Usuario

### Feedback Visual

| Acao | Feedback |
|------|----------|
| Criar com sucesso | Toast verde: "Usuario criado com sucesso" |
| Editar com sucesso | Toast verde: "Usuario atualizado com sucesso" |
| Excluir com sucesso | Toast verde: "Usuario excluido com sucesso" |
| Erro de validacao | Campos com borda vermelha + mensagem |
| Erro de sistema | Toast vermelho: "Erro ao processar. Tente novamente" |

### Confirmacao de Exclusao

```
+------------------------------------------+
|           Confirmar Exclusao             |
+------------------------------------------+
|                                          |
|  Deseja realmente excluir o usuario      |
|  "joao.silva"?                           |
|                                          |
|  Esta acao nao pode ser desfeita.        |
|                                          |
|  +----------------+  +----------------+  |
|  |   Cancelar    |  |    Excluir    |  |
|  +----------------+  +----------------+  |
|                                          |
+------------------------------------------+
```

---

## Primeiro Acesso

### Usuario Admin Padrao

Quando o sistema e iniciado pela primeira vez:

1. Verificar se existe algum usuario na tabela
2. Se nao existir, criar usuario padrao:

```sql
INSERT INTO users (username, full_name, password_hash, role, is_active, created_at, updated_at)
VALUES ('admin', 'Administrador', '<hash_de_admin>', 'admin', 1, datetime('now'), datetime('now'))
```

**Senha padrao**: `admin` (deve ser alterada no primeiro acesso)

### Fluxo de Primeiro Login

1. Usuario faz login como admin/admin
2. Sistema detecta que e primeiro login
3. Redireciona para tela de alteracao de senha obrigatoria
4. Usuario define nova senha
5. Sistema atualiza e continua normalmente

---

## Status do Usuario

### Ativo
- Pode fazer login normalmente
- Aparece na lista com status "Ativo"

### Inativo
- Nao pode fazer login (credenciais rejeitadas)
- Aparece na lista com status "Inativo"
- Dados sao mantidos para historico
- Pode ser reativado pelo admin

---

## Auditoria (Opcional)

Para maior controle, registrar:

- Data/hora de criacao do usuario
- Data/hora de ultima alteracao
- Usuario que fez a alteracao
- Historico de alteracoes de role

Ver detalhes em 11-seguranca.md

---

## Checklist de Implementacao

- [ ] Criar tela de listagem de usuarios
- [ ] Implementar tabela com paginacao
- [ ] Criar formulario de novo usuario
- [ ] Criar formulario de edicao de usuario
- [ ] Implementar validacoes de frontend
- [ ] Implementar validacoes de backend
- [ ] Implementar hash de senha na criacao
- [ ] Implementar atualizacao de senha opcional
- [ ] Implementar exclusao com confirmacao
- [ ] Validar pelo menos 1 admin ativo
- [ ] Impedir auto-exclusao
- [ ] Impedir auto-inativacao
- [ ] Criar usuario admin padrao no primeiro acesso
- [ ] Implementar controle de acesso a tela
- [ ] Adicionar feedback visual (toasts)
- [ ] Testar todos os fluxos
- [ ] Testar validacoes
- [ ] Testar restricoes de admin
