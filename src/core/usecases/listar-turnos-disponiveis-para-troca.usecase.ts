import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface ListarTurnosDisponiveisParaTrocaInput {
  funcionarioId: string;
}

class ListarTurnosDisponiveisParaTrocaUseCase extends UseCase<
  ListarTurnosDisponiveisParaTrocaInput,
  SolicitacaoTrocaTurno[]
> {
  constructor(private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository) {
    super();
  }

  async execute(
    input: ListarTurnosDisponiveisParaTrocaInput,
  ): Promise<Result<SolicitacaoTrocaTurno[]>> {
    const solicitacoes = await this.solicitacaoRepository.findPendentesExcetoSolicitante(
      input.funcionarioId,
    );

    return Result.ok<SolicitacaoTrocaTurno[]>(solicitacoes);
  }
}

export { ListarTurnosDisponiveisParaTrocaUseCase };
