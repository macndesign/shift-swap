import { Repository } from "../../shared/repository";
import { FuncionarioEntity } from "../entities/funcionario.entity";

abstract class FuncionarioRepository extends Repository<FuncionarioEntity> {}

export { FuncionarioRepository };
