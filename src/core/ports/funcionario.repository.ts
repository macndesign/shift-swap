import type { CrudRepository } from "core-kernel";
import type { FuncionarioEntity } from "../entities/funcionario.entity";

/** Falha de infraestrutura é exceção (o use case converte em erro `UNEXPECTED`). */
interface FuncionarioRepository extends CrudRepository<FuncionarioEntity> {
  findAll(): Promise<FuncionarioEntity[]>;
}

export type { FuncionarioRepository };
