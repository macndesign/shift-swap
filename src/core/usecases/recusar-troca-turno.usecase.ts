import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface RecusarTrocaTurnoInput {
  solicitacaoId: string;
  funcionarioId: string;
  motivo?: string;
}

/** O destinatário (funcionário B) não aceita a troca; a solicitação é encerrada. */
class RecusarTrocaTurnoUseCase extends UseCase<RecusarTrocaTurnoInput, SolicitacaoTrocaTurno> {
  constructor(private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository) {
    super();
  }

  async execute(input: RecusarTrocaTurnoInput): Promise<Result<SolicitacaoTrocaTurno>> {
    const solicitacao = await this.solicitacaoRepository.findById(input.solicitacaoId);
    if (!solicitacao) {
      return Result.fail<SolicitacaoTrocaTurno>("Solicitação não encontrada");
    }

    const recusarOrError = solicitacao.recusar({
      funcionarioId: input.funcionarioId,
      motivo: input.motivo,
    });
    if (recusarOrError.isFailure) {
      return Result.fail<SolicitacaoTrocaTurno>(recusarOrError.error as string | Error);
    }

    await this.solicitacaoRepository.update(solicitacao);

    return Result.ok<SolicitacaoTrocaTurno>(solicitacao);
  }
}

export { RecusarTrocaTurnoUseCase };
