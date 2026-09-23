import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { FuncionarioRepository } from "../ports/funcionario.repository";

interface RemoverFuncionarioInput {
  id: string;
}

class RemoverFuncionarioUseCase extends UseCase<RemoverFuncionarioInput, void> {
  constructor(private readonly funcionarioRepository: FuncionarioRepository) {
    super();
  }

  async execute(input: RemoverFuncionarioInput): Promise<Result<void>> {
    const funcionario = await this.funcionarioRepository.findById(input.id);
    if (!funcionario) {
      return Result.fail<void>("Funcionário não encontrado");
    }

    await this.funcionarioRepository.delete(input.id);

    return Result.ok<void>();
  }
}

export { RemoverFuncionarioUseCase };
