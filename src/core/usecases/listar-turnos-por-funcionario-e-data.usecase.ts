import { BaseUseCase, Result, type ValidationError } from "core-kernel";
import { FuncionarioId, opcoesDeId } from "../entities/ids";
import type { Turno } from "../entities/turno.entity";
import type { TurnoRepository } from "../ports/turno.repository";

interface ListarTurnosPorFuncionarioEDataInput {
  funcionarioId: string;
  data: string;
}

class ListarTurnosPorFuncionarioEDataUseCase extends BaseUseCase<
  ListarTurnosPorFuncionarioEDataInput,
  Turno[],
  ValidationError
> {
  constructor(
    private readonly turnoRepository: Pick<TurnoRepository, "findByFuncionarioIdAndData">,
  ) {
    super();
  }

  protected async handle(
    input: ListarTurnosPorFuncionarioEDataInput,
  ): Promise<Result<Turno[], ValidationError>> {
    const funcionarioId = FuncionarioId.from(input.funcionarioId, opcoesDeId("funcionarioId"));
    if (funcionarioId.isFail()) return funcionarioId;

    return Result.ok(
      await this.turnoRepository.findByFuncionarioIdAndData(funcionarioId.value, input.data),
    );
  }
}

export { ListarTurnosPorFuncionarioEDataUseCase };
