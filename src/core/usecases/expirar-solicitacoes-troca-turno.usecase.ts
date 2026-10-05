import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface ExpirarSolicitacoesTrocaTurnoInput {
  /** Data e hora atuais no formato `YYYY-MM-DDTHH:mm`, no mesmo fuso dos turnos. */
  referencia: string;
}

const REFERENCIA_REGEX = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;

class ExpirarSolicitacoesTrocaTurnoUseCase extends UseCase<
  ExpirarSolicitacoesTrocaTurnoInput,
  SolicitacaoTrocaTurno[]
> {
  constructor(private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository) {
    super();
  }

  async execute(
    input: ExpirarSolicitacoesTrocaTurnoInput,
  ): Promise<Result<SolicitacaoTrocaTurno[]>> {
    if (!REFERENCIA_REGEX.test(input.referencia)) {
      return Result.fail<SolicitacaoTrocaTurno[]>(`Referência inválida: ${input.referencia}`);
    }

    const pendentes = await this.solicitacaoRepository.findPendentes();
    const expiradas: SolicitacaoTrocaTurno[] = [];

    for (const solicitacao of pendentes) {
      const inicioDoTurno = `${solicitacao.turno.data}T${solicitacao.turno.horaInicio}`;
      if (inicioDoTurno > input.referencia) {
        continue;
      }

      const expirarOrError = solicitacao.expirar();
      if (expirarOrError.isFailure) {
        continue;
      }

      await this.solicitacaoRepository.update(solicitacao);
      expiradas.push(solicitacao);
    }

    return Result.ok<SolicitacaoTrocaTurno[]>(expiradas);
  }
}

export { ExpirarSolicitacoesTrocaTurnoUseCase };
