import { BaseUseCase, Result, type ValidationError } from "core-kernel";
import { FuncionarioEntity } from "../entities/funcionario.entity.js";
import type { FuncionarioRepository } from "../ports/funcionario.repository.js";

interface CriarFuncionarioInput {
  /** Id externo opcional (ex.: id do usuário no BetterAuth). */
  id?: string;
  name: string;
  email: string;
}

class CriarFuncionarioUseCase extends BaseUseCase<
  CriarFuncionarioInput,
  FuncionarioEntity,
  ValidationError
> {
  constructor(private readonly funcionarioRepository: Pick<FuncionarioRepository, "create">) {
    super();
  }

  protected async handle(
    input: CriarFuncionarioInput,
  ): Promise<Result<FuncionarioEntity, ValidationError>> {
    const funcionario = FuncionarioEntity.create(input, input.id);
    if (funcionario.isFail()) return funcionario;

    await this.funcionarioRepository.create(funcionario.value);
    return Result.ok(funcionario.value);
  }
}

export { CriarFuncionarioUseCase };
