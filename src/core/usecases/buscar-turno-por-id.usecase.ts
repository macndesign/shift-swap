import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import { opcoesDeId, TurnoId } from "../entities/ids.js";
import type { Turno } from "../entities/turno.entity.js";
import { naoEncontrado } from "../erros.js";
import type { TurnoRepository } from "../ports/turno.repository.js";

interface BuscarTurnoPorIdInput {
  id: string;
}

type Erro = ValidationError | NotFoundError;

class BuscarTurnoPorIdUseCase extends BaseUseCase<BuscarTurnoPorIdInput, Turno, Erro> {
  constructor(private readonly turnoRepository: Pick<TurnoRepository, "findById">) {
    super();
  }

  protected async handle(input: BuscarTurnoPorIdInput): Promise<Result<Turno, Erro>> {
    const id = TurnoId.from(input.id, opcoesDeId("id"));
    if (id.isFail()) return id;

    const turno = await this.turnoRepository.findById(id.value);
    return turno ? Result.ok(turno) : Result.fail(naoEncontrado.turno());
  }
}

export { BuscarTurnoPorIdUseCase };
