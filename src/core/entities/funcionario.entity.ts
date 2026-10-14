import { Result, type ValidationError } from "core-kernel";
import { FuncionarioId } from "./ids.js";
import { type CreatePessoaProps, PessoaEntity, type PessoaProps } from "./pessoa.entity.js";

class FuncionarioEntity extends PessoaEntity<FuncionarioId> {
  private constructor(props: PessoaProps, id: FuncionarioId) {
    super(props, id);
  }

  static override create(
    props: CreatePessoaProps,
    id?: string,
  ): Result<FuncionarioEntity, ValidationError> {
    return Result.combine([
      FuncionarioEntity.buildProps(props),
      FuncionarioEntity.resolverId<FuncionarioId>(FuncionarioId, id),
    ]).map(([pessoaProps, funcionarioId]) => new FuncionarioEntity(pessoaProps, funcionarioId));
  }

  /** Reidratação pelo adapter de repositório: dados já persistidos, sem validação. */
  static reconstituir(props: PessoaProps, id: FuncionarioId): FuncionarioEntity {
    return new FuncionarioEntity(props, id);
  }
}

export { FuncionarioEntity };
