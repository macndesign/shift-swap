import { BaseUseCase, Result } from "core-kernel";
import type { Turno } from "../entities/turno.entity.js";
import type { TurnoRepository } from "../ports/turno.repository.js";

class ListarTurnosUseCase extends BaseUseCase<void, Turno[]> {
  constructor(private readonly turnoRepository: Pick<TurnoRepository, "findAll">) {
    super();
  }

  protected async handle(): Promise<Result<Turno[], never>> {
    return Result.ok(await this.turnoRepository.findAll());
  }
}

export { ListarTurnosUseCase };
