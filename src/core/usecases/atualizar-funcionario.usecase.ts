import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import type { FuncionarioEntity } from "../entities/funcionario.entity";
import type { FuncionarioRepository } from "../ports/funcionario.repository";

interface AtualizarFuncionarioInput {
  id: string;
  name: string;
  email: string;
}

class AtualizarFuncionarioUseCase extends UseCase<AtualizarFuncionarioInput, FuncionarioEntity> {
  constructor(private readonly funcionarioRepository: FuncionarioRepository) {
    super();
  }

  async execute(input: AtualizarFuncionarioInput): Promise<Result<FuncionarioEntity>> {
    const funcionario = await this.funcionarioRepository.findById(input.id);
    if (!funcionario) {
      return Result.fail<FuncionarioEntity>("Funcionário não encontrado");
    }

    const atualizarOrError = funcionario.atualizarDados({ name: input.name, email: input.email });
    if (atualizarOrError.isFailure) {
      return Result.fail<FuncionarioEntity>(atualizarOrError.error as string | Error);
    }

    await this.funcionarioRepository.update(funcionario);

    return Result.ok<FuncionarioEntity>(funcionario);
  }
}

export { AtualizarFuncionarioUseCase };
