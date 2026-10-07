import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { Turno } from "../entities/turno.entity";
import type { SupervisorRepository } from "../ports/supervisor.repository";
import type { TurnoRepository } from "../ports/turno.repository";

interface AtualizarTurnoInput {
  supervisorId: string;
  id: string;
  data: string;
  horaInicio: string;
  horaFim: string;
}

/** Só o supervisor altera o horário de um turno. */
class AtualizarTurnoUseCase extends UseCase<AtualizarTurnoInput, Turno> {
  constructor(
    private readonly supervisorRepository: SupervisorRepository,
    private readonly turnoRepository: TurnoRepository,
  ) {
    super();
  }

  async execute(input: AtualizarTurnoInput): Promise<Result<Turno>> {
    const supervisor = await this.supervisorRepository.findById(input.supervisorId);
    if (!supervisor) {
      return Result.fail<Turno>("Supervisor não encontrado");
    }

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
