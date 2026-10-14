import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import { FuncionarioId, idDoCampo } from "../entities/ids";
import { naoEncontrado } from "../erros";
import type { FuncionarioRepository } from "../ports/funcionario.repository";

interface RemoverFuncionarioInput {
  id: string;
}

type Erro = ValidationError | NotFoundError;

class RemoverFuncionarioUseCase extends BaseUseCase<RemoverFuncionarioInput, void, Erro> {
  constructor(
    private readonly funcionarioRepository: Pick<FuncionarioRepository, "findById" | "delete">,
  ) {
    super();
  }

  protected async handle(input: RemoverFuncionarioInput): Promise<Result<void, Erro>> {
    const id = idDoCampo(FuncionarioId.from(input.id), "id");
    if (id.isFail()) return id;

    if (!(await this.funcionarioRepository.findById(id.value))) {
      return Result.fail(naoEncontrado.funcionario());
    }

    await this.funcionarioRepository.delete(id.value);
    return Result.ok();
  }
}

export { RemoverFuncionarioUseCase };
