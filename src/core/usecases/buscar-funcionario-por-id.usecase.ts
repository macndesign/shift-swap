import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import type { FuncionarioEntity } from "../entities/funcionario.entity";
import { FuncionarioId, opcoesDeId } from "../entities/ids";
import { naoEncontrado } from "../erros";
import type { FuncionarioRepository } from "../ports/funcionario.repository";

interface BuscarFuncionarioPorIdInput {
  id: string;
}

type Erro = ValidationError | NotFoundError;

class BuscarFuncionarioPorIdUseCase extends BaseUseCase<
  BuscarFuncionarioPorIdInput,
  FuncionarioEntity,
  Erro
> {
  constructor(private readonly funcionarioRepository: Pick<FuncionarioRepository, "findById">) {
    super();
  }

  protected async handle(
    input: BuscarFuncionarioPorIdInput,
  ): Promise<Result<FuncionarioEntity, Erro>> {
    const id = FuncionarioId.from(input.id, opcoesDeId("id"));
    if (id.isFail()) return id;

    const funcionario = await this.funcionarioRepository.findById(id.value);
    return funcionario ? Result.ok(funcionario) : Result.fail(naoEncontrado.funcionario());
  }
}

export { BuscarFuncionarioPorIdUseCase };
