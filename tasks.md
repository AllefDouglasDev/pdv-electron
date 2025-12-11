# FuxoDeCaixa - Progresso de Desenvolvimento

Este arquivo rastreia o progresso de implementação de cada módulo do sistema.
Use este arquivo para continuar o desenvolvimento em novas sessões do Claude.

---

## Status Geral

| Módulo | Status | Progresso |
|--------|--------|-----------|
| 00 - Setup Inicial | Em Progresso | 40% |
| 01 - Autenticação | Não Iniciado | 0% |
| 02 - Gestão de Usuários | Não Iniciado | 0% |
| 03 - Gestão de Produtos | Não Iniciado | 0% |
| 04 - Ponto de Venda (PDV) | Não Iniciado | 0% |
| 05 - Controle de Estoque | Não Iniciado | 0% |
| 06 - Relatórios | Não Iniciado | 0% |
| 07 - Backup e Resiliência | Não Iniciado | 0% |
| 08 - Banco de Dados | Não Iniciado | 0% |
| 09 - Cálculos de Negócio | Não Iniciado | 0% |
| 10 - Impressão de Cupom | Não Iniciado | 0% |
| 11 - Segurança | Não Iniciado | 0% |

---

## Estágio Atual

**Módulo em Desenvolvimento:** 00 - Setup Inicial
**Próximo Passo:** Configurar estrutura do banco de dados (Módulo 08)

---

## 00 - Setup Inicial

Configuração base do projeto Electron.

### Tarefas
- [x] Inicializar projeto npm
- [x] Instalar Electron
- [x] Instalar better-sqlite3
- [x] Instalar bcrypt
- [x] Criar estrutura de diretórios (src/main, src/preload, src/renderer)
- [x] Criar main.js (processo principal)
- [x] Criar preload.js (context bridge)
- [x] Criar index.html básico
- [x] Criar arquivos CSS e JS base
- [x] Criar .gitignore
- [x] Atualizar CLAUDE.md com convenções
- [ ] Rebuild de módulos nativos para Electron (electron-rebuild)
- [ ] Testar execução do app (`npm start`)

### Arquivos Criados
- `package.json`
- `src/main/main.js`
- `src/preload/preload.js`
- `src/renderer/index.html`
- `src/renderer/styles/main.css`
- `src/renderer/scripts/renderer.js`
- `.gitignore`
- `CLAUDE.md`

---

## 08 - Banco de Dados

Schema SQLite e inicialização. **Deve ser implementado antes dos outros módulos.**

### Tarefas
- [ ] Criar módulo de conexão com SQLite (`src/main/database/connection.js`)
- [ ] Criar schema das tabelas em inglês (`users`, `products`, `sales`)
- [ ] Criar script de inicialização do banco
- [ ] Criar usuário admin padrão (senha: admin)
- [ ] Implementar PRAGMA foreign_keys = ON
- [ ] Criar índices para otimização
- [ ] Testar criação automática do banco

### Arquivos a Criar
- `src/main/database/connection.js`
- `src/main/database/schema.js`
- `src/main/database/seed.js`

---

## 01 - Autenticação

Sistema de login e sessão. Docs: `docs/01-autenticacao.md`

### Tarefas
- [ ] Criar tela de login (HTML/CSS)
- [ ] Implementar validação de campos obrigatórios
- [ ] Criar IPC handlers para autenticação
- [ ] Implementar verificação de credenciais com bcrypt
- [ ] Criar sistema de sessão no processo principal
- [ ] Implementar navegação para tela principal após login
- [ ] Adicionar mensagens de erro em PT-BR

### Arquivos a Criar
- `src/renderer/pages/login.html`
- `src/renderer/styles/login.css`
- `src/renderer/scripts/login.js`
- `src/main/services/auth.js`

---

## 02 - Gestão de Usuários

CRUD de usuários. Docs: `docs/02-gestao-usuarios.md`

### Tarefas
- [ ] Criar tela de listagem de usuários
- [ ] Implementar formulário de criação
- [ ] Implementar formulário de edição
- [ ] Implementar exclusão com confirmação
- [ ] Adicionar seletor de roles (Admin, Gerente, Operador)
- [ ] Validar duplicidade de username
- [ ] Restringir acesso apenas para Admin

### Arquivos a Criar
- `src/renderer/pages/users.html`
- `src/renderer/styles/users.css`
- `src/renderer/scripts/users.js`
- `src/main/services/users.js`

---

## 03 - Gestão de Produtos

Cadastro de produtos. Docs: `docs/03-gestao-produtos.md`

### Tarefas
- [ ] Criar tela de cadastro de produto
- [ ] Implementar campos: nome, valor compra, margem, quantidade, código barras
- [ ] Calcular preço de venda automaticamente
- [ ] Validar campos obrigatórios
- [ ] Validar código de barras único
- [ ] Implementar feedback visual
- [ ] Limpar formulário após cadastro

### Arquivos a Criar
- `src/renderer/pages/products.html`
- `src/renderer/styles/products.css`
- `src/renderer/scripts/products.js`
- `src/main/services/products.js`

---

## 04 - Ponto de Venda (PDV)

Tela de vendas. Docs: `docs/04-ponto-de-venda.md`

### Tarefas
- [ ] Criar tela do PDV
- [ ] Implementar campo de código de barras com suporte a scanner
- [ ] Criar tabela do carrinho de compras
- [ ] Implementar adição/remoção de itens
- [ ] Implementar edição de quantidade
- [ ] Calcular total automaticamente
- [ ] Implementar campo de valor pago e troco
- [ ] Implementar desconto percentual
- [ ] Implementar finalização de venda
- [ ] Baixar estoque automaticamente
- [ ] Registrar venda no banco
- [ ] Adicionar relógio em tempo real
- [ ] Alertar estoque baixo (<=5)

### Arquivos a Criar
- `src/renderer/pages/pdv.html`
- `src/renderer/styles/pdv.css`
- `src/renderer/scripts/pdv.js`
- `src/main/services/sales.js`
- `src/main/services/cart.js`

---

## 05 - Controle de Estoque

Listagem e edição de estoque. Docs: `docs/05-controle-estoque.md`

### Tarefas
- [ ] Criar tela de listagem de produtos
- [ ] Implementar tabela com paginação (20/página)
- [ ] Implementar busca por código de barras
- [ ] Implementar seleção para edição
- [ ] Criar formulário de edição
- [ ] Recalcular preço ao editar margem
- [ ] Implementar feedback de sucesso/erro

### Arquivos a Criar
- `src/renderer/pages/stock.html`
- `src/renderer/styles/stock.css`
- `src/renderer/scripts/stock.js`

---

## 06 - Relatórios

Relatórios de vendas. Docs: `docs/06-relatorios.md`

### Tarefas
- [ ] Criar tela de relatórios
- [ ] Implementar tabela de vendas do dia
- [ ] Calcular lucro por item
- [ ] Implementar totalizadores
- [ ] Implementar fechamento de caixa
- [ ] Adicionar confirmação antes do fechamento
- [ ] Limpar vendas após fechamento
- [ ] Adicionar relógio em tempo real
- [ ] Restringir acesso (Admin, Gerente)

### Arquivos a Criar
- `src/renderer/pages/reports.html`
- `src/renderer/styles/reports.css`
- `src/renderer/scripts/reports.js`
- `src/main/services/reports.js`

---

## 07 - Backup e Resiliência

Sistema de backup. Docs: `docs/07-backup-resiliencia.md`

### Tarefas
- [ ] Criar módulo de backup
- [ ] Implementar backup automático ao iniciar
- [ ] Implementar backup manual (Admin)
- [ ] Criar pasta de backups com timestamp
- [ ] Manter últimos 30 backups
- [ ] Implementar restauração de backup
- [ ] Implementar recuperação automática se corrompido
- [ ] Verificar integridade do banco

### Arquivos a Criar
- `src/main/services/backup.js`
- `src/main/services/recovery.js`

---

## 09 - Cálculos de Negócio

Funções de cálculo. Docs: `docs/09-calculos-negocio.md`

### Tarefas
- [ ] Criar módulo de cálculos
- [ ] Implementar cálculo de preço de venda
- [ ] Implementar cálculo de subtotal
- [ ] Implementar cálculo de total
- [ ] Implementar cálculo de troco
- [ ] Implementar aplicação de desconto
- [ ] Implementar cálculo de lucro
- [ ] Implementar formatação de moeda (R$)
- [ ] Implementar arredondamento (2 casas)
- [ ] Implementar conversão vírgula/ponto

### Arquivos a Criar
- `src/shared/calculations.js`
- `src/shared/formatters.js`

---

## 10 - Impressão de Cupom

Cupom fiscal. Docs: `docs/10-impressao-cupom.md`

### Tarefas
- [ ] Criar módulo de impressão
- [ ] Formatar para impressora térmica (80mm)
- [ ] Incluir cabeçalho com nome da loja
- [ ] Listar produtos vendidos
- [ ] Incluir total, data/hora
- [ ] Incluir mensagem de agradecimento
- [ ] Integrar com impressora do sistema

### Arquivos a Criar
- `src/main/services/printer.js`
- `src/main/services/receipt.js`

---

## 11 - Segurança

Implementações de segurança. Docs: `docs/11-seguranca.md`

### Tarefas
- [ ] Hash de senha com bcrypt (já instalado)
- [ ] Usar prepared statements em todas as queries
- [ ] Implementar timeout de sessão
- [ ] Implementar log de ações críticas
- [ ] Implementar controle de acesso por role

### Arquivos a Criar
- `src/main/services/logger.js`
- `src/main/middleware/auth.js`

---

## Ordem de Implementação Recomendada

1. **00 - Setup Inicial** (finalizar)
2. **08 - Banco de Dados** (base para tudo)
3. **09 - Cálculos de Negócio** (utilitários)
4. **11 - Segurança** (bcrypt, prepared statements)
5. **01 - Autenticação** (login)
6. **02 - Gestão de Usuários** (CRUD usuários)
7. **03 - Gestão de Produtos** (CRUD produtos)
8. **05 - Controle de Estoque** (listagem/edição)
9. **04 - Ponto de Venda** (core do sistema)
10. **06 - Relatórios** (visualização)
11. **07 - Backup e Resiliência** (proteção de dados)
12. **10 - Impressão de Cupom** (finalização)

---

## Histórico de Sessões

### Sessão 1 - 2024-12-11
- Criado projeto Electron
- Instaladas dependências (electron, better-sqlite3, bcrypt)
- Criada estrutura base de diretórios
- Criados arquivos iniciais (main.js, preload.js, index.html)
- Atualizado CLAUDE.md com convenções de idioma
- Criado este arquivo tasks.md

**Próximos passos:** Finalizar setup (electron-rebuild) e iniciar Módulo 08 (Banco de Dados)
