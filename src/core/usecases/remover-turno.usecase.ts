import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import { opcoesDeId, SupervisorId, TurnoId } from "../entities/ids";
import { naoEncontrado } from "../erros";
import type { SupervisorRepository } from "../ports/supervisor.repository";
import type { TurnoRepository } from "../ports/turno.repository";

interface RemoverTurnoInput {
  supervisorId: string;
  id: string;
}

type Erro = ValidationError | NotFoundError;

/** Só o supervisor exclui turnos. */
class RemoverTurnoUseCase extends BaseUseCase<RemoverTurnoInput, void, Erro> {
  constructor(
    private readonly supervisorRepository: Pick<SupervisorRepository, "findById">,
    private readonly turnoRepository: Pick<TurnoRepository, "findById" | "delete">,
  ) {
    super();
  }

  protected async handle(input: RemoverTurnoInput): Promise<Result<void, Erro>> {
    const ids = Result.combine([
      SupervisorId.from(input.supervisorId, opcoesDeId("supervisorId")),
      TurnoId.from(input.id, opcoesDeId("id")),
    ]);
    if (ids.isFail()) return ids;
    const [supervisorId, turnoId] = ids.value;

    if (!(await this.supervisorRepository.findById(supervisorId))) {
      return Result.fail(naoEncontrado.supervisor());
    }
    if (!(await this.turnoRepository.findById(turnoId))) {
      return Result.fail(naoEncontrado.turno());
    }

    await this.turnoRepository.delete(turnoId);
    return Result.ok();
  }
}

export { RemoverTurnoUseCase };
