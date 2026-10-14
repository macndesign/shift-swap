import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import { idDoCampo, SupervisorId, TurnoId } from "../entities/ids";
import type { Turno } from "../entities/turno.entity";
import { naoEncontrado } from "../erros";
import type { SupervisorRepository } from "../ports/supervisor.repository";
import type { TurnoRepository } from "../ports/turno.repository";

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
      idDoCampo(SupervisorId.from(input.supervisorId), "supervisorId"),
      idDoCampo(TurnoId.from(input.id), "id"),
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
