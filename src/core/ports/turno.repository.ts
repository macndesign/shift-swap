import type { CrudRepository } from "core-kernel";
import type { FuncionarioId } from "../entities/ids.js";
import type { Turno } from "../entities/turno.entity.js";

interface TurnoRepository extends CrudRepository<Turno> {
  findAll(): Promise<Turno[]>;
  findByFuncionarioIdAndData(funcionarioId: FuncionarioId, data: string): Promise<Turno[]>;
}

export type { TurnoRepository };
