import { InMemoryRepository } from "core-kernel/testing";
import type { FuncionarioId } from "../../entities/ids";
import type { Turno } from "../../entities/turno.entity";
import type { TurnoRepository } from "../../ports/turno.repository";

class TurnoInMemoryRepository extends InMemoryRepository<Turno> implements TurnoRepository {
  async findAll(): Promise<Turno[]> {
    return this.filter(() => true);
  }

  async findByFuncionarioIdAndData(funcionarioId: FuncionarioId, data: string): Promise<Turno[]> {
    return this.filter((turno) => turno.funcionarioId.equals(funcionarioId) && turno.data === data);
  }
}

export { TurnoInMemoryRepository };
