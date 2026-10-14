import { InMemoryRepository } from "core-kernel/testing";
import type { SupervisorEntity } from "../../entities/supervisor.entity";
import type { SupervisorRepository } from "../../ports/supervisor.repository";

class SupervisorInMemoryRepository
  extends InMemoryRepository<SupervisorEntity>
  implements SupervisorRepository {}

export { SupervisorInMemoryRepository };
