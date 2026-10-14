import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import { idDoCampo, SolicitacaoTrocaTurnoId } from "../entities/ids";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";
import { naoEncontrado } from "../erros";
import type { SolicitacaoTrocaTurnoRepository } from "../ports/solicitacao-troca-turno.repository";

interface BuscarSolicitacaoTrocaTurnoPorIdInput {
  id: string;
}

type Erro = ValidationError | NotFoundError;

class BuscarSolicitacaoTrocaTurnoPorIdUseCase extends BaseUseCase<
  BuscarSolicitacaoTrocaTurnoPorIdInput,
  SolicitacaoTrocaTurno,
  Erro
> {
  constructor(
    private readonly solicitacaoRepository: Pick<SolicitacaoTrocaTurnoRepository, "findById">,
  ) {
    super();
  }

  protected async handle(
    input: BuscarSolicitacaoTrocaTurnoPorIdInput,
  ): Promise<Result<SolicitacaoTrocaTurno, Erro>> {
    const id = idDoCampo(SolicitacaoTrocaTurnoId.from(input.id), "id");
    if (id.isFail()) return id;

    const solicitacao = await this.solicitacaoRepository.findById(id.value);
    return solicitacao ? Result.ok(solicitacao) : Result.fail(naoEncontrado.solicitacao());
  }
}

export { BuscarSolicitacaoTrocaTurnoPorIdUseCase };
