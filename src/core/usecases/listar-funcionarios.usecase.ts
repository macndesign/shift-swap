import { BaseUseCase, Result } from "core-kernel";
import type { FuncionarioEntity } from "../entities/funcionario.entity.js";
import type { FuncionarioRepository } from "../ports/funcionario.repository.js";

class ListarFuncionariosUseCase extends BaseUseCase<void, FuncionarioEntity[]> {
  constructor(private readonly funcionarioRepository: Pick<FuncionarioRepository, "findAll">) {
    super();
  }

  protected async handle(): Promise<Result<FuncionarioEntity[], never>> {
    return Result.ok(await this.funcionarioRepository.findAll());
  }
}

export { ListarFuncionariosUseCase };
