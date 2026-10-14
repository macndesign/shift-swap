import { BaseUseCase, Result, type ValidationError } from "core-kernel";
import { FuncionarioId, opcoesDeId } from "../entities/ids";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface ListarSolicitacoesRecebidasTrocaTurnoInput {
  funcionarioId: string;
}

/** Pedidos `pendente` endereçados ao funcionário, à espera da resposta dele. */
class ListarSolicitacoesRecebidasTrocaTurnoUseCase extends BaseUseCase<
  ListarSolicitacoesRecebidasTrocaTurnoInput,
  SolicitacaoTrocaTurno[],
  ValidationError
> {
  constructor(
    private readonly solicitacaoRepository: Pick<
      SolicitacaoTrocaTurnoRepository,
      "findPendentesByDestinatarioId"
    >,
  ) {
    super();
  }

  protected async handle(
    input: ListarSolicitacoesRecebidasTrocaTurnoInput,
  ): Promise<Result<SolicitacaoTrocaTurno[], ValidationError>> {
    const funcionarioId = FuncionarioId.from(input.funcionarioId, opcoesDeId("funcionarioId"));
    if (funcionarioId.isFail()) return funcionarioId;

    return Result.ok(
      await this.solicitacaoRepository.findPendentesByDestinatarioId(funcionarioId.value),
    );
  }
}

export { ListarSolicitacoesRecebidasTrocaTurnoUseCase };
