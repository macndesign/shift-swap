import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

class ListarSolicitacoesTrocaTurnoUseCase extends UseCase<void, SolicitacaoTrocaTurno[]> {
  constructor(private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository) {
    super();
  }

  async execute(): Promise<Result<SolicitacaoTrocaTurno[]>> {
    const solicitacoes = await this.solicitacaoRepository.findAll();
    return Result.ok<SolicitacaoTrocaTurno[]>(solicitacoes);
  }
}

export { ListarSolicitacoesTrocaTurnoUseCase };
