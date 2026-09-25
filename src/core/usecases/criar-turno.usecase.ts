import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { Turno, type TurnoProps } from "../entities/turno.entity";
import type { TurnoRepository } from "../ports/turno.repository";

class CriarTurnoUseCase extends UseCase<TurnoProps, Turno> {
  constructor(private readonly turnoRepository: TurnoRepository) {
    super();
  }

  async execute(input: TurnoProps): Promise<Result<Turno>> {
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
