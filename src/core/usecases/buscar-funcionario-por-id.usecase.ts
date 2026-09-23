import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { FuncionarioEntity } from "../entities/funcionario.entity";
import { FuncionarioRepository } from "../ports/funcionario.repository";

interface BuscarFuncionarioPorIdInput {
  id: string;
}

class BuscarFuncionarioPorIdUseCase extends UseCase<BuscarFuncionarioPorIdInput, FuncionarioEntity> {
  constructor(private readonly funcionarioRepository: FuncionarioRepository) {
    super();
  }

  async execute(input: BuscarFuncionarioPorIdInput): Promise<Result<FuncionarioEntity>> {
    const funcionario = await this.funcionarioRepository.findById(input.id);
    if (!funcionario) {
      return Result.fail<FuncionarioEntity>("Funcionário não encontrado");
    }

    return Result.ok<FuncionarioEntity>(funcionario);
  }
}

export { BuscarFuncionarioPorIdUseCase };
