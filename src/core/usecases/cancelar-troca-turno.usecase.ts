import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface CancelarTrocaTurnoInput {
  solicitacaoId: string;
  solicitanteId: string;
}

class CancelarTrocaTurnoUseCase extends UseCase<CancelarTrocaTurnoInput, SolicitacaoTrocaTurno> {
  constructor(private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository) {
    super();
  }

  async execute(input: CancelarTrocaTurnoInput): Promise<Result<SolicitacaoTrocaTurno>> {
    const solicitacao = await this.solicitacaoRepository.findById(input.solicitacaoId);
    if (!solicitacao) {
      return Result.fail<SolicitacaoTrocaTurno>("Solicitação não encontrada");
    }

    if (solicitacao.solicitanteId !== input.solicitanteId) {
      return Result.fail<SolicitacaoTrocaTurno>(
        "Somente o solicitante pode cancelar a solicitação",
      );
    }

    const cancelarOrError = solicitacao.cancelar();
    if (cancelarOrError.isFailure) {
      return Result.fail<SolicitacaoTrocaTurno>(cancelarOrError.error as string | Error);
    }

    await this.solicitacaoRepository.update(solicitacao);

    return Result.ok<SolicitacaoTrocaTurno>(solicitacao);
  }
}

export { CancelarTrocaTurnoUseCase };
