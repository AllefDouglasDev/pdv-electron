# FuxoDeCaixa - Documentacao de Features

Sistema de Fluxo de Caixa para gerenciamento de vendas, estoque e relatorios financeiros.

## Indice de Documentacao

| Arquivo | Descricao |
|---------|-----------|
| [01-autenticacao.md](./01-autenticacao.md) | Sistema de login e sessao |
| [02-gestao-usuarios.md](./02-gestao-usuarios.md) | CRUD de usuarios e permissoes |
| [03-gestao-produtos.md](./03-gestao-produtos.md) | Cadastro de produtos |
| [04-ponto-de-venda.md](./04-ponto-de-venda.md) | Tela de vendas (PDV) |
| [05-controle-estoque.md](./05-controle-estoque.md) | Listagem e edicao de estoque |
| [06-relatorios.md](./06-relatorios.md) | Relatorios de vendas |
| [07-backup-resiliencia.md](./07-backup-resiliencia.md) | Backup e recuperacao |
| [08-modelo-dados.md](./08-modelo-dados.md) | Schema do banco de dados |
| [09-calculos-negocio.md](./09-calculos-negocio.md) | Formulas e regras |
| [10-impressao-cupom.md](./10-impressao-cupom.md) | Impressao de cupom fiscal |
| [11-seguranca.md](./11-seguranca.md) | Recomendacoes de seguranca |

---

## Requisitos Obrigatorios

- **Banco de Dados**: SQLite (arquivo local)
- **Backup**: Sistema automatico e manual, nunca perder dados
- **Resiliencia**: Recuperacao automatica em caso de falha
- **Interface**: Simples e funcional

---

## Checklist de Implementacao

### Autenticacao
- [ ] Tela de login com campos usuario e senha
- [ ] Validacao de campos obrigatorios
- [ ] Verificacao de credenciais no banco (senha com hash)
- [ ] Criacao de sessao do usuario logado
- [ ] Navegacao para tela principal apos login
- [ ] Mensagens de erro claras para credenciais invalidas

### Gestao de Usuarios
- [ ] Tela de listagem de usuarios (apenas Admin)
- [ ] Formulario de criacao de usuario
- [ ] Formulario de edicao de usuario
- [ ] Exclusao de usuario (com confirmacao)
- [ ] Atribuicao de roles (Admin, Gerente, Operador)
- [ ] Primeiro usuario criado automaticamente como Admin
- [ ] Validacao de duplicidade de username

### Gestao de Produtos
- [ ] Tela de cadastro de produto
- [ ] Campo: Nome do produto (obrigatorio)
- [ ] Campo: Valor de compra (obrigatorio, decimal)
- [ ] Campo: Margem de lucro % (obrigatorio, inteiro)
- [ ] Campo: Quantidade inicial (obrigatorio, inteiro)
- [ ] Campo: Codigo de barras (obrigatorio, unico)
- [ ] Calculo automatico do preco de venda
- [ ] Validacao de campos obrigatorios
- [ ] Validacao de codigo duplicado
- [ ] Feedback visual de sucesso/erro
- [ ] Limpeza do formulario apos cadastro

### Ponto de Venda (PDV)
- [ ] Campo de entrada para codigo de barras
- [ ] Suporte a leitor de codigo de barras (scanner)
- [ ] Adicao de produto via tecla ENTER
- [ ] Busca de produto por codigo no banco
- [ ] Verificacao de estoque disponivel
- [ ] Tabela/lista do carrinho de compras
- [ ] Colunas: Nome, Codigo, Quantidade, Valor Unitario, Subtotal
- [ ] Incremento automatico de quantidade para produto duplicado
- [ ] Edicao manual de quantidade de item
- [ ] Remocao de item do carrinho
- [ ] Calculo automatico do total da venda
- [ ] Campo para valor pago pelo cliente
- [ ] Calculo e exibicao do troco
- [ ] Funcionalidade de desconto percentual
- [ ] Botao de finalizar venda
- [ ] Baixa automatica no estoque
- [ ] Registro da venda no banco
- [ ] Impressao de cupom fiscal
- [ ] Limpeza do carrinho apos finalizacao
- [ ] Relogio em tempo real na tela
- [ ] Alerta de estoque baixo (quantidade <= 5)
- [ ] Mensagem quando produto sem estoque

### Controle de Estoque
- [ ] Tela de listagem de produtos
- [ ] Tabela com colunas: Nome, Codigo, Quantidade, Preco Venda
- [ ] Paginacao (20 produtos por pagina)
- [ ] Campo de busca por codigo de barras
- [ ] Busca ao pressionar ENTER
- [ ] Selecao de produto para edicao
- [ ] Formulario de edicao com todos os campos
- [ ] Recalculo automatico do preco ao editar margem
- [ ] Botao de salvar alteracoes
- [ ] Feedback de sucesso/erro
- [ ] Atualizacao da lista apos edicao

### Relatorios
- [ ] Tela de visualizacao de vendas do dia
- [ ] Tabela com colunas: Valor Investido, Valor Venda, Lucro, Data/Hora
- [ ] Calculo do lucro por item
- [ ] Totalizadores (total investido, total vendido, lucro total)
- [ ] Botao de fechamento de caixa
- [ ] Confirmacao antes do fechamento
- [ ] Limpeza da tabela de vendas apos fechamento
- [ ] Relogio em tempo real na tela
- [ ] Permissao apenas para Admin e Gerente

### Banco de Dados e Backup
- [ ] Configuracao do SQLite
- [ ] Criacao automatica das tabelas no primeiro uso
- [ ] Backup automatico ao iniciar o sistema
- [ ] Backup manual via interface
- [ ] Pasta de backups com timestamp
- [ ] Retencao dos ultimos 30 backups automaticos
- [ ] Funcionalidade de restauracao de backup
- [ ] Recuperacao automatica se banco corrompido
- [ ] Verificacao de integridade do banco

### Impressao de Cupom
- [ ] Formatacao para impressora termica
- [ ] Cabecalho com nome da loja
- [ ] Lista de produtos vendidos
- [ ] Nome do produto (truncado se necessario)
- [ ] Quantidade e valor unitario
- [ ] Subtotal por item
- [ ] Total geral formatado (R$)
- [ ] Data e hora da venda
- [ ] Mensagem de agradecimento
- [ ] Integracao com impressora do sistema

### Seguranca
- [ ] Hash de senha (bcrypt ou similar)
- [ ] Validacao de inputs (prevencao SQL injection)
- [ ] Uso de prepared statements
- [ ] Sessao segura do usuario
- [ ] Timeout de sessao por inatividade
- [ ] Log de acoes criticas (vendas, alteracoes)
- [ ] Controle de acesso por role

---

## Matriz de Permissoes

| Funcionalidade | Admin | Gerente | Operador |
|----------------|-------|---------|----------|
| Login | Sim | Sim | Sim |
| Gestao de Usuarios | Sim | Nao | Nao |
| Cadastro de Produtos | Sim | Sim | Nao |
| Edicao de Produtos | Sim | Sim | Nao |
| Consulta de Estoque | Sim | Sim | Sim |
| PDV (Vendas) | Sim | Sim | Sim |
| Relatorios | Sim | Sim | Nao |
| Fechamento de Caixa | Sim | Sim | Nao |
| Backup Manual | Sim | Nao | Nao |
| Restauracao de Backup | Sim | Nao | Nao |

---

## Fluxo de Navegacao

```
[Login]
    |
    v
[Tela Principal / Dashboard]
    |
    +---> [Gestao de Usuarios] (Admin)
    |
    +---> [Cadastrar Produto] (Admin, Gerente)
    |
    +---> [Listar/Editar Produtos] (Todos*)
    |
    +---> [PDV - Vendas] (Todos)
    |
    +---> [Relatorios] (Admin, Gerente)

* Operador: apenas consulta
```

---

## Tecnologias Recomendadas

### Obrigatorio
- **SQLite**: Banco de dados local (arquivo unico)

### Sugerido (flexivel)
- Framework de UI: Electron, React, Vue, ou similar
- Linguagem: JavaScript/TypeScript, ou outra de preferencia
- Biblioteca de hash: bcrypt, argon2, ou similar
- Biblioteca de impressao: conforme framework escolhido

---

## Observacoes Importantes

1. **Backup e dados**: O sistema DEVE garantir que os dados do usuario nunca sejam perdidos. Backups automaticos sao obrigatorios.

2. **Offline-first**: O sistema deve funcionar 100% offline, sem dependencia de internet.

3. **SQLite obrigatorio**: Nao substituir por outro banco de dados.

4. **Interface simples**: Manter a simplicidade da interface atual, apenas melhorando a aparencia visual.

5. **Compatibilidade**: Considerar execucao em Windows (principal), mas manter compatibilidade com macOS e Linux se possivel.
