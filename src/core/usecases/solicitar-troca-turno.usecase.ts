import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { FuncionarioRepository } from "../ports/funcionario.repository";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";
import type { TurnoRepository } from "../ports/turno.repository";

interface SolicitarTrocaTurnoInput {
  turnoId: string;
  solicitanteId: string;
  destinatarioId: string;
}

class SolicitarTrocaTurnoUseCase extends UseCase<SolicitarTrocaTurnoInput, SolicitacaoTrocaTurno> {
  constructor(
    private readonly turnoRepository: TurnoRepository,
    private readonly funcionarioRepository: FuncionarioRepository,
    private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository,
  ) {
    super();
  }

  async execute(input: SolicitarTrocaTurnoInput): Promise<Result<SolicitacaoTrocaTurno>> {
    const turno = await this.turnoRepository.findById(input.turnoId);
    if (!turno) {
      return Result.fail<SolicitacaoTrocaTurno>("Turno não encontrado");
    }

    const destinatario = await this.funcionarioRepository.findById(input.destinatarioId);
    if (!destinatario) {
      return Result.fail<SolicitacaoTrocaTurno>("Funcionário não encontrado");
    }

    const emAberto = await this.solicitacaoRepository.findEmAbertoByTurnoId(turno.id);
    if (emAberto.length > 0) {
      return Result.fail<SolicitacaoTrocaTurno>(
        "Já existe uma solicitação em aberto para esse turno",
      );
    }

    const solicitacaoOrError = SolicitacaoTrocaTurno.create({
      turno,
      solicitanteId: input.solicitanteId,
      destinatarioId: input.destinatarioId,
    });
    if (solicitacaoOrError.isFailure) {
      return Result.fail<SolicitacaoTrocaTurno>(solicitacaoOrError.error as string | Error);
    }

    const solicitacao = solicitacaoOrError.getValue();
    await this.solicitacaoRepository.save(solicitacao);

    return Result.ok<SolicitacaoTrocaTurno>(solicitacao);
  }
}

export { SolicitarTrocaTurnoUseCase };
