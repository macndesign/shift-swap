# Contribuindo com o shift-swap

Obrigado pelo interesse em contribuir! Este guia cobre o fluxo prático — as convenções
de código (padrões de entidade, Result, testes, etc.) estão em [CLAUDE.md](./CLAUDE.md)
e a perspectiva de quem consome a lib está no [README.md](./README.md).

## Pré-requisitos

- [Bun](https://bun.sh) instalado (a versão usada no CI está fixada no
  [workflow de CI](./.github/workflows/ci.yml) via `oven-sh/setup-bun`).

## Passo a passo

### 1. Fork e clone

```bash
git clone git@github.com:<seu-usuário>/shift-swap.git
cd shift-swap
bun install
```

### 2. Crie uma branch

A partir de `master`, com um nome que descreva o tipo de mudança:

```bash
git checkout -b feat/nome-da-feature
# ou fix/..., docs/..., refactor/..., test/..., chore/...
```

### 3. Desenvolva seguindo o fluxo TDD do projeto

1. Escreva o teste primeiro (em `__tests__/`, ao lado do que está sendo testado) e rode
   `bun test` para confirmar que ele falha.
2. Implemente o mínimo necessário para o teste passar.
3. Siga as convenções de nomenclatura, camadas (`entities`/`ports`/`usecases`) e o
   padrão `Result` descritos em [CLAUDE.md](./CLAUDE.md) — vale a leitura antes de
   começar, principalmente se for adicionar uma entidade, use-case ou repositório novo.

Se a mudança adicionar algo que consumidores externos devem usar, não esqueça de
exportar em `src/index.ts`.

### 4. Verifique antes de abrir o PR

```bash
bun run lint                              # formatação + lint (Biome)
bun test                                  # suíte inteira
./node_modules/.bin/tsc.exe --noEmit      # type-check completo (inclui testes)
bun run build                             # confirma que o build real (ESM/CJS/.d.ts) funciona
```

Essas verificações são o que o CI também roda — rodá-las localmente evita idas e vindas
no PR. `bun run lint:fix`/`bun run format` corrigem automaticamente o que der.

Um hook de pre-commit (`simple-git-hooks` + `lint-staged`) já roda `biome check --write`
nos arquivos staged a cada commit, então a maior parte da formatação é resolvida sozinha.
Ele é instalado automaticamente no `bun install` (via `postinstall`).

### 5. Commit

Mensagens no formato [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), descrevendo o *porquê* da
mudança, não só o *o quê*:

```bash
git commit -m "feat: adiciona use-case de listar turnos por período"
```

### 6. Abra o Pull Request

- Target: `master`.
- Descreva o problema que a mudança resolve e, se for uma decisão de negócio (novo
  campo em entidade, nova regra de validação), explique o raciocínio — isso ajuda na
  revisão.
- O CI (`.github/workflows/ci.yml`) roda testes e build automaticamente no PR; ele
  precisa passar antes do merge.

## Reportando bugs ou sugerindo features

Abra uma [issue](../../issues) descrevendo o comportamento esperado vs. o observado
(bugs) ou o caso de uso que a feature resolveria. Para mudanças de domínio maiores,
prefira abrir a issue antes do PR, para alinhar o escopo — este projeto evita
abstrações especulativas (veja "Escopo" em [CLAUDE.md](./CLAUDE.md)), então é melhor
combinar o tamanho da mudança antes de codificar.

## Release

Publicar uma nova versão no npm é responsabilidade de quem mantém o repositório, via
tag de versão — veja a seção [Release no README](./README.md#release). Contribuidores
não precisam se preocupar com isso.
