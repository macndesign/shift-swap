import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { Turno } from "../entities/turno.entity";
import { TurnoRepository } from "../ports/turno.repository";

interface ListarTurnosPorFuncionarioEDataInput {
  funcionarioId: string;
  data: string;
}

class ListarTurnosPorFuncionarioEDataUseCase extends UseCase<ListarTurnosPorFuncionarioEDataInput, Turno[]> {
  constructor(private readonly turnoRepository: TurnoRepository) {
    super();
  }

  async execute(input: ListarTurnosPorFuncionarioEDataInput): Promise<Result<Turno[]>> {
    const turnos = await this.turnoRepository.findByFuncionarioIdAndData(
      input.funcionarioId,
      input.data
    );

    return Result.ok<Turno[]>(turnos);
  }
}

export { ListarTurnosPorFuncionarioEDataUseCase };
