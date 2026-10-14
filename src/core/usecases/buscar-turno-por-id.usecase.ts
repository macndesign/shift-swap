import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import { idDoCampo, TurnoId } from "../entities/ids";
import type { Turno } from "../entities/turno.entity";
import { naoEncontrado } from "../erros";
import type { TurnoRepository } from "../ports/turno.repository";

interface BuscarTurnoPorIdInput {
  id: string;
}

type Erro = ValidationError | NotFoundError;

class BuscarTurnoPorIdUseCase extends BaseUseCase<BuscarTurnoPorIdInput, Turno, Erro> {
  constructor(private readonly turnoRepository: Pick<TurnoRepository, "findById">) {
    super();
  }

  protected async handle(input: BuscarTurnoPorIdInput): Promise<Result<Turno, Erro>> {
    const id = idDoCampo(TurnoId.from(input.id), "id");
    if (id.isFail()) return id;

    const turno = await this.turnoRepository.findById(id.value);
    return turno ? Result.ok(turno) : Result.fail(naoEncontrado.turno());
  }
}

export { BuscarTurnoPorIdUseCase };
