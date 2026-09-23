import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { Turno } from "../entities/turno.entity";
import { TurnoRepository } from "../ports/turno.repository";

interface AtualizarTurnoInput {
  id: string;
  data: string;
  horaInicio: string;
  horaFim: string;
}

class AtualizarTurnoUseCase extends UseCase<AtualizarTurnoInput, Turno> {
  constructor(private readonly turnoRepository: TurnoRepository) {
    super();
  }

  async execute(input: AtualizarTurnoInput): Promise<Result<Turno>> {
    const turno = await this.turnoRepository.findById(input.id);
    if (!turno) {
      return Result.fail<Turno>("Turno não encontrado");
    }

    const atualizarOrError = turno.atualizarHorario({
      data: input.data,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
    });
    if (atualizarOrError.isFailure) {
      return Result.fail<Turno>(atualizarOrError.error as string | Error);
    }

    await this.turnoRepository.update(turno);

    return Result.ok<Turno>(turno);
  }
}

export { AtualizarTurnoUseCase };
