# 01 - Autenticacao

Sistema de login e gerenciamento de sessao do usuario.

## Visao Geral

A autenticacao e a primeira tela do sistema. O usuario deve informar suas credenciais (usuario e senha) para acessar as funcionalidades. Apos o login bem-sucedido, uma sessao e criada e mantida durante todo o uso do sistema.

## Tela de Login

### Layout

```
+------------------------------------------+
|                                          |
|           [Logo/Titulo do Sistema]       |
|              "FuxoDeCaixa"               |
|                                          |
|     +------------------------------+     |
|     |  Usuario:                    |     |
|     |  [________________________]  |     |
|     +------------------------------+     |
|                                          |
|     +------------------------------+     |
|     |  Senha:                      |     |
|     |  [________________________]  |     |
|     +------------------------------+     |
|                                          |
|           [    Entrar    ]               |
|                                          |
|     [Mensagem de erro aqui]              |
|                                          |
+------------------------------------------+
```

### Componentes

| Componente | Tipo | Descricao |
|------------|------|-----------|
| Logo/Titulo | Label/Imagem | Identificacao visual do sistema |
| Campo Usuario | Input Text | Campo para digitar o nome de usuario |
| Campo Senha | Input Password | Campo para digitar a senha (caracteres ocultos) |
| Botao Entrar | Button | Inicia o processo de autenticacao |
| Mensagem Erro | Label | Exibe mensagens de erro (inicialmente oculto) |

### Comportamento dos Campos

#### Campo Usuario
- Tipo: texto
- Obrigatorio: sim
- Tamanho maximo: 50 caracteres
- Caracteres permitidos: letras, numeros, underscore
- Trim automatico (remover espacos inicio/fim)
- Foco inicial ao abrir a tela

#### Campo Senha
- Tipo: password (caracteres ocultos como *)
- Obrigatorio: sim
- Tamanho minimo: 4 caracteres
- Tamanho maximo: 100 caracteres
- Nao aplicar trim (espacos sao validos em senha)

#### Botao Entrar
- Ativado via clique ou tecla ENTER em qualquer campo
- Desabilitado durante processamento (evitar duplo clique)
- Texto muda para "Aguarde..." durante processamento

---

## Fluxo de Autenticacao

### Diagrama

```
[Usuario preenche campos]
         |
         v
[Clica em Entrar ou ENTER]
         |
         v
[Validacao Frontend]
    |         |
   Erro      OK
    |         |
    v         v
[Mostra    [Consulta Banco]
 erro]          |
            |       |
          Erro     OK
            |       |
            v       v
        [Mostra  [Cria Sessao]
         erro]       |
                     v
               [Abre Tela Principal]
```

### Passo a Passo

1. **Usuario preenche os campos**
   - Digita usuario no primeiro campo
   - Digita senha no segundo campo

2. **Validacao Frontend** (antes de consultar banco)
   - Verificar se campo usuario nao esta vazio
   - Verificar se campo senha nao esta vazio
   - Se algum campo vazio: mostrar mensagem de erro

3. **Consulta ao Banco de Dados**
   - Buscar usuario pelo nome de usuario
   - Se nao encontrar: retornar erro generico
   - Se encontrar: comparar senha (hash)

4. **Verificacao de Senha**
   - Aplicar mesmo algoritmo de hash na senha digitada
   - Comparar hash gerado com hash armazenado
   - Se diferente: retornar erro generico

5. **Criacao de Sessao**
   - Armazenar dados do usuario logado em memoria
   - Dados da sessao: id, username, role, horario_login

6. **Navegacao**
   - Fechar tela de login
   - Abrir tela principal (Dashboard)

---

## Validacoes

### Validacao de Campos (Frontend)

| Campo | Regra | Mensagem de Erro |
|-------|-------|------------------|
| Usuario | Nao pode ser vazio | "Informe o usuario" |
| Usuario | Maximo 50 caracteres | "Usuario muito longo" |
| Senha | Nao pode ser vazio | "Informe a senha" |
| Senha | Minimo 4 caracteres | "Senha muito curta" |

### Validacao de Credenciais (Backend)

| Cenario | Mensagem de Erro |
|---------|------------------|
| Usuario nao existe | "Usuario ou senha invalidos" |
| Senha incorreta | "Usuario ou senha invalidos" |
| Erro de conexao | "Erro ao conectar. Tente novamente" |

**Importante**: Usar mensagem generica "Usuario ou senha invalidos" para nao revelar se o usuario existe ou nao (seguranca).

---

## Sessao do Usuario

### Dados Armazenados

```
Sessao {
    id: integer          // ID do usuario no banco
    username: string     // Nome de usuario
    role: string         // "admin", "gerente", "operador"
    login_time: datetime // Horario do login
}
```

### Gerenciamento de Sessao

- A sessao e criada apos login bem-sucedido
- A sessao e mantida em memoria durante execucao do app
- A sessao e destruida ao fechar o aplicativo
- A sessao pode ter timeout por inatividade (opcional, ver 11-seguranca.md)

### Acesso a Sessao

Qualquer tela pode acessar os dados da sessao para:
- Exibir nome do usuario logado
- Verificar permissoes (role) antes de exibir/habilitar funcionalidades
- Registrar acoes com o ID do usuario

---

## Consulta SQL

### Buscar Usuario por Username

```sql
SELECT id, username, password_hash, role, created_at
FROM users
WHERE username = ?
LIMIT 1
```

**Parametros:**
- `?` = username digitado pelo usuario (sanitizado)

**Retorno esperado:**
- 0 registros: usuario nao existe
- 1 registro: verificar senha

---

## Interface com o Usuario

### Estados da Tela

| Estado | Descricao |
|--------|-----------|
| Inicial | Campos vazios, botao habilitado, sem mensagem |
| Processando | Campos desabilitados, botao "Aguarde...", sem mensagem |
| Erro | Campos habilitados, botao habilitado, mensagem de erro visivel |
| Sucesso | Tela fecha, abre Dashboard |

### Cores e Estilos (Sugestao)

| Elemento | Cor/Estilo |
|----------|------------|
| Fundo | Claro (branco ou cinza claro) |
| Campos | Borda cinza, fundo branco |
| Botao | Destaque (azul ou verde) |
| Erro | Texto vermelho |
| Campo com erro | Borda vermelha |

---

## Primeiro Acesso

### Usuario Inicial

Na primeira execucao do sistema (banco de dados vazio), deve ser criado automaticamente um usuario administrador:

```
username: admin
password: admin (hash)
role: admin
```

### Fluxo de Primeiro Acesso

1. Sistema inicia
2. Verifica se tabela `users` existe
3. Se nao existe: cria tabela
4. Verifica se existe pelo menos 1 usuario
5. Se nao existe: cria usuario admin padrao
6. Exibe tela de login normalmente

**Recomendacao de Seguranca**: Solicitar troca de senha no primeiro login do admin (ver 11-seguranca.md)

---

## Tratamento de Erros

### Erros de Conexao

Se houver erro ao conectar com o banco:
1. Exibir mensagem: "Erro ao conectar com o banco de dados"
2. Oferecer botao "Tentar novamente"
3. Registrar erro em log (se implementado)

### Banco Corrompido

Se o banco estiver corrompido:
1. Sistema deve detectar automaticamente
2. Tentar restaurar ultimo backup valido
3. Se restauracao falhar: exibir mensagem e instrucoes
4. Ver detalhes em 07-backup-resiliencia.md

---

## Atalhos de Teclado

| Tecla | Acao |
|-------|------|
| ENTER | Submeter formulario (equivale a clicar Entrar) |
| TAB | Navegar entre campos |
| ESC | Fechar aplicativo (opcional, com confirmacao) |

---

## Acessibilidade

- Labels associados aos campos (for/id)
- Ordem de tabulacao logica (usuario -> senha -> botao)
- Mensagens de erro acessiveis (aria-live ou equivalente)
- Contraste adequado entre texto e fundo

---

## Mockup Detalhado

```
+============================================+
|                                            |
|            FuxoDeCaixa                     |
|        Sistema de Vendas                  |
|                                            |
|   +------------------------------------+   |
|   | Usuario                            |   |
|   | +--------------------------------+ |   |
|   | |                                | |   |
|   | +--------------------------------+ |   |
|   +------------------------------------+   |
|                                            |
|   +------------------------------------+   |
|   | Senha                              |   |
|   | +--------------------------------+ |   |
|   | | ********                       | |   |
|   | +--------------------------------+ |   |
|   +------------------------------------+   |
|                                            |
|        +------------------------+          |
|        |       Entrar          |          |
|        +------------------------+          |
|                                            |
|   [!] Usuario ou senha invalidos           |
|                                            |
+============================================+
```

---

## Checklist de Implementacao

- [ ] Criar tela de login com campos usuario e senha
- [ ] Implementar validacao de campos obrigatorios
- [ ] Implementar consulta ao banco de dados
- [ ] Implementar verificacao de senha com hash
- [ ] Criar estrutura de sessao do usuario
- [ ] Implementar navegacao para tela principal
- [ ] Criar usuario admin padrao no primeiro acesso
- [ ] Implementar tratamento de erros de conexao
- [ ] Adicionar atalhos de teclado (ENTER, TAB)
- [ ] Testar fluxo completo de login
- [ ] Testar mensagens de erro
- [ ] Testar primeiro acesso (usuario admin)
