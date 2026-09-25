import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { TurnoRepository } from "../ports/turno.repository";

interface RemoverTurnoInput {
  id: string;
}

class RemoverTurnoUseCase extends UseCase<RemoverTurnoInput, void> {
  constructor(private readonly turnoRepository: TurnoRepository) {
    super();
  }

  async execute(input: RemoverTurnoInput): Promise<Result<void>> {
    const turno = await this.turnoRepository.findById(input.id);
    if (!turno) {
      return Result.fail<void>("Turno não encontrado");
    }

    await this.turnoRepository.delete(input.id);

    return Result.ok<void>();
  }
}

export { RemoverTurnoUseCase };
