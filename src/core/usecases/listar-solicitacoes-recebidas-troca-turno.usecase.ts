import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface ListarSolicitacoesRecebidasTrocaTurnoInput {
  funcionarioId: string;
}

/** Pedidos de troca endereçados ao funcionário que ainda aguardam a resposta dele. */
class ListarSolicitacoesRecebidasTrocaTurnoUseCase extends UseCase<
  ListarSolicitacoesRecebidasTrocaTurnoInput,
  SolicitacaoTrocaTurno[]
> {
  constructor(private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository) {
    super();
  }

  async execute(
    input: ListarSolicitacoesRecebidasTrocaTurnoInput,
  ): Promise<Result<SolicitacaoTrocaTurno[]>> {
    const solicitacoes = await this.solicitacaoRepository.findPendentesByDestinatarioId(
      input.funcionarioId,
    );

    return Result.ok<SolicitacaoTrocaTurno[]>(solicitacoes);
  }
}

export { ListarSolicitacoesRecebidasTrocaTurnoUseCase };
