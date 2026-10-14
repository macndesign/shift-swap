import {
  BaseUseCase,
  type Clock,
  ConflictError,
  type NotFoundError,
  Result,
  type ValidationError,
} from "core-kernel";
import { FuncionarioId, opcoesDeId, SolicitacaoTrocaTurnoId } from "../entities/ids.js";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity.js";
import type { ErroTransicao } from "../entities/solicitacao-troca-turno.state.js";
import { CODIGOS_ERRO, naoEncontrado } from "../erros.js";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository.js";
import type { TurnoRepository } from "../ports/turno.repository.js";
import { temConflitoDeHorario } from "./conflito-horario.js";

interface AceitarTrocaTurnoInput {
  solicitacaoId: string;
  funcionarioId: string;
}

type Erro = ValidationError | NotFoundError | ErroTransicao;

/** O destinatário aceita; a solicitação passa a aguardar a decisão do supervisor. */
class AceitarTrocaTurnoUseCase extends BaseUseCase<
  AceitarTrocaTurnoInput,
  SolicitacaoTrocaTurno,
  Erro
> {
  constructor(
    private readonly turnoRepository: Pick<TurnoRepository, "findByFuncionarioIdAndData">,
    private readonly solicitacaoRepository: Pick<
      SolicitacaoTrocaTurnoRepository,
      "findById" | "update"
    >,
    private readonly clock: Clock,
  ) {
    super();
  }

  protected async handle(
    input: AceitarTrocaTurnoInput,
  ): Promise<Result<SolicitacaoTrocaTurno, Erro>> {
    const ids = Result.combine([
      SolicitacaoTrocaTurnoId.from(input.solicitacaoId, opcoesDeId("solicitacaoId")),
      FuncionarioId.from(input.funcionarioId, opcoesDeId("funcionarioId")),
    ]);
    if (ids.isFail()) return ids;
    const [solicitacaoId, funcionarioId] = ids.value;

    const solicitacao = await this.solicitacaoRepository.findById(solicitacaoId);
    if (!solicitacao) return Result.fail(naoEncontrado.solicitacao());

    // Só vale checar o conflito de quem de fato pode aceitar; para os demais, a entidade
    // devolve o erro certo (outro destinatário, estado inválido).
    if (funcionarioId.equals(solicitacao.destinatarioId) && solicitacao.status === "pendente") {
      const turnosDoDestinatario = await this.turnoRepository.findByFuncionarioIdAndData(
        funcionarioId,
        solicitacao.turno.data,
      );
      if (temConflitoDeHorario(turnosDoDestinatario, solicitacao.turno)) {
        return Result.fail(
          new ConflictError("Funcionário já possui um turno nesse horário", {
            code: CODIGOS_ERRO.CONFLITO_DE_HORARIO,
          }),
        );
      }
    }

    const aceita = solicitacao.aceitar({ funcionarioId, agora: this.clock.now() });
    if (aceita.isFail()) return aceita;

    await this.solicitacaoRepository.update(solicitacao);
    return Result.ok(solicitacao);
  }
}

export { AceitarTrocaTurnoUseCase };
