import { BaseUseCase, Result } from "core-kernel";
import type { FuncionarioEntity } from "../entities/funcionario.entity";
import type { FuncionarioRepository } from "../ports/funcionario.repository";

class ListarFuncionariosUseCase extends BaseUseCase<void, FuncionarioEntity[]> {
  constructor(private readonly funcionarioRepository: Pick<FuncionarioRepository, "findAll">) {
    super();
  }

  protected async handle(): Promise<Result<FuncionarioEntity[], never>> {
    return Result.ok(await this.funcionarioRepository.findAll());
  }
}

export { ListarFuncionariosUseCase };
