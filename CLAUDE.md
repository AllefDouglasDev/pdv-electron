# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Progress

**IMPORTANT**: Check `tasks.md` for current development status before starting work. This file tracks:
- Which modules are completed, in progress, or pending
- Current stage and next steps
- Session history and context

Always update `tasks.md` after completing tasks or at the end of a session.

## Project Overview

FuxoDeCaixa is a Point of Sale (PDV) system for managing sales, inventory, and financial reports built with Electron.

## Development Commands

```bash
npm start          # Run the Electron application
npm test           # Run tests
```

## Language Conventions

**IMPORTANT**: This project follows strict language separation:

- **Code**: ALL code must be written in English (variables, functions, classes, comments, database tables/columns)
- **UI**: ALL user-facing text and messages must be in Brazilian Portuguese (PT-BR)

Examples:
```javascript
// CORRECT
const product = { name: 'Refrigerante', purchasePrice: 5.50 };
showMessage('Produto cadastrado com sucesso!');

// WRONG
const produto = { nome: 'Refrigerante', valorCompra: 5.50 };
showMessage('Product registered successfully!');
```

Database tables and columns must also be in English (e.g., `users`, `products`, `sales` instead of `usuarios`, `produtos`, `vendas`).

## Technical Requirements

- **Database**: SQLite only (file: `mercado.db`)
- **Operation Mode**: 100% offline, no internet dependency
- **Primary OS**: Windows (with macOS/Linux compatibility)
- **Framework**: Electron with vanilla JavaScript

## Project Structure

```
pdv/
├── docs/              # Feature specifications (PT-BR)
├── src/
│   ├── main/          # Electron main process
│   ├── preload/       # Preload scripts (context bridge)
│   └── renderer/      # Frontend (HTML, CSS, JS)
│       ├── scripts/
│       └── styles/
└── package.json
```

## Database Schema

Three main tables: `users`, `products`, `sales`. See `docs/08-modelo-dados.md` for complete DDL.

Key points:
- Use prepared statements for all queries (SQL injection prevention)
- Dates stored as TEXT in ISO 8601 format (`YYYY-MM-DD HH:MM:SS`)
- Foreign keys enabled with `PRAGMA foreign_keys = ON`
- Sales table intentionally denormalized to preserve historical data

## Business Logic

See `docs/09-calculos-negocio.md` for formulas. Key calculations:
- Sale price: `purchasePrice * (1 + profitMargin / 100)`
- All monetary values rounded to 2 decimal places
- Brazilian currency formatting with comma as decimal separator

## User Roles and Permissions

| Role | Access |
|------|--------|
| admin | Full access + user management + backup |
| manager | Products, sales, reports |
| operator | Sales only |

## Backup Requirements

Backup is critical - see `docs/07-backup-resiliencia.md`:
- Automatic backup on system startup
- Manual backup via interface (admin only)
- Keep last 30 automatic backups
- Auto-recovery if database is corrupted

## Documentation Index

All feature specifications are in `/docs/` (written in PT-BR):
- `01-autenticacao.md` - Login and session
- `02-gestao-usuarios.md` - User CRUD
- `03-gestao-produtos.md` - Product registration
- `04-ponto-de-venda.md` - Sales screen (PDV)
- `05-controle-estoque.md` - Stock management
- `06-relatorios.md` - Sales reports
- `07-backup-resiliencia.md` - Backup and recovery
- `08-modelo-dados.md` - Database schema
- `09-calculos-negocio.md` - Business formulas
- `10-impressao-cupom.md` - Receipt printing
- `11-seguranca.md` - Security recommendations
