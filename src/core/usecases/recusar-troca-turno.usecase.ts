import {
  BaseUseCase,
  type Clock,
  type NotFoundError,
  Result,
  type ValidationError,
} from "core-kernel";
import { FuncionarioId, idDoCampo, SolicitacaoTrocaTurnoId } from "../entities/ids";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { ErroTransicao } from "../entities/solicitacao-troca-turno.state";
import { naoEncontrado } from "../erros";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface RecusarTrocaTurnoInput {
  solicitacaoId: string;
  funcionarioId: string;
  motivo?: string;
}

type Erro = ValidationError | NotFoundError | ErroTransicao;

/** O destinatário recusa; a solicitação é encerrada. */
class RecusarTrocaTurnoUseCase extends BaseUseCase<
  RecusarTrocaTurnoInput,
  SolicitacaoTrocaTurno,
  Erro
> {
  constructor(
    private readonly solicitacaoRepository: Pick<
      SolicitacaoTrocaTurnoRepository,
      "findById" | "update"
    >,
    private readonly clock: Clock,
  ) {
    super();
  }

  protected async handle(
    input: RecusarTrocaTurnoInput,
  ): Promise<Result<SolicitacaoTrocaTurno, Erro>> {
    const ids = Result.combine([
      idDoCampo(SolicitacaoTrocaTurnoId.from(input.solicitacaoId), "solicitacaoId"),
      idDoCampo(FuncionarioId.from(input.funcionarioId), "funcionarioId"),
    ]);
    if (ids.isFail()) return ids;
    const [solicitacaoId, funcionarioId] = ids.value;

    const solicitacao = await this.solicitacaoRepository.findById(solicitacaoId);
    if (!solicitacao) return Result.fail(naoEncontrado.solicitacao());

    const recusada = solicitacao.recusar({
      funcionarioId,
      agora: this.clock.now(),
      ...(input.motivo !== undefined ? { motivo: input.motivo } : {}),
    });
    if (recusada.isFail()) return recusada;

    await this.solicitacaoRepository.update(solicitacao);
    return Result.ok(solicitacao);
  }
}

export { RecusarTrocaTurnoUseCase };
