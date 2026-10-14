import {
  BaseUseCase,
  type Clock,
  ConflictError,
  type NotFoundError,
  Result,
  type ValidationError,
} from "core-kernel";
import { opcoesDeId, SolicitacaoTrocaTurnoId, SupervisorId } from "../entities/ids";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { ErroTransicao } from "../entities/solicitacao-troca-turno.state";
import { CODIGOS_ERRO, naoEncontrado } from "../erros";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";
import type { SupervisorRepository } from "../ports/supervisor.repository";
import type { TurnoRepository } from "../ports/turno.repository";
import { temConflitoDeHorario } from "./conflito-horario";

interface AprovarTrocaTurnoInput {
  solicitacaoId: string;
  supervisorId: string;
}

type Erro = ValidationError | NotFoundError | ErroTransicao;

/** O supervisor autoriza uma troca que o destinatário já aceitou; o turno muda de dono. */
class AprovarTrocaTurnoUseCase extends BaseUseCase<
  AprovarTrocaTurnoInput,
  SolicitacaoTrocaTurno,
  Erro
> {
  constructor(
    private readonly supervisorRepository: Pick<SupervisorRepository, "findById">,
    private readonly turnoRepository: Pick<
      TurnoRepository,
      "findByFuncionarioIdAndData" | "update"
    >,
    private readonly solicitacaoRepository: Pick<
      SolicitacaoTrocaTurnoRepository,
      "findById" | "update"
    >,
    private readonly clock: Clock,
  ) {
    super();
  }

  protected async handle(
    input: AprovarTrocaTurnoInput,
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

    // A agenda do destinatário pode ter mudado desde o aceite, então confere de novo.
    // Em outros estados, a entidade devolve o erro de transição inválida.
    if (solicitacao.status === "aguardando_aprovacao") {
      const turnosDoDestinatario = await this.turnoRepository.findByFuncionarioIdAndData(
        solicitacao.destinatarioId,
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

    const aprovada = solicitacao.aprovar({ supervisorId, agora: this.clock.now() });
    if (aprovada.isFail()) return aprovada;

    // A aprovação altera dois registros: o turno (novo dono) e a solicitação.
    await this.turnoRepository.update(solicitacao.turno);
    await this.solicitacaoRepository.update(solicitacao);
    return Result.ok(solicitacao);
  }
}

export { AprovarTrocaTurnoUseCase };
