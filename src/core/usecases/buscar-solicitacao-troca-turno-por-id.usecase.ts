import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface BuscarSolicitacaoTrocaTurnoPorIdInput {
  id: string;
}

class BuscarSolicitacaoTrocaTurnoPorIdUseCase extends UseCase<
  BuscarSolicitacaoTrocaTurnoPorIdInput,
  SolicitacaoTrocaTurno
> {
  constructor(private readonly solicitacaoRepository: SolicitacaoTrocaTurnoRepository) {
    super();
  }

  async execute(
    input: BuscarSolicitacaoTrocaTurnoPorIdInput,
  ): Promise<Result<SolicitacaoTrocaTurno>> {
    const solicitacao = await this.solicitacaoRepository.findById(input.id);
    if (!solicitacao) {
      return Result.fail<SolicitacaoTrocaTurno>("Solicitação não encontrada");
    }

    return Result.ok<SolicitacaoTrocaTurno>(solicitacao);
  }
}

export { BuscarSolicitacaoTrocaTurnoPorIdUseCase };
