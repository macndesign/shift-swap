import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { Turno } from "../entities/turno.entity";
import type { TurnoRepository } from "../ports/turno.repository";

interface BuscarTurnoPorIdInput {
  id: string;
}

class BuscarTurnoPorIdUseCase extends UseCase<BuscarTurnoPorIdInput, Turno> {
  constructor(private readonly turnoRepository: TurnoRepository) {
    super();
  }

  async execute(input: BuscarTurnoPorIdInput): Promise<Result<Turno>> {
    const turno = await this.turnoRepository.findById(input.id);
    if (!turno) {
      return Result.fail<Turno>("Turno não encontrado");
    }

    return Result.ok<Turno>(turno);
  }
}

export { BuscarTurnoPorIdUseCase };
