# shift-swap — Domínio de Troca de Turnos (DDD)

Biblioteca TypeScript com a lógica de domínio de um sistema de troca de turnos entre
funcionários, modelada com DDD e Clean Architecture. Não tem dependências de runtime,
não faz I/O e não lança exceções para erros de negócio — tudo é comunicado através do
padrão `Result`.

## Instalação

```bash
npm install shift-swap
# ou
bun add shift-swap
```

(Ajuste `shift-swap` para o nome real do pacote publicado, se for diferente.)

## Ideia geral

- **Entidades** (`FuncionarioEntity`, `SupervisorEntity`, `Turno`, `SolicitacaoTrocaTurno`)
  concentram as regras de negócio e são sempre criadas por um `static create(...)` que
  retorna `Result<T>` — nunca lançam exceção.
- **Use-cases** (`CriarFuncionarioUseCase`, `SolicitarTrocaTurnoUseCase`, etc.) orquestram
  entidades + repositórios e são o ponto de entrada que qualquer cliente (API REST,
  GraphQL, CLI, job) deve chamar. Todos retornam `Promise<Result<Output>>`.
- **Ports** (`FuncionarioRepository`, `TurnoRepository`, `SupervisorRepository`,
  `SolicitacaoTrocaTurnoRepository`) são contratos abstratos de persistência. A lib não
  implementa nenhum banco — quem consome implementa esses contratos (Postgres, Prisma,
  Mongo, um array em memória, o que for). Isso é inversão de dependência: o domínio não
  conhece a infraestrutura.
- **`Result<T>`** é o canal padrão de erro: `isSuccess`/`isFailure`, `error` (mensagem) e
  `getValue()` (lança só se você chamar num resultado falho — é um erro de programação,
  não uma regra de negócio).

A lib não usa nenhuma API exclusiva de Node — nem `fs`, nem `process` — e
`crypto.randomUUID()` também existe em navegadores modernos, então ela roda sem
problema num bundle de frontend (Vite, webpack, etc.). A distinção importante não é
"onde roda", e sim **o que** faz sentido importar em cada lado:

- **Backend (sempre)**: use-cases e ports. Eles pressupõem um repositório de verdade
  (banco de dados) e são a autoridade final — validação e autorização client-side nunca
  substituem o que roda aqui.
- **Frontend (opcional, com moderação)**: as entidades/Value Objects (`FuncionarioEntity`,
  `NameVO`, `EmailVO`, etc.) e `Result<T>` podem ser reaproveitados para rodar a *mesma*
  validação num formulário antes de enviar, dando feedback instantâneo sem duplicar as
  regras (`"Nome deve ter pelo menos 3 caracteres"` escrito uma vez só). Isso é só UX —
  o backend sempre revalida.

Importar **use-cases** ou **ports** (`*Repository`) no frontend é a parte que eu evitaria:
não existe repositório de verdade num navegador, e "implementar" um que só chama sua API
é uma indireção sem ganho, além de sugerir (errado) que a regra de negócio já foi
aplicada do lado do cliente.

```ts
// num formulário React, por exemplo
import { EmailVO } from "shift-swap";

function validarEmail(email: string): string | null {
  const result = EmailVO.create(email);
  return result.isFailure ? (result.error as string) : null;
}
```

A exceção de "onde roda" é um framework fullstack cujo código de "frontend" na verdade
executa em servidor/edge (ex.: Route Handlers ou Server Actions do Next.js) — aí use-cases
e ports funcionam normalmente, como em qualquer backend.

## Integrando num backend

### 1. Implemente os repositórios com seu banco de dados

```ts
import { FuncionarioRepository, FuncionarioEntity } from "shift-swap";
import { PrismaClient } from "@prisma/client";

class PrismaFuncionarioRepository extends FuncionarioRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async save(entity: FuncionarioEntity): Promise<void> {
    await this.prisma.funcionario.create({
      data: { id: entity.id, name: entity.name.value, email: entity.email.value },
    });
  }

  async update(entity: FuncionarioEntity): Promise<void> {
    await this.prisma.funcionario.update({
      where: { id: entity.id },
      data: { name: entity.name.value, email: entity.email.value },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.funcionario.delete({ where: { id } });
  }

  async findById(id: string): Promise<FuncionarioEntity | null> {
    const row = await this.prisma.funcionario.findUnique({ where: { id } });
    if (!row) return null;
    return FuncionarioEntity.create({ name: row.name, email: row.email }, row.id).getValue();
  }

  async findAll(): Promise<FuncionarioEntity[]> {
    const rows = await this.prisma.funcionario.findMany();
    return rows.map((row) =>
      FuncionarioEntity.create({ name: row.name, email: row.email }, row.id).getValue()
    );
  }
}
```

Repita o mesmo padrão para `TurnoRepository`, `SupervisorRepository` e
`SolicitacaoTrocaTurnoRepository` (essas duas últimas têm métodos extras — veja a
tabela de exports abaixo).

### 2. Monte e chame os use-cases

```ts
import { CriarFuncionarioUseCase } from "shift-swap";

const funcionarioRepository = new PrismaFuncionarioRepository(prisma);
const criarFuncionario = new CriarFuncionarioUseCase(funcionarioRepository);

app.post("/funcionarios", async (req, res) => {
  const result = await criarFuncionario.execute(req.body); // { name, email }

  if (result.isFailure) {
    return res.status(400).json({ error: result.error });
  }

  const funcionario = result.getValue();
  return res.status(201).json({
    id: funcionario.id,
    name: funcionario.name.value,
    email: funcionario.email.value,
  });
});
```

Esse é o formato geral de **todo** use-case: monte com os repositórios via construtor,
chame `execute(input)`, trate `isSuccess`/`isFailure`. Nenhum deles lança exceção para
erro de validação ou de regra de negócio.

### 3. Autenticação (ex.: BetterAuth)

As entidades aceitam um `id` explícito na criação justamente para permitir reaproveitar
o id gerado pelo seu provedor de autenticação, evitando uma tabela de vínculo extra:

```ts
const { user } = await auth.api.signUpEmail({
  body: { email, password, name },
});

const result = await criarFuncionario.execute({
  id: user.id, // mesmo id do usuário autenticado
  name: user.name,
  email: user.email,
});
```

A partir daí, `FuncionarioEntity.id === authUser.id`, e a API decide qual conjunto de
use-cases expor com base no papel do usuário logado (ex.: um `Funcionario` só pode
chamar `ListarTurnosPorFuncionarioEDataUseCase`/`ListarTurnosDisponiveisParaTrocaUseCase`,
enquanto um `Supervisor` pode chamar `ListarTurnosUseCase` para ver tudo).

## O que a lib exporta

### Domínio compartilhado
| Export | Descrição |
| --- | --- |
| `Result<T>` | Canal de erro/sucesso usado por toda a lib |

### Entidades e Value Objects
| Export | Descrição |
| --- | --- |
| `FuncionarioEntity` | Pessoa que executa turnos e solicita trocas |
| `SupervisorEntity` | Pessoa com visão de todos os turnos |
| `Turno` | Um turno de trabalho (`data`, `horaInicio`, `horaFim`, dono atual) |
| `SolicitacaoTrocaTurno`, `StatusSolicitacaoTrocaTurno` | Pedido de troca de um turno, com ciclo de vida `pendente` → `aceita`/`cancelada` |
| `NameVO`, `EmailVO` | Value Objects usados internamente por `FuncionarioEntity`/`SupervisorEntity` |

### Ports (implemente com seu banco)
| Export | Métodos extras além do CRUD básico |
| --- | --- |
| `FuncionarioRepository` | — |
| `SupervisorRepository` | — |
| `TurnoRepository` | `findByFuncionarioIdAndData(funcionarioId, data)` |
| `SolicitacaoTrocaTurnoRepository` | `findPendentesByTurnoId(turnoId)`, `findPendentesExcetoSolicitante(solicitanteId)` |

### Use-cases
| Funcionário | Supervisor | Turno | Troca de turno |
| --- | --- | --- | --- |
| `CriarFuncionarioUseCase` | `CriarSupervisorUseCase` | `CriarTurnoUseCase` | `SolicitarTrocaTurnoUseCase` |
| `BuscarFuncionarioPorIdUseCase` | | `BuscarTurnoPorIdUseCase` | `AceitarTrocaTurnoUseCase` |
| `ListarFuncionariosUseCase` | | `ListarTurnosUseCase` | `CancelarTrocaTurnoUseCase` |
| `AtualizarFuncionarioUseCase` | | `AtualizarTurnoUseCase` | `BuscarSolicitacaoTrocaTurnoPorIdUseCase` |
| `RemoverFuncionarioUseCase` | | `RemoverTurnoUseCase` | `ListarSolicitacoesTrocaTurnoUseCase` |
| | | `ListarTurnosPorFuncionarioEDataUseCase` | `ListarTurnosDisponiveisParaTrocaUseCase` |

> `SolicitacaoTrocaTurno` propositalmente não tem update/delete genérico — só
> `create`/`read` e as transições de estado (`aceitar`/`cancelar`), para preservar o
> histórico da troca.

## Scripts (para desenvolver a própria lib)

```bash
bun run lint      # formatação + lint (Biome)
bun test          # roda a suíte de testes
bun run build     # gera dist/ (ESM + CJS + .d.ts)
```

## Release

CI (`.github/workflows/ci.yml`) roda testes e build em todo push/PR para `master`.
Publicar uma nova versão no npm é automático a partir de uma tag:

```bash
npm version patch   # ou minor/major — atualiza a versão no package.json e cria a tag
git push --follow-tags
```

O push da tag `vX.Y.Z` dispara `.github/workflows/publish.yml`, que roda a suíte, builda
e publica no npm via `bun publish`. Requer o secret `NPM_TOKEN` configurado no
repositório do GitHub (Settings → Secrets and variables → Actions), gerado como
Automation Token em npmjs.com.

Para contribuir com a lib, veja as convenções em [CLAUDE.md](./CLAUDE.md).
