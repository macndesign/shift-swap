import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { Turno } from "../entities/turno.entity";
import type { TurnoRepository } from "../ports/turno.repository";

class ListarTurnosUseCase extends UseCase<void, Turno[]> {
  constructor(private readonly turnoRepository: TurnoRepository) {
    super();
  }

  async execute(): Promise<Result<Turno[]>> {
    const turnos = await this.turnoRepository.findAll();
    return Result.ok<Turno[]>(turnos);
  }
}

export { ListarTurnosUseCase };
