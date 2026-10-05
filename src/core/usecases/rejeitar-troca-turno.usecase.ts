import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";
import type { SupervisorRepository } from "../ports/supervisor.repository";

interface RejeitarTrocaTurnoInput {
  solicitacaoId: string;
  supervisorId: string;
  motivo: string;
}

class RejeitarTrocaTurnoUseCase extends UseCase<RejeitarTrocaTurnoInput, SolicitacaoTrocaTurno> {
  constructor(
    private readonly supervisorRepository: SupervisorRepository,
    private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository,
  ) {
    super();
  }

  async execute(input: RejeitarTrocaTurnoInput): Promise<Result<SolicitacaoTrocaTurno>> {
    const supervisor = await this.supervisorRepository.findById(input.supervisorId);
    if (!supervisor) {
      return Result.fail<SolicitacaoTrocaTurno>("Supervisor não encontrado");
    }

    const solicitacao = await this.solicitacaoRepository.findById(input.solicitacaoId);
    if (!solicitacao) {
      return Result.fail<SolicitacaoTrocaTurno>("Solicitação não encontrada");
    }

    const rejeitarOrError = solicitacao.rejeitar({
      supervisorId: input.supervisorId,
      motivo: input.motivo,
    });
    if (rejeitarOrError.isFailure) {
      return Result.fail<SolicitacaoTrocaTurno>(rejeitarOrError.error as string | Error);
    }

    await this.solicitacaoRepository.update(solicitacao);

    return Result.ok<SolicitacaoTrocaTurno>(solicitacao);
  }
}

export { RejeitarTrocaTurnoUseCase };
