import { BaseUseCase, Result } from "core-kernel";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity.js";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository.js";

class ListarSolicitacoesTrocaTurnoUseCase extends BaseUseCase<void, SolicitacaoTrocaTurno[]> {
  constructor(
    private readonly solicitacaoRepository: Pick<SolicitacaoTrocaTurnoRepository, "findAll">,
  ) {
    super();
  }

  protected async handle(): Promise<Result<SolicitacaoTrocaTurno[], never>> {
    return Result.ok(await this.solicitacaoRepository.findAll());
  }
}

export { ListarSolicitacoesTrocaTurnoUseCase };
