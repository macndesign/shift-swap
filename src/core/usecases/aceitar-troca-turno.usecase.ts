import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";
import type { TurnoRepository } from "../ports/turno.repository";
import { temConflitoDeHorario } from "./conflito-horario";

interface AceitarTrocaTurnoInput {
  solicitacaoId: string;
  funcionarioId: string;
}

/** O destinatário (funcionário B) aceita a troca; a solicitação passa a aguardar o supervisor. */
class AceitarTrocaTurnoUseCase extends UseCase<AceitarTrocaTurnoInput, SolicitacaoTrocaTurno> {
  constructor(
    private readonly turnoRepository: TurnoRepository,
    private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository,
  ) {
    super();
  }

  async execute(input: AceitarTrocaTurnoInput): Promise<Result<SolicitacaoTrocaTurno>> {
    const solicitacao = await this.solicitacaoRepository.findById(input.solicitacaoId);
    if (!solicitacao) {
      return Result.fail<SolicitacaoTrocaTurno>("Solicitação não encontrada");
    }

    // Só vale checar o conflito de quem de fato pode aceitar; para os demais, a entidade
    // devolve o erro certo (outro destinatário, estado inválido).
    if (input.funcionarioId === solicitacao.destinatarioId && solicitacao.status === "pendente") {
      const turnosDoDestinatario = await this.turnoRepository.findByFuncionarioIdAndData(
        input.funcionarioId,
        solicitacao.turno.data,
      );
      if (temConflitoDeHorario(turnosDoDestinatario, solicitacao.turno)) {
        return Result.fail<SolicitacaoTrocaTurno>("Funcionário já possui um turno nesse horário");
      }
    }

    const aceitarOrError = solicitacao.aceitar({ funcionarioId: input.funcionarioId });
    if (aceitarOrError.isFailure) {
      return Result.fail<SolicitacaoTrocaTurno>(aceitarOrError.error as string | Error);
    }

    await this.solicitacaoRepository.update(solicitacao);

    return Result.ok<SolicitacaoTrocaTurno>(solicitacao);
  }
}

export { AceitarTrocaTurnoUseCase };
