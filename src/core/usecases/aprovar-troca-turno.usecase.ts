import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { Turno } from "../entities/turno.entity";
import type { FuncionarioRepository } from "../ports/funcionario.repository";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";
import type { SupervisorRepository } from "../ports/supervisor.repository";
import type { TurnoRepository } from "../ports/turno.repository";

interface AprovarTrocaTurnoInput {
  solicitacaoId: string;
  supervisorId: string;
  destinatarioId: string;
}

function horariosSeSobrepoem(a: Turno, b: Turno): boolean {
  return a.horaInicio < b.horaFim && b.horaInicio < a.horaFim;
}

class AprovarTrocaTurnoUseCase extends UseCase<AprovarTrocaTurnoInput, SolicitacaoTrocaTurno> {
  constructor(
    private readonly supervisorRepository: SupervisorRepository,
    private readonly funcionarioRepository: FuncionarioRepository,
    private readonly turnoRepository: TurnoRepository,
    private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository,
  ) {
    super();
  }

  async execute(input: AprovarTrocaTurnoInput): Promise<Result<SolicitacaoTrocaTurno>> {
    const supervisor = await this.supervisorRepository.findById(input.supervisorId);
    if (!supervisor) {
      return Result.fail<SolicitacaoTrocaTurno>("Supervisor não encontrado");
    }

    const solicitacao = await this.solicitacaoRepository.findById(input.solicitacaoId);
    if (!solicitacao) {
      return Result.fail<SolicitacaoTrocaTurno>("Solicitação não encontrada");
    }

    const destinatario = await this.funcionarioRepository.findById(input.destinatarioId);
    if (!destinatario) {
      return Result.fail<SolicitacaoTrocaTurno>("Funcionário não encontrado");
    }

    const turnosDoDestinatario = await this.turnoRepository.findByFuncionarioIdAndData(
      input.destinatarioId,
      solicitacao.turno.data,
    );
    const temConflito = turnosDoDestinatario.some((turno) =>
      horariosSeSobrepoem(turno, solicitacao.turno),
    );
    if (temConflito) {
      return Result.fail<SolicitacaoTrocaTurno>("Funcionário já possui um turno nesse horário");
    }

    const aprovarOrError = solicitacao.aprovar({
      supervisorId: input.supervisorId,
      destinatarioId: input.destinatarioId,
    });
    if (aprovarOrError.isFailure) {
      return Result.fail<SolicitacaoTrocaTurno>(aprovarOrError.error as string | Error);
    }

    await this.turnoRepository.update(solicitacao.turno);
    await this.solicitacaoRepository.update(solicitacao);

    return Result.ok<SolicitacaoTrocaTurno>(solicitacao);
  }
}

export { AprovarTrocaTurnoUseCase };
