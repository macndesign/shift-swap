import {
  BaseUseCase,
  type Clock,
  type NotFoundError,
  Result,
  type ValidationError,
} from "core-kernel";
import { opcoesDeId, SolicitacaoTrocaTurnoId, SupervisorId } from "../entities/ids";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { ErroTransicao } from "../entities/solicitacao-troca-turno.state";
import { naoEncontrado } from "../erros";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";
import type { SupervisorRepository } from "../ports/supervisor.repository";

interface RejeitarTrocaTurnoInput {
  solicitacaoId: string;
  supervisorId: string;
  motivo: string;
}

type Erro = ValidationError | NotFoundError | ErroTransicao;

/** O supervisor não autoriza uma troca já aceita (exige motivo). */
class RejeitarTrocaTurnoUseCase extends BaseUseCase<
  RejeitarTrocaTurnoInput,
  SolicitacaoTrocaTurno,
  Erro
> {
  constructor(
    private readonly supervisorRepository: Pick<SupervisorRepository, "findById">,
    private readonly solicitacaoRepository: Pick<
      SolicitacaoTrocaTurnoRepository,
      "findById" | "update"
    >,
    private readonly clock: Clock,
  ) {
    super();
  }

  protected async handle(
    input: RejeitarTrocaTurnoInput,
  ): Promise<Result<SolicitacaoTrocaTurno, Erro>> {
    const ids = Result.combine([
      SolicitacaoTrocaTurnoId.from(input.solicitacaoId, opcoesDeId("solicitacaoId")),
      SupervisorId.from(input.supervisorId, opcoesDeId("supervisorId")),
    ]);
    if (ids.isFail()) return ids;
    const [solicitacaoId, supervisorId] = ids.value;

    if (!(await this.supervisorRepository.findById(supervisorId))) {
      return Result.fail(naoEncontrado.supervisor());
    }

    const solicitacao = await this.solicitacaoRepository.findById(solicitacaoId);
    if (!solicitacao) return Result.fail(naoEncontrado.solicitacao());

    const rejeitada = solicitacao.rejeitar({
      supervisorId,
      motivo: input.motivo,
      agora: this.clock.now(),
    });
    if (rejeitada.isFail()) return rejeitada;

    await this.solicitacaoRepository.update(solicitacao);
    return Result.ok(solicitacao);
  }
}

export { RejeitarTrocaTurnoUseCase };
