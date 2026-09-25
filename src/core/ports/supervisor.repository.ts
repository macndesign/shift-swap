import { Repository } from "../../shared/repository";
import type { SupervisorEntity } from "../entities/supervisor.entity";

abstract class SupervisorRepository extends Repository<SupervisorEntity> {}

export { SupervisorRepository };
