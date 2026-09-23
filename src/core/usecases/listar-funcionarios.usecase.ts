import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { FuncionarioEntity } from "../entities/funcionario.entity";
import { FuncionarioRepository } from "../ports/funcionario.repository";

class ListarFuncionariosUseCase extends UseCase<void, FuncionarioEntity[]> {
  constructor(private readonly funcionarioRepository: FuncionarioRepository) {
    super();
  }

  async execute(): Promise<Result<FuncionarioEntity[]>> {
    const funcionarios = await this.funcionarioRepository.findAll();
    return Result.ok<FuncionarioEntity[]>(funcionarios);
  }
}

export { ListarFuncionariosUseCase };
