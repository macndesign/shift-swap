import { InMemoryRepository } from "core-kernel/testing";
import type { SupervisorEntity } from "../../entities/supervisor.entity.js";
import type { SupervisorRepository } from "../../ports/supervisor.repository.js";

class SupervisorInMemoryRepository
  extends InMemoryRepository<SupervisorEntity>
  implements SupervisorRepository {}

export { SupervisorInMemoryRepository };
