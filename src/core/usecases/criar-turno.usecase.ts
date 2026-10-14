import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import { idDoCampo, SupervisorId } from "../entities/ids";
import { type CriarTurnoProps, Turno } from "../entities/turno.entity";
import { naoEncontrado } from "../erros";
import type { SupervisorRepository } from "../ports/supervisor.repository";
import type { TurnoRepository } from "../ports/turno.repository";

interface CriarTurnoInput extends CriarTurnoProps {
  supervisorId: string;
}

/** Só o supervisor cria turnos para os funcionários. */
class CriarTurnoUseCase extends BaseUseCase<
  CriarTurnoInput,
  Turno,
  ValidationError | NotFoundError
> {
  constructor(
    private readonly supervisorRepository: Pick<SupervisorRepository, "findById">,
    private readonly turnoRepository: Pick<TurnoRepository, "create">,
  ) {
    super();
  }

  protected async handle(
    input: CriarTurnoInput,
  ): Promise<Result<Turno, ValidationError | NotFoundError>> {
    const supervisorId = idDoCampo(SupervisorId.from(input.supervisorId), "supervisorId");
    if (supervisorId.isFail()) return supervisorId;
    if (!(await this.supervisorRepository.findById(supervisorId.value))) {
      return Result.fail(naoEncontrado.supervisor());
    }

    const turno = Turno.create(input);
    if (turno.isFail()) return turno;

    await this.turnoRepository.create(turno.value);
    return Result.ok(turno.value);
  }
}

export { CriarTurnoUseCase };
