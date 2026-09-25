# CLAUDE.md

Contexto e convenções deste repositório para orientar futuras mudanças.

## O que é

`shift-swap` é uma biblioteca TypeScript de domínio (DDD + Clean Architecture) para um
sistema de troca de turnos entre funcionários. Sem dependências de runtime, roda em
Bun/Node. Ver [README.md](./README.md) para a perspectiva de quem consome a lib.

## Domínio (glossário)

- **Funcionário**: pessoa que trabalha turnos e pode solicitar/aceitar trocas. Só vê os
  próprios turnos e a lista de turnos disponíveis para troca de outros.
- **Supervisor**: pessoa com visão de todos os turnos de todos os funcionários. Mesma
  base (`PessoaEntity`) que Funcionário, sem atributos extras hoje.
- **Turno**: um turno de trabalho (`data`, `horaInicio`, `horaFim`) pertencente a um
  funcionário (`funcionarioId`). Pode ser reatribuído (`reatribuir`) quando uma troca é
  aceita.
- **Solicitação de troca de turno**: quando um funcionário quer que outro assuma um dos
  seus turnos para ele poder folgar. Tem ciclo de vida `pendente → aceita | cancelada`.
  Modelada como entidade própria (não um campo em Turno) para manter histórico/auditoria
  — por isso não tem update/delete genérico, só `create` + as transições `aceitar`/
  `cancelar`.

## Estrutura de pastas

```
src/
  shared/              blocos genéricos reutilizáveis (não sabem nada do domínio)
    entity.ts          Entity<T>: identidade por id, equals por id
    value-object.ts    ValueObject<T>: imutável, comparação por valor
    use-case.ts        UseCase<Input, Output>: contrato de execute()
    repository.ts      Repository<T>: contrato de CRUD (save/update/delete/findById/findAll)
    result.ts          Result<T>: ok/fail/combine/getValue — canal de erro padrão
    either.ts          Either<L,R> funcional (Left/Right) — existe mas nada consome ainda

  core/
    entities/          entidades e value objects concretos do domínio (*.entity.ts, *.vo.ts)
      __tests__/
    ports/             interfaces abstratas de repositório (*.repository.ts)
    usecases/          casos de uso (*.usecase.ts)
      __mocks__/       repositórios in-memory (*-in-memory.repository.ts) usados nos testes
      __tests__/

  index.ts             superfície pública da lib — TUDO que um consumidor externo usa
                        precisa estar re-exportado aqui
```

## Convenções a seguir

### Linguagem
Conceitos de domínio, nomes de classe/arquivo e mensagens de erro em **português**
(`FuncionarioEntity`, `"Nome não pode ser vazio"`). Os blocos genéricos em `shared/`
usam nomes técnicos em inglês (`Entity`, `Result`, `ValueObject`).

### Nomenclatura de arquivos
kebab-case terminando no sufixo do tipo: `*.entity.ts`, `*.vo.ts`, `*.usecase.ts`,
`*.repository.ts`. Classe em PascalCase correspondente (`turno.entity.ts` →
`class Turno`, `criar-turno.usecase.ts` → `class CriarTurnoUseCase`).

### Entidades
- Estendem `Entity<Props>`. Construtor `private` (ou `protected` se for base para
  herança, como `PessoaEntity`).
- Toda criação passa por `static create(props, id?): Result<T>` — nunca lança exceção.
  O `id` opcional existe para permitir reaproveitar um id externo (ex.: id de usuário
  autenticado via BetterAuth).
- Mutação depois de criada é feita por métodos de instância que retornam `Result<void>`
  (ex.: `Turno.reatribuir`, `Turno.atualizarHorario`, `SolicitacaoTrocaTurno.aceitar`),
  nunca alterando o estado direto de fora nem lançando exceção.
- Quando duas operações (criar + atualizar, ou classe base + subclasse) compartilham
  validação, extraia um método privado/protegido estático (`buildProps`,
  `validarHorario`) em vez de duplicar as regras.
- Herança é o padrão para "tipos de pessoa" (`FuncionarioEntity`, `SupervisorEntity`
  estendem `PessoaEntity`), não um campo `tipo`/`role` numa entidade genérica.

### Value Objects
Estendem `ValueObject<T>`, mesmo padrão `static create(): Result<T>`, imutáveis.

### Use-cases
- Estendem `UseCase<Input, Output>`.
- Recebem os `*Repository` (ports) via construtor — nunca uma implementação concreta.
- `execute()` sempre retorna `Promise<Result<Output>>`. Verificam existência
  (`findById` → `null`) e devolvem `Result.fail(...)` em vez de deixar estourar.
- Um use-case de leitura sem parâmetros usa `UseCase<void, Output[]>` e pode omitir o
  argumento na implementação (`async execute(): Promise<Result<Output[]>>`).

### Ports / Repositórios
- Abstract class em `core/ports/`, estendendo `Repository<T>` genérico.
- Só adicione um método de query dedicado quando um use-case real precisar dele (ex.:
  `findByFuncionarioIdAndData`, `findPendentesExcetoSolicitante`). Não adicione métodos
  especulativos.

### Testes
- `bun:test` (`describe`/`it`/`expect`), sem framework externo.
- Ficam em `__tests__/` ao lado do que testam.
- Fluxo TDD: escreva o teste primeiro, rode e confirme que falha (arquivo/classe ainda
  não existe), só então implemente até passar.
- Cada arquivo de teste de use-case tem uma função `criarSut()` que monta o
  use-case + seus repositórios in-memory (evita repetir setup em cada `it`).
- Repositórios in-memory ficam em `core/usecases/__mocks__/`, um `Map<string, Entity>`
  por implementação — sem lib de mock.

### Superfície pública
Ao adicionar uma entidade, port ou use-case que um consumidor externo deveria usar,
**exporte em `src/index.ts`** na seção correspondente. Coisas que não são exportadas de
propósito: os repositórios in-memory (são só para teste) e as classes base de
`shared/` (`Entity`, `ValueObject`, `UseCase`, `Repository`, `Either`).

## Comandos de verificação

```bash
bun run lint                              # Biome: formatação + lint
bun test                                  # suíte inteira
./node_modules/.bin/tsc.exe --noEmit      # type-check completo (inclui testes)
bun run build                             # build real: ESM + CJS + .d.ts
```

Neste ambiente, `npx tsc`/`tsc` direto falha com um erro enganoso ("This is not the tsc
command you are looking for") — sempre use o binário local (`./node_modules/.bin/tsc.exe`)
ou os scripts do `package.json`.

Formatação e lint são via [Biome](https://biomejs.dev) (`biome.json`), não ESLint/Prettier
— decisão consciente pra manter uma dependência só, dado o resto do projeto ser minimalista
em devDependencies. `bun run lint:fix`/`bun run format` corrigem automaticamente. Um hook de
pre-commit (`simple-git-hooks` + `lint-staged`, instalado via `postinstall`) já roda
`biome check --write` nos arquivos staged. Ao adicionar uma exceção de lint real (não um
falso positivo), use um comentário `// biome-ignore lint/<regra>: <motivo>` explicando o
porquê — não desative a regra globalmente no `biome.json` sem necessidade.

`tsconfig.build.json` estende `tsconfig.json` excluindo `__tests__`/`*.test.ts` — é ele
quem o script `build:types` usa, para não vazar tipos de teste no `.d.ts` publicado.
Não aponte `build:types` de volta para o `tsconfig.json` puro.

## Escopo — não superdimensionar

Este projeto evita abstrações especulativas de propósito (ex.: `SolicitacaoTrocaTurno`
não tem update/delete genérico; `FuncionarioRepository`/`SupervisorRepository` não têm
métodos além do CRUD básico até que algo precise). Ao receber um pedido novo, prefira
adicionar o mínimo necessário e perguntar antes de expandir escopo (ex.: novos campos em
entidades, novas regras de validação) quando a decisão for de negócio, não técnica.
