import type { FuncionarioEntity } from "../../entities/funcionario.entity";
import { FuncionarioRepository } from "../../ports/funcionario.repository";

class FuncionarioInMemoryRepository extends FuncionarioRepository {
  private readonly items = new Map<string, FuncionarioEntity>();

  async save(entity: FuncionarioEntity): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async update(entity: FuncionarioEntity): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async findById(id: string): Promise<FuncionarioEntity | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(): Promise<FuncionarioEntity[]> {
    return Array.from(this.items.values());
  }
}

export { FuncionarioInMemoryRepository };
