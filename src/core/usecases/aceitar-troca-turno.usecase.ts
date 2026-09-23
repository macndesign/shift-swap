import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import { Turno } from "../entities/turno.entity";
import { FuncionarioRepository } from "../ports/funcionario.repository";
import { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";
import { TurnoRepository } from "../ports/turno.repository";

interface AceitarTrocaTurnoInput {
  solicitacaoId: string;
  funcionarioId: string;
}

function horariosSeSobrepoem(a: Turno, b: Turno): boolean {
  return a.horaInicio < b.horaFim && b.horaInicio < a.horaFim;
}

class AceitarTrocaTurnoUseCase extends UseCase<AceitarTrocaTurnoInput, SolicitacaoTrocaTurno> {
  constructor(
    private readonly funcionarioRepository: FuncionarioRepository,
    private readonly turnoRepository: TurnoRepository,
    private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository
  ) {
    super();
  }

  async execute(input: AceitarTrocaTurnoInput): Promise<Result<SolicitacaoTrocaTurno>> {
    const solicitacao = await this.solicitacaoRepository.findById(input.solicitacaoId);
    if (!solicitacao) {
      return Result.fail<SolicitacaoTrocaTurno>("Solicitação não encontrada");
    }

    const funcionario = await this.funcionarioRepository.findById(input.funcionarioId);
    if (!funcionario) {
      return Result.fail<SolicitacaoTrocaTurno>("Funcionário não encontrado");
    }

    const turnosDoFuncionario = await this.turnoRepository.findByFuncionarioIdAndData(
      input.funcionarioId,
      solicitacao.turno.data
    );
    const temConflito = turnosDoFuncionario.some((turno) =>
      horariosSeSobrepoem(turno, solicitacao.turno)
    );
    if (temConflito) {
      return Result.fail<SolicitacaoTrocaTurno>("Funcionário já possui um turno nesse horário");
    }

    const aceitarOrError = solicitacao.aceitar(input.funcionarioId);
    if (aceitarOrError.isFailure) {
      return Result.fail<SolicitacaoTrocaTurno>(aceitarOrError.error as string | Error);
    }

    await this.turnoRepository.update(solicitacao.turno);
    await this.solicitacaoRepository.update(solicitacao);

    return Result.ok<SolicitacaoTrocaTurno>(solicitacao);
  }
}

export { AceitarTrocaTurnoUseCase };
