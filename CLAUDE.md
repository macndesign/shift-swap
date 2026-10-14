# CLAUDE.md

Contexto e convenções deste repositório para orientar futuras mudanças.

## O que é

`shift-swap` é uma biblioteca TypeScript de domínio (DDD + Clean Architecture) para um
sistema de troca de turnos entre funcionários, construída sobre o
[core-kernel](https://github.com/macndesign/core-kernel) (`peerDependency`: `Result`, erros,
`Entity`, `ValueObject`, `UniqueId`, `BaseUseCase`, ports base, `Clock`). Roda em Bun/Node. Ver [README.md](./README.md) para a perspectiva de quem consome a lib.

## Domínio (glossário)

- **Funcionário**: pessoa que trabalha turnos e pode solicitar (e cancelar) trocas e responder
  (aceitar/recusar) as que colegas pedem a ele. Só vê os próprios turnos e os pedidos
  endereçados a ele.
- **Supervisor**: pessoa com visão de todos os turnos de todos os funcionários e única
  que cria/altera/exclui turnos (`CriarTurnoUseCase`, `AtualizarTurnoUseCase`,
  `RemoverTurnoUseCase` exigem `supervisorId` e falham com `SUPERVISOR_NAO_ENCONTRADO`) e
  aprova/rejeita solicitações de troca. Mesma
  base (`PessoaEntity`) que Funcionário, sem atributos extras hoje.
- **Turno**: um turno de trabalho (`data`, `horaInicio`, `horaFim`) pertencente a um
  funcionário (`funcionarioId`). Pode ser reatribuído (`reatribuir`) quando uma troca é
  aprovada.
- **Solicitação de troca de turno**: quando o funcionário A pede que o colega B (o
  **destinatário**, indicado por A ao solicitar) assuma um dos seus turnos. É um acordo em
  duas etapas: primeiro B aceita ou recusa; só depois do aceite o **supervisor** autoriza
  ou não. Ciclo de vida:
  `pendente → aguardando_aprovacao → aprovada | rejeitada` e `pendente → recusada`;
  `cancelada` (A desiste) e `expirada` (o turno começou sem desfecho, aplicada pelo
  sistema via `ExpirarSolicitacoesTrocaTurnoUseCase`) valem em `pendente` e
  `aguardando_aprovacao`. Todos os demais são terminais. `rejeitada` exige motivo;
  `recusada` aceita motivo opcional. O turno só muda de dono na aprovação.
  Cada estado é uma classe em `solicitacao-troca-turno.state.ts` (padrão State) e a
  entidade só delega.
  Modelada como entidade própria (não um campo em Turno) para manter histórico/auditoria
  (`respondidaEm`, `decididoPorId`, `decididoEm`, `motivo`) — por isso não tem update/delete genérico, só
  `create` + as transições `aceitar`/`recusar` (destinatário), `aprovar`/`rejeitar`
  (supervisor), `cancelar` e `expirar`.
  `reconstituir(props, id)` existe só para adapters de repositório reidratarem uma
  solicitação salva (sem rodar transições).

## Estrutura de pastas

```
src/
  core/
    erros.ts           CODIGOS_ERRO (catálogo de códigos) + fábricas de NotFoundError
    entities/          entidades, value objects e ids do domínio (*.entity.ts, *.vo.ts, ids.ts)
      __tests__/
    ports/             interfaces de repositório (*.repository.ts)
    usecases/          casos de uso (*.usecase.ts) e regras puras usadas por eles (conflito-horario.ts)
      __mocks__/       repositórios in-memory (*-in-memory.repository.ts) usados nos testes
      __tests__/
    __tests__/
      fixtures.ts      atalhos de teste: ids tipados, AGORA, relogio()

  index.ts             superfície pública da lib — TUDO que um consumidor externo usa
                        precisa estar re-exportado aqui
```

Os blocos genéricos (Result, erros, Entity, ValueObject, UniqueId, BaseUseCase, ports base,
Clock, dublês de teste) vêm do `core-kernel` — não recrie nada disso aqui.

## Convenções a seguir

### Linguagem
Conceitos de domínio, nomes de classe/arquivo e mensagens de erro em **português**
(`FuncionarioEntity`, `"Nome não pode ser vazio"`). **Códigos de erro também em português**
(`TURNO_NAO_ENCONTRADO`), declarados em `CODIGOS_ERRO` (`src/core/erros.ts`). Os blocos do
core-kernel mantêm os nomes em inglês (`Entity`, `Result`, `ValueObject`).

### Nomenclatura de arquivos
kebab-case terminando no sufixo do tipo: `*.entity.ts`, `*.vo.ts`, `*.usecase.ts`,
`*.repository.ts`. Classe em PascalCase correspondente (`turno.entity.ts` →
`class Turno`, `criar-turno.usecase.ts` → `class CriarTurnoUseCase`).

### Entidades
- Estendem `Entity<Props, XxxId>` do core-kernel, com id tipado (`ids.ts`: `FuncionarioId`,
  `SupervisorId`, `TurnoId`, `SolicitacaoTrocaTurnoId`). Construtor `private` (ou `protected`
  se for base para herança, como `PessoaEntity`).
- Criação por `static create(props): Result<T, Erros>` — nunca lança exceção. Pessoas aceitam
  `id?: string` para reaproveitar um id externo (ex.: usuário do BetterAuth).
- Reidratação pelos adapters: `static reconstituir(props, id)` — sem rodar regras de criação.
  `SolicitacaoTrocaTurno.reconstituir` é a exceção deliberada: devolve `Result` e valida a
  **coerência** dos dados com o status (`DADOS_INCOERENTES`).
- Mutação só por métodos de domínio que retornam `Result<void, Erros>` (ex.: `Turno.reatribuir`,
  `Turno.atualizarHorario`, `SolicitacaoTrocaTurno.aprovar`). `props` é `protected readonly`:
  altere campos (`this.props.status = ...`), não o objeto inteiro.
- Datas de negócio vêm de fora: transições que registram data recebem `agora` nas props
  (`aceitar({ funcionarioId, agora })`); o use case obtém do `Clock`. Nada de `new Date()` no domínio.
- Outras entidades são referenciadas por id tipado (`turno.funcionarioId: FuncionarioId`).
- Quando duas operações (criar + atualizar, ou classe base + subclasse) compartilham
  validação, extraia um método privado/protegido estático (`buildProps`,
  `validarHorario`) em vez de duplicar as regras.
- Herança é o padrão para "tipos de pessoa" (`FuncionarioEntity`, `SupervisorEntity`
  estendem `PessoaEntity`), não um campo `tipo`/`role` numa entidade genérica.
- Turnos usam data/hora como **texto local sem fuso** (`YYYY-MM-DD`, `HH:mm`), não `Date`/
  `DateRange`: é o que o negócio usa e a comparação de texto ordena corretamente.

### Value Objects
Estendem `ValueObject<T>` do core-kernel, `static create(raw, campo?): Result<Vo, ValidationError>`,
validando com `Guard` e passando `{ field, code, message }` em português. (`NameVO`/`EmailVO` são
próprios porque os VOs prontos do core-kernel não permitem trocar código/mensagem.)

### Erros
- Toda falha é um erro tipado do core-kernel com `code` de `CODIGOS_ERRO`: `ValidationError`
  (entrada inválida), `NotFoundError` (`naoEncontrado.turno()` etc.), `ConflictError` (estado
  não permite), `ForbiddenError` (não é a pessoa autorizada).
- Ids vindos de `string` são convertidos com `idDoCampo(XxxId.from(raw), "campo")`, que devolve
  `ID_INVALIDO` apontando o campo certo.
- Ao criar um código novo, adicione em `CODIGOS_ERRO` (é API pública).

### Use-cases
- Estendem `BaseUseCase<Input, Output, Erros>` do core-kernel e implementam `protected handle`.
  O `execute` herdado converte exceções de infraestrutura em `UNEXPECTED` e nunca rejeita.
- Entradas continuam com primitivos (`string`); a saída é a entidade (decisão do projeto, para
  a API montar os próprios DTOs).
- Recebem as ports via construtor, tipadas pelo mínimo usado
  (`Pick<TurnoRepository, "findById" | "update">`), e o `Clock` quando registram data.
- Fluxo: converter ids (`idDoCampo`) → buscar (`null` → `naoEncontrado.x()`) → regra no domínio →
  persistir. Propagar falhas com `if (r.isFail()) return r;`.
- Use-case de leitura sem parâmetros: `BaseUseCase<void, Output[]>`.

### Ports / Repositórios
- Interfaces em `core/ports/` compondo as do core-kernel (`CrudRepository`, `CreateRepository`,
  `FindByIdRepository`...). `findById`/`delete` recebem id tipado; não encontrado é `null`;
  escrita é `create`/`update` (não `save`). Falha de infraestrutura é exceção.
- `findAll` existe nas ports que alimentam listagens (os use cases devolvem entidades).
- Só adicione um método de query dedicado quando um use-case real precisar dele (ex.:
  `findByFuncionarioIdAndData`, `findPendentesByDestinatarioId`). Não adicione métodos
  especulativos.

### Testes
- `bun:test` (`describe`/`it`/`expect`), sem framework externo.
- Ficam em `__tests__/` ao lado do que testam.
- Fluxo TDD: escreva o teste primeiro, rode e confirme que falha (arquivo/classe ainda
  não existe), só então implemente até passar.
- Cada arquivo de teste de use-case tem uma função `criarSut()` que monta o
  use-case + seus repositórios in-memory (evita repetir setup em cada `it`).
- Repositórios in-memory ficam em `core/usecases/__mocks__/` e estendem `InMemoryRepository` de
  `core-kernel/testing` (queries próprias com `this.filter`; `failNext` simula queda do banco).
- Erros: `assertFail(result, "CODIGO")` (de `core-kernel/testing`) e, quando relevante, a
  `message`. Sucesso: `assertOk(result)`.
- `src/core/__tests__/fixtures.ts`: `funcionarioId("x")` etc., `AGORA` e `relogio()` (`FixedClock`).

### Superfície pública
Ao adicionar uma entidade, id, port ou use-case que um consumidor externo deveria usar,
**exporte em `src/index.ts`** na seção correspondente. Ports são exportadas como `type`. Não
exportados de propósito: os repositórios in-memory (só para teste) e os blocos do core-kernel
(o consumidor importa de `core-kernel`, para não haver duas cópias).

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
pre-commit (`simple-git-hooks` + `lint-staged`, instalado via `prepare` — não `postinstall`, que
iria no pacote publicado e quebraria o `npm install` de quem consome) já roda
`biome check --write` nos arquivos staged. Ao adicionar uma exceção de lint real (não um
falso positivo), use um comentário `// biome-ignore lint/<regra>: <motivo>` explicando o
porquê — não desative a regra globalmente no `biome.json` sem necessidade.

`tsconfig.build.json` estende `tsconfig.json` excluindo `__tests__`/`*.test.ts` — é ele
quem o script `build:types` usa, para não vazar tipos de teste no `.d.ts` publicado.
Não aponte `build:types` de volta para o `tsconfig.json` puro.

O `bun build` usa `--packages external`: o `core-kernel` **não** pode ser empacotado no `dist`
(o consumidor teria duas cópias das classes). Mantenha-o como `peerDependency`.

## Escopo — não superdimensionar

Este projeto evita abstrações especulativas de propósito (ex.: `SolicitacaoTrocaTurno`
não tem update/delete genérico; `FuncionarioRepository`/`SupervisorRepository` não têm
métodos além do CRUD básico até que algo precise). Ao receber um pedido novo, prefira
adicionar o mínimo necessário e perguntar antes de expandir escopo (ex.: novos campos em
entidades, novas regras de validação) quando a decisão for de negócio, não técnica.
