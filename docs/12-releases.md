# Guia de Releases

Este documento explica como criar novas releases do FuxoDeCaixa.

## Como Funciona

O projeto usa **GitHub Actions** para automatizar o processo de build e release. Quando você cria uma tag com o prefixo `v` (ex: `v1.0.0`), o workflow automaticamente:

1. Compila o aplicativo para Windows, macOS e Linux
2. Gera os instaladores/executáveis
3. Cria uma Release no GitHub com os arquivos para download

## Criando uma Nova Release

### Passo 1: Atualizar a Versão

Edite o `package.json` e atualize o campo `version`:

```json
{
  "version": "1.1.0"
}
```

### Passo 2: Commit das Alterações

```bash
git add package.json
git commit -m "chore: bump version to 1.1.0"
git push origin main
```

### Passo 3: Criar e Enviar a Tag

```bash
# Criar a tag localmente
git tag -a v1.1.0 -m "Release v1.1.0 - Descrição das mudanças"

# Enviar a tag para o GitHub
git push origin v1.1.0
```

### Passo 4: Acompanhar o Build

1. Acesse: https://github.com/AllefDouglasDev/pdv-electron/actions
2. Clique no workflow em execução para acompanhar o progresso
3. Aguarde a conclusão (pode levar 10-20 minutos)

### Passo 5: Verificar a Release

1. Acesse: https://github.com/AllefDouglasDev/pdv-electron/releases
2. A nova release estará disponível com os arquivos:
   - Windows: `.exe` (instalador NSIS)
   - macOS: `.dmg`
   - Linux: `.AppImage` e `.deb`

## Versionamento Semântico

Siga o padrão [SemVer](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Mudanças incompatíveis
- **MINOR** (1.0.0 → 1.1.0): Novas funcionalidades compatíveis
- **PATCH** (1.0.0 → 1.0.1): Correções de bugs

## Comandos Úteis

```bash
# Listar todas as tags
git tag -l

# Deletar tag local
git tag -d v1.0.0

# Deletar tag remota
git push origin --delete v1.0.0

# Ver detalhes de uma tag
git show v1.0.0
```

## Troubleshooting

### Build Falhou

1. Acesse a aba **Actions** no GitHub
2. Clique no workflow que falhou
3. Verifique os logs de erro
4. Corrija o problema, delete a tag e crie novamente

### Arquivos Não Aparecem na Release

- Verifique se o workflow completou com sucesso
- Os arquivos são enviados apenas para tags que começam com `v`

## Estrutura do Build

Os arquivos de build são configurados em:
- `.github/workflows/build.yml` - Workflow do GitHub Actions
- `package.json` (seção `build`) - Configurações do electron-builder
