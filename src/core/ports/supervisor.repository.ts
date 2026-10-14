import type { CreateRepository, FindByIdRepository } from "core-kernel";
import type { SupervisorEntity } from "../entities/supervisor.entity";

/** Só o que os use cases usam hoje: criar e buscar por id. */
interface SupervisorRepository
  extends CreateRepository<SupervisorEntity>,
    FindByIdRepository<SupervisorEntity> {}

export type { SupervisorRepository };
