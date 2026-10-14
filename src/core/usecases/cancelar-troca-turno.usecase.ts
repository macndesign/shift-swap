import {
  BaseUseCase,
  ForbiddenError,
  type NotFoundError,
  Result,
  type ValidationError,
} from "core-kernel";
import { FuncionarioId, opcoesDeId, SolicitacaoTrocaTurnoId } from "../entities/ids";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { ErroTransicao } from "../entities/solicitacao-troca-turno.state";
import { CODIGOS_ERRO, naoEncontrado } from "../erros";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface CancelarTrocaTurnoInput {
  solicitacaoId: string;
  solicitanteId: string;
}

type Erro = ValidationError | NotFoundError | ErroTransicao;

/** O solicitante desiste da troca enquanto ela ainda está em aberto. */
class CancelarTrocaTurnoUseCase extends BaseUseCase<
  CancelarTrocaTurnoInput,
  SolicitacaoTrocaTurno,
  Erro
> {
  constructor(
    private readonly solicitacaoRepository: Pick<
      SolicitacaoTrocaTurnoRepository,
      "findById" | "update"
    >,
  ) {
    super();
  }

  protected async handle(
    input: CancelarTrocaTurnoInput,
  ): Promise<Result<SolicitacaoTrocaTurno, Erro>> {
    const ids = Result.combine([
      SolicitacaoTrocaTurnoId.from(input.solicitacaoId, opcoesDeId("solicitacaoId")),
      FuncionarioId.from(input.solicitanteId, opcoesDeId("solicitanteId")),
    ]);
    if (ids.isFail()) return ids;
    const [solicitacaoId, solicitanteId] = ids.value;

    const solicitacao = await this.solicitacaoRepository.findById(solicitacaoId);
    if (!solicitacao) return Result.fail(naoEncontrado.solicitacao());

    if (!solicitacao.solicitanteId.equals(solicitanteId)) {
      return Result.fail(
        new ForbiddenError("Somente o solicitante pode cancelar a solicitação", {
          code: CODIGOS_ERRO.SOMENTE_SOLICITANTE,
        }),
      );
    }

    const cancelada = solicitacao.cancelar();
    if (cancelada.isFail()) return cancelada;

    await this.solicitacaoRepository.update(solicitacao);
    return Result.ok(solicitacao);
  }
}

export { CancelarTrocaTurnoUseCase };
