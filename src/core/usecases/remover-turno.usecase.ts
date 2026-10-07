import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SupervisorRepository } from "../ports/supervisor.repository";
import type { TurnoRepository } from "../ports/turno.repository";

interface RemoverTurnoInput {
  supervisorId: string;
  id: string;
}

/** Só o supervisor exclui turnos. */
class RemoverTurnoUseCase extends UseCase<RemoverTurnoInput, void> {
  constructor(
    private readonly supervisorRepository: SupervisorRepository,
    private readonly turnoRepository: TurnoRepository,
  ) {
    super();
  }

  async execute(input: RemoverTurnoInput): Promise<Result<void>> {
    const supervisor = await this.supervisorRepository.findById(input.supervisorId);
    if (!supervisor) {
      return Result.fail<void>("Supervisor não encontrado");
    }

    const turno = await this.turnoRepository.findById(input.id);
    if (!turno) {
      return Result.fail<void>("Turno não encontrado");
    }

    await this.turnoRepository.delete(input.id);

    return Result.ok<void>();
  }
}

export { RemoverTurnoUseCase };
