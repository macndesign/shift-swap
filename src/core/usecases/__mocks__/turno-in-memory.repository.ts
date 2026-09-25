import type { Turno } from "../../entities/turno.entity";
import { TurnoRepository } from "../../ports/turno.repository";

class TurnoInMemoryRepository extends TurnoRepository {
  private readonly items = new Map<string, Turno>();

  async save(entity: Turno): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async update(entity: Turno): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async findById(id: string): Promise<Turno | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(): Promise<Turno[]> {
    return Array.from(this.items.values());
  }

  async findByFuncionarioIdAndData(funcionarioId: string, data: string): Promise<Turno[]> {
    return Array.from(this.items.values()).filter(
      (turno) => turno.funcionarioId === funcionarioId && turno.data === data,
    );
  }
}

export { TurnoInMemoryRepository };
