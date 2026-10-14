import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import { opcoesDeId, SupervisorId, TurnoId } from "../entities/ids.js";
import type { Turno } from "../entities/turno.entity.js";
import { naoEncontrado } from "../erros.js";
import type { SupervisorRepository } from "../ports/supervisor.repository.js";
import type { TurnoRepository } from "../ports/turno.repository.js";

interface AtualizarTurnoInput {
  supervisorId: string;
  id: string;
  data: string;
  horaInicio: string;
  horaFim: string;
}

type Erro = ValidationError | NotFoundError;

/** Só o supervisor altera turnos. */
class AtualizarTurnoUseCase extends BaseUseCase<AtualizarTurnoInput, Turno, Erro> {
  constructor(
    private readonly supervisorRepository: Pick<SupervisorRepository, "findById">,
    private readonly turnoRepository: Pick<TurnoRepository, "findById" | "update">,
  ) {
    super();
  }

  protected async handle(input: AtualizarTurnoInput): Promise<Result<Turno, Erro>> {
    const ids = Result.combine([
      SupervisorId.from(input.supervisorId, opcoesDeId("supervisorId")),
      TurnoId.from(input.id, opcoesDeId("id")),
    ]);
    if (ids.isFail()) return ids;
    const [supervisorId, turnoId] = ids.value;

    if (!(await this.supervisorRepository.findById(supervisorId))) {
      return Result.fail(naoEncontrado.supervisor());
    }
    const turno = await this.turnoRepository.findById(turnoId);
    if (!turno) return Result.fail(naoEncontrado.turno());

    const atualizado = turno.atualizarHorario({
      data: input.data,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
    });
    if (atualizado.isFail()) return atualizado;

    await this.turnoRepository.update(turno);
    return Result.ok(turno);
  }
}

export { AtualizarTurnoUseCase };
