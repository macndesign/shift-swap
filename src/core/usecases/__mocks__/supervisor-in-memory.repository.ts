import { SupervisorEntity } from "../../entities/supervisor.entity";
import { SupervisorRepository } from "../../ports/supervisor.repository";

class SupervisorInMemoryRepository extends SupervisorRepository {
  private readonly items = new Map<string, SupervisorEntity>();

  async save(entity: SupervisorEntity): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async update(entity: SupervisorEntity): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async findById(id: string): Promise<SupervisorEntity | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(): Promise<SupervisorEntity[]> {
    return Array.from(this.items.values());
  }
}

export { SupervisorInMemoryRepository };
