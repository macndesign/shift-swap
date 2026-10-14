import {
  BaseUseCase,
  ConflictError,
  type ForbiddenError,
  type NotFoundError,
  Result,
  type ValidationError,
} from "core-kernel";
import { FuncionarioId, opcoesDeId, TurnoId } from "../entities/ids";
import { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import { CODIGOS_ERRO, naoEncontrado } from "../erros";
import type { FuncionarioRepository } from "../ports/funcionario.repository";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";
import type { TurnoRepository } from "../ports/turno.repository";

interface SolicitarTrocaTurnoInput {
  turnoId: string;
  solicitanteId: string;
  destinatarioId: string;
}

type Erro = ValidationError | NotFoundError | ConflictError | ForbiddenError;

class SolicitarTrocaTurnoUseCase extends BaseUseCase<
  SolicitarTrocaTurnoInput,
  SolicitacaoTrocaTurno,
  Erro
> {
  constructor(
    private readonly turnoRepository: Pick<TurnoRepository, "findById">,
    private readonly funcionarioRepository: Pick<FuncionarioRepository, "findById">,
    private readonly solicitacaoRepository: Pick<
      SolicitacaoTrocaTurnoRepository,
      "create" | "findEmAbertoByTurnoId"
    >,
  ) {
    super();
  }

  protected async handle(
    input: SolicitarTrocaTurnoInput,
  ): Promise<Result<SolicitacaoTrocaTurno, Erro>> {
    const ids = Result.combine([
      TurnoId.from(input.turnoId, opcoesDeId("turnoId")),
      FuncionarioId.from(input.solicitanteId, opcoesDeId("solicitanteId")),
      FuncionarioId.from(input.destinatarioId, opcoesDeId("destinatarioId")),
    ]);
    if (ids.isFail()) return ids;
    const [turnoId, solicitanteId, destinatarioId] = ids.value;

    const turno = await this.turnoRepository.findById(turnoId);
    if (!turno) return Result.fail(naoEncontrado.turno());

    if (!(await this.funcionarioRepository.findById(destinatarioId))) {
      return Result.fail(naoEncontrado.funcionario());
    }

    const emAberto = await this.solicitacaoRepository.findEmAbertoByTurnoId(turno.id);
    if (emAberto.length > 0) {
      return Result.fail(
        new ConflictError("Já existe uma solicitação em aberto para esse turno", {
          code: CODIGOS_ERRO.SOLICITACAO_EM_ABERTO_EXISTENTE,
        }),
      );
    }

    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId, destinatarioId });
    if (solicitacao.isFail()) return solicitacao;

    await this.solicitacaoRepository.create(solicitacao.value);
    return Result.ok(solicitacao.value);
  }
}

export { SolicitarTrocaTurnoUseCase };
