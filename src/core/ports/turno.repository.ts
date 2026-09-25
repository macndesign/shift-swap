import { Repository } from "../../shared/repository";
import type { Turno } from "../entities/turno.entity";

abstract class TurnoRepository extends Repository<Turno> {
  abstract findByFuncionarioIdAndData(funcionarioId: string, data: string): Promise<Turno[]>;
}

export { TurnoRepository };
