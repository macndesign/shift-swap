import { BaseUseCase, Result, ValidationError } from "core-kernel";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import { CODIGOS_ERRO } from "../erros";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface ExpirarSolicitacoesTrocaTurnoInput {
  /** Data e hora atuais no formato `YYYY-MM-DDTHH:mm`, no mesmo fuso dos turnos. */
  referencia: string;
}

const REFERENCIA_REGEX = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;

/** Rotina do sistema: expira as solicitações em aberto cujo turno já começou. */
class ExpirarSolicitacoesTrocaTurnoUseCase extends BaseUseCase<
  ExpirarSolicitacoesTrocaTurnoInput,
  SolicitacaoTrocaTurno[],
  ValidationError
> {
  constructor(
    private readonly solicitacaoRepository: Pick<
      SolicitacaoTrocaTurnoRepository,
      "findEmAberto" | "update"
    >,
  ) {
    super();
  }

  protected async handle(
    input: ExpirarSolicitacoesTrocaTurnoInput,
  ): Promise<Result<SolicitacaoTrocaTurno[], ValidationError>> {
    if (!REFERENCIA_REGEX.test(input.referencia)) {
      return Result.fail(
        new ValidationError({
          field: "referencia",
          code: CODIGOS_ERRO.REFERENCIA_INVALIDA,
          message: `Referência inválida: ${input.referencia}`,
        }),
      );
    }

    const emAberto = await this.solicitacaoRepository.findEmAberto();
    const expiradas: SolicitacaoTrocaTurno[] = [];

    for (const solicitacao of emAberto) {
      const inicioDoTurno = `${solicitacao.turno.data}T${solicitacao.turno.horaInicio}`;
      if (inicioDoTurno > input.referencia) continue;
      if (solicitacao.expirar().isFail()) continue;

      await this.solicitacaoRepository.update(solicitacao);
      expiradas.push(solicitacao);
    }

    return Result.ok(expiradas);
  }
}

export { ExpirarSolicitacoesTrocaTurnoUseCase };
