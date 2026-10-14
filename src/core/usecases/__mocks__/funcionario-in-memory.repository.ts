import { InMemoryRepository } from "core-kernel/testing";
import type { FuncionarioEntity } from "../../entities/funcionario.entity";
import type { FuncionarioRepository } from "../../ports/funcionario.repository";

class FuncionarioInMemoryRepository
  extends InMemoryRepository<FuncionarioEntity>
  implements FuncionarioRepository
{
  async findAll(): Promise<FuncionarioEntity[]> {
    return this.filter(() => true);
  }
}

export { FuncionarioInMemoryRepository };
