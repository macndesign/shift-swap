import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { Turno, type TurnoProps } from "../entities/turno.entity";
import type { SupervisorRepository } from "../ports/supervisor.repository";
import type { TurnoRepository } from "../ports/turno.repository";

interface CriarTurnoInput extends TurnoProps {
  supervisorId: string;
}

/** Só o supervisor cria turnos para os funcionários. */
class CriarTurnoUseCase extends UseCase<CriarTurnoInput, Turno> {
  constructor(
    private readonly supervisorRepository: SupervisorRepository,
    private readonly turnoRepository: TurnoRepository,
  ) {
    super();
  }

  async execute(input: CriarTurnoInput): Promise<Result<Turno>> {
    const supervisor = await this.supervisorRepository.findById(input.supervisorId);
    if (!supervisor) {
      return Result.fail<Turno>("Supervisor não encontrado");
    }

    const turnoOrError = Turno.create(input);
    if (turnoOrError.isFailure) {
      return Result.fail<Turno>(turnoOrError.error as string | Error);
    }

    const turno = turnoOrError.getValue();
    await this.turnoRepository.save(turno);

    return Result.ok<Turno>(turno);
  }
}

export { CriarTurnoUseCase };
