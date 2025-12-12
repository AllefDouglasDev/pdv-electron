# FuxoDeCaixa

Sistema de Ponto de Venda (PDV) completo para gerenciamento de vendas, estoque e relatórios financeiros. Desenvolvido com Electron para operação 100% offline.

## Funcionalidades

- **Autenticação** - Sistema de login com controle de sessão e níveis de acesso
- **Gestão de Usuários** - CRUD completo com permissões por cargo (admin, gerente, operador)
- **Gestão de Produtos** - Cadastro com código de barras, preços e margem de lucro
- **Ponto de Venda (PDV)** - Interface de vendas com múltiplas formas de pagamento
- **Controle de Estoque** - Monitoramento de níveis e alertas de estoque baixo
- **Relatórios** - Vendas diárias, mensais e por período com exportação
- **Impressão de Cupom** - Geração de recibos para impressoras térmicas
- **Backup e Restauração** - Backup automático e manual com recuperação de dados
- **Segurança** - Timeout de sessão, log de atividades e proteção de dados

## Tecnologias

- **Electron** - Framework para aplicações desktop
- **SQLite** - Banco de dados local (better-sqlite3)
- **bcrypt** - Criptografia de senhas
- **Vanilla JavaScript** - Frontend sem frameworks

## Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/fuxodecaixa.git

# Entre no diretório
cd fuxodecaixa

# Instale as dependências
npm install

# Execute a aplicação
npm start
```

## Estrutura do Projeto

```
pdv/
├── docs/              # Especificações das funcionalidades
├── src/
│   ├── main/          # Processo principal do Electron
│   │   ├── database/  # Conexão e schema do banco
│   │   ├── services/  # Lógica de negócio
│   │   └── middleware/# Middlewares de autenticação
│   ├── preload/       # Scripts de preload (context bridge)
│   ├── renderer/      # Frontend
│   │   ├── pages/     # Páginas HTML
│   │   ├── scripts/   # JavaScript do frontend
│   │   └── styles/    # Arquivos CSS
│   └── shared/        # Utilitários compartilhados
└── package.json
```

## Níveis de Acesso

| Cargo | Permissões |
|-------|------------|
| Admin | Acesso total + gestão de usuários + backup |
| Gerente | Produtos, vendas e relatórios |
| Operador | Apenas vendas |

## Usuário Padrão

Na primeira execução, um usuário administrador é criado automaticamente:

- **Usuário:** admin
- **Senha:** admin123

> Recomenda-se alterar a senha após o primeiro acesso.

## Scripts Disponíveis

```bash
npm start    # Inicia a aplicação
npm test     # Executa os testes
```

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
