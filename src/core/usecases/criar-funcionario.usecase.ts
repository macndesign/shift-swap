import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { FuncionarioEntity } from "../entities/funcionario.entity";
import { FuncionarioRepository } from "../ports/funcionario.repository";

interface CriarFuncionarioInput {
  id?: string;
  name: string;
  email: string;
}

class CriarFuncionarioUseCase extends UseCase<CriarFuncionarioInput, FuncionarioEntity> {
  constructor(private readonly funcionarioRepository: FuncionarioRepository) {
    super();
  }

  async execute(input: CriarFuncionarioInput): Promise<Result<FuncionarioEntity>> {
    const funcionarioOrError = FuncionarioEntity.create(input, input.id);
    if (funcionarioOrError.isFailure) {
      return Result.fail<FuncionarioEntity>(funcionarioOrError.error as string | Error);
    }

    const funcionario = funcionarioOrError.getValue();
    await this.funcionarioRepository.save(funcionario);

    return Result.ok<FuncionarioEntity>(funcionario);
  }
}

export { CriarFuncionarioUseCase };
