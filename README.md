# shift-swap — Domínio de Troca de Turnos (DDD)

Biblioteca TypeScript com a lógica de domínio de um sistema de troca de turnos entre
funcionários, modelada com DDD e Clean Architecture sobre o
[core-kernel](https://github.com/macndesign/core-kernel). Não faz I/O e não lança exceções
para erros de negócio — tudo é comunicado através de `Result`, com erros tipados e
códigos estáveis.

## Instalação

```bash
bun add shift-swap core-kernel
# ou
npm install shift-swap core-kernel
```

`core-kernel` é `peerDependency`: o projeto instala uma única cópia, usada pela lib e pelo
seu código (`Result`, `Clock`, erros).

## Ideia geral

- **Entidades** (`FuncionarioEntity`, `SupervisorEntity`, `Turno`, `SolicitacaoTrocaTurno`)
  concentram as regras de negócio e são criadas por um `static create(...)` que retorna
  `Result` — nunca lançam exceção. Para recriar a partir do banco, use
  `static reconstituir(props, id)`.
- **Ids tipados** (`FuncionarioId`, `SupervisorId`, `TurnoId`, `SolicitacaoTrocaTurnoId`): o
  compilador não deixa passar o id de um tipo onde se espera o de outro. `entidade.id.value`
  é a string.
- **Use-cases** (`CriarFuncionarioUseCase`, `SolicitarTrocaTurnoUseCase`, etc.) orquestram
  entidades + repositórios e são o ponto de entrada de qualquer cliente (API REST, GraphQL,
  CLI, job). Recebem entradas com `string` e devolvem `Promise<Result<Output, Erros>>` —
  **nunca rejeitam**: falha de infraestrutura (banco fora do ar) vira erro `UNEXPECTED`.
- **Ports** (`FuncionarioRepository`, `TurnoRepository`, `SupervisorRepository`,
  `SolicitacaoTrocaTurnoRepository`) são interfaces de persistência. A lib não implementa
  banco nenhum — quem consome implementa esses contratos (inversão de dependência).
- **Erros**: cada falha é um erro tipado do core-kernel (`ValidationError`, `NotFoundError`,
  `ConflictError`, `ForbiddenError`, `UnexpectedError`) com `kind`, `code` estável (ver
  `CODIGOS_ERRO`) e `message` em português. Trate pelo `code`/`kind`, não pelo texto.

A lib não usa nenhuma API exclusiva de Node, então também roda num bundle de frontend. A
distinção importante é **o que** faz sentido importar em cada lado:

- **Backend (sempre)**: use-cases e ports. Eles pressupõem um repositório de verdade e são a
  autoridade final — validação client-side nunca substitui o que roda aqui.
- **Frontend (opcional)**: entidades e Value Objects (`NameVO`, `EmailVO`...) podem rodar a
  *mesma* validação num formulário, para feedback instantâneo. O backend sempre revalida.

```ts
// num formulário React, por exemplo
import { EmailVO } from "shift-swap";

function validarEmail(email: string): string | null {
  const result = EmailVO.create(email);
  return result.isFail() ? result.error.message : null;
}
```

## Integrando num backend

### 1. Implemente os repositórios com seu banco de dados

```ts
import { FuncionarioEntity, FuncionarioId, EmailVO, NameVO, type FuncionarioRepository } from "shift-swap";
import { PrismaClient } from "@prisma/client";

class PrismaFuncionarioRepository implements FuncionarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(entity: FuncionarioEntity): Promise<void> {
    await this.prisma.funcionario.create({
      data: { id: entity.id.value, name: entity.name.value, email: entity.email.value },
    });
  }

  async update(entity: FuncionarioEntity): Promise<void> {
    await this.prisma.funcionario.update({
      where: { id: entity.id.value },
      data: { name: entity.name.value, email: entity.email.value },
    });
  }

  async delete(id: FuncionarioId): Promise<void> {
    await this.prisma.funcionario.delete({ where: { id: id.value } });
  }

  async findById(id: FuncionarioId): Promise<FuncionarioEntity | null> {
    const row = await this.prisma.funcionario.findUnique({ where: { id: id.value } });
    return row ? this.toDomain(row) : null; // não encontrado é null, não erro
  }

  async findAll(): Promise<FuncionarioEntity[]> {
    return (await this.prisma.funcionario.findMany()).map((row) => this.toDomain(row));
  }

  /** Dados do banco já foram validados na escrita: reconstituir não revalida. */
  private toDomain(row: { id: string; name: string; email: string }): FuncionarioEntity {
    return FuncionarioEntity.reconstituir(
      { name: NameVO.create(row.name).unwrap(), email: EmailVO.create(row.email).unwrap() },
      FuncionarioId.from(row.id).unwrap(),
    );
  }
}
```

Erros do banco podem simplesmente ser lançados: o use case os converte em `UNEXPECTED`.
Repita o padrão para `TurnoRepository`, `SupervisorRepository` e
`SolicitacaoTrocaTurnoRepository` (métodos extras na tabela de exports abaixo).

### 2. Monte e chame os use-cases

```ts
import { systemClock } from "core-kernel";
import { AprovarTrocaTurnoUseCase, CODIGOS_ERRO, CriarFuncionarioUseCase } from "shift-swap";

const criarFuncionario = new CriarFuncionarioUseCase(funcionarioRepository);
const aprovarTroca = new AprovarTrocaTurnoUseCase(supervisorRepo, turnoRepo, solicitacaoRepo, systemClock);

const STATUS = { validation: 422, not_found: 404, conflict: 409, forbidden: 403, unexpected: 500 } as const;

app.post("/funcionarios", async (req, res) => {
  const result = await criarFuncionario.execute(req.body); // { name, email }

  if (result.isFail()) {
    const { error } = result;
    if (error.kind === "unexpected") return res.status(500).json({ code: error.code });
    return res.status(STATUS[error.kind]).json(error.toJSON()); // { kind, code, message, issues? }
  }

  const funcionario = result.value;
  return res.status(201).json({
    id: funcionario.id.value,
    name: funcionario.name.value,
    email: funcionario.email.value,
  });
});

// Tratamento específico por código:
// if (result.isFail() && result.error.code === CODIGOS_ERRO.CONFLITO_DE_HORARIO) { ... }
```

Use cases que registram data (aceitar, recusar, aprovar, rejeitar) recebem um `Clock` —
`systemClock` em produção, `FixedClock` (de `core-kernel/testing`) nos testes.

### 3. Autenticação (ex.: BetterAuth)

`FuncionarioEntity`/`SupervisorEntity` aceitam um `id` explícito na criação para reaproveitar
o id do provedor de autenticação (qualquer string não vazia), evitando uma tabela de vínculo:

```ts
const { user } = await auth.api.signUpEmail({ body: { email, password, name } });

const result = await criarFuncionario.execute({
  id: user.id, // mesmo id do usuário autenticado
  name: user.name,
  email: user.email,
});
```

A partir daí, `funcionario.id.value === user.id`, e a API decide quais use-cases expor com
base no papel do usuário logado.

## O que a lib exporta

### Erros
| Export | Descrição |
| --- | --- |
| `CODIGOS_ERRO`, `CodigoErro` | Todos os códigos de erro do domínio (ex.: `TURNO_NAO_ENCONTRADO`, `CONFLITO_DE_HORARIO`, `TRANSICAO_INVALIDA`). Além deles, aparecem os genéricos do core-kernel `VALIDATION_FAILED` e `UNEXPECTED`. |

### Entidades, Value Objects e ids
| Export | Descrição |
| --- | --- |
| `FuncionarioEntity` | Pessoa que executa turnos e solicita trocas |
| `SupervisorEntity` | Pessoa com visão de todos os turnos |
| `Turno` | Um turno de trabalho (`data`, `horaInicio`, `horaFim` em horário local; dono atual) |
| `SolicitacaoTrocaTurno`, `StatusSolicitacaoTrocaTurno` | Pedido de troca de um turno **direcionado a um colega**. O destinatário aceita ou recusa; se aceitar, o supervisor autoriza ou não. Ciclo de vida: `pendente` → `aguardando_aprovacao` → `aprovada`/`rejeitada`; ou `pendente` → `recusada`; `cancelada` e `expirada` valem enquanto em aberto |
| `NameVO`, `EmailVO` | Value Objects usados por `FuncionarioEntity`/`SupervisorEntity` |
| `FuncionarioId`, `SupervisorId`, `TurnoId`, `SolicitacaoTrocaTurnoId` | Ids tipados (`XxxId.from(string)`, `.value`) |
| `PessoaProps`, `TurnoProps`, `ReconstituirSolicitacaoTrocaTurnoProps`... | Tipos das props, para os adapters reconstituírem as entidades |

### Ports (implemente com seu banco)
| Export | Métodos |
| --- | --- |
| `FuncionarioRepository` | `create`, `update`, `delete`, `findById`, `findAll` |
| `SupervisorRepository` | `create`, `findById` |
| `TurnoRepository` | `create`, `update`, `delete`, `findById`, `findAll`, `findByFuncionarioIdAndData(funcionarioId, data)` |
| `SolicitacaoTrocaTurnoRepository` | `create`, `update`, `findById`, `findAll`, `findEmAberto()`, `findEmAbertoByTurnoId(turnoId)`, `findPendentesByDestinatarioId(destinatarioId)` |

`findById`/`delete` recebem o id tipado; não encontrado é `null`.

### Use-cases
| Funcionário | Supervisor | Turno | Troca de turno |
| --- | --- | --- | --- |
| `CriarFuncionarioUseCase` | `CriarSupervisorUseCase` | `CriarTurnoUseCase` | `SolicitarTrocaTurnoUseCase` |
| `BuscarFuncionarioPorIdUseCase` | | `BuscarTurnoPorIdUseCase` | `AceitarTrocaTurnoUseCase` |
| `ListarFuncionariosUseCase` | | `ListarTurnosUseCase` | `RecusarTrocaTurnoUseCase` |
| `AtualizarFuncionarioUseCase` | | `AtualizarTurnoUseCase` | `AprovarTrocaTurnoUseCase` |
| `RemoverFuncionarioUseCase` | | `RemoverTurnoUseCase` | `RejeitarTrocaTurnoUseCase` |
| | | `ListarTurnosPorFuncionarioEDataUseCase` | `CancelarTrocaTurnoUseCase` |
| | | | `ExpirarSolicitacoesTrocaTurnoUseCase` |
| | | | `BuscarSolicitacaoTrocaTurnoPorIdUseCase` |
| | | | `ListarSolicitacoesTrocaTurnoUseCase` |
| | | | `ListarSolicitacoesRecebidasTrocaTurnoUseCase` |

> Criar, atualizar e remover turno são exclusivos do supervisor: `CriarTurnoUseCase`,
> `AtualizarTurnoUseCase` e `RemoverTurnoUseCase` recebem o `SupervisorRepository` no
> construtor e `supervisorId` no input.

> `SolicitacaoTrocaTurno` propositalmente não tem update/delete genérico — só
> `create`/`read` e as transições de estado (`aceitar`/`recusar`/`aprovar`/`rejeitar`/`cancelar`/`expirar`), para preservar o
> histórico da troca.
>
> Para **reidratar** uma solicitação já persistida (nos adapters de repositório), use
> `SolicitacaoTrocaTurno.reconstituir(props, id)`. Ele devolve a entidade no estado salvo
> sem executar transições (não reatribui o turno nem regrava `decididoEm`) e valida se os
> dados são coerentes com o status (`DADOS_INCOERENTES`).

## Migrando da 0.5

| Antes (0.5) | Agora (0.6) |
| --- | --- |
| `Result` exportado pelo shift-swap; `isSuccess`/`isFailure`, `getValue()`, `error` string | `Result` do `core-kernel`; `isOk()`/`isFail()`, `.value`/`.error` após narrowing, `unwrap()`; `error` é objeto com `code`, `kind`, `message` |
| Comparar `result.error === "Turno não encontrado"` | Comparar `result.error.code === CODIGOS_ERRO.TURNO_NAO_ENCONTRADO` |
| Ports eram classes abstratas (`extends TurnoRepository`) | Interfaces (`implements TurnoRepository`) |
| `save(entity)` | `create(entity)` |
| `findById(id: string)`, `delete(id: string)` | Recebem o id tipado (`TurnoId`...); use `id.value` |
| `entity.id` era `string` | `entity.id` é id tipado; `entity.id.value` é a string |
| `turno.funcionarioId`, `solicitacao.solicitanteId`... eram `string` | Ids tipados (`FuncionarioId`, `SupervisorId`) |
| Reidratar com `Entity.create(props, id)` | `Entity.reconstituir(props, id)` (props com VOs e ids tipados) |
| `Turno.create(props, id?)` | `Turno.create(props)` gera o id; recriar com `Turno.reconstituir` |
| `new AceitarTrocaTurnoUseCase(turnoRepo, solicitacaoRepo)` | `+ clock` no final; idem `Recusar`, `Aprovar`, `Rejeitar` |
| `solicitacao.aceitar({ funcionarioId })` | `aceitar({ funcionarioId, agora })` (ids tipados); idem `recusar`/`aprovar`/`rejeitar` |
| Nome e e-mail inválidos: só o primeiro erro | Um `ValidationError` com as duas issues |
| Use case podia rejeitar a Promise se o banco falhasse | Nunca rejeita: devolve erro `UNEXPECTED` |

## Scripts (para desenvolver a própria lib)

```bash
bun run lint      # formatação + lint (Biome)
bun test          # roda a suíte de testes
bun run build     # gera dist/ (ESM + CJS + .d.ts), com core-kernel externo
```

## Release

CI (`.github/workflows/ci.yml`) roda testes e build em todo push/PR para `master`.
Como `master` é uma branch protegida (só aceita mudanças via PR), o bump de versão
precisa passar por uma branch antes de virar tag:

```bash
git checkout -b chore/release-vX.Y.Z master
npm version patch                # ou minor/major — bump + commit + tag, local
git push origin HEAD --follow-tags
```

O push acima envia a branch **e** a tag `vX.Y.Z` (tags não são bloqueadas pela proteção
do branch, só o `master` em si). A tag já dispara `.github/workflows/publish.yml`
sozinha — a publicação no npm acontece nesse momento, **antes mesmo do PR ser
mergeado**. Requer o secret `NPM_TOKEN` configurado no repositório do GitHub (Settings
→ Secrets and variables → Actions), gerado como Automation Token em npmjs.com.

Depois, abra um PR de `chore/release-vX.Y.Z` para `master` e faça o merge usando
**"Create a merge commit"** (não "Squash" nem "Rebase") — isso preserva o SHA exato do
commit pro qual a tag aponta, mantendo a tag consistente com o histórico do `master`.
Squash/rebase criam um novo commit e deixam a tag "órfã" (apontando para um commit que
não existe mais na história de `master`).

Depois do merge:

```bash
git checkout master
git pull
git branch -d chore/release-vX.Y.Z
```

Para contribuir com a lib, veja as convenções em [CLAUDE.md](./CLAUDE.md).
