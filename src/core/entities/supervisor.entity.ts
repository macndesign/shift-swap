import { Result, type ValidationError } from "core-kernel";
import { SupervisorId } from "./ids.js";
import { type CreatePessoaProps, PessoaEntity, type PessoaProps } from "./pessoa.entity.js";

class SupervisorEntity extends PessoaEntity<SupervisorId> {
  private constructor(props: PessoaProps, id: SupervisorId) {
    super(props, id);
  }

  static override create(
    props: CreatePessoaProps,
    id?: string,
  ): Result<SupervisorEntity, ValidationError> {
    return Result.combine([
      SupervisorEntity.buildProps(props),
      SupervisorEntity.resolverId<SupervisorId>(SupervisorId, id),
    ]).map(([pessoaProps, supervisorId]) => new SupervisorEntity(pessoaProps, supervisorId));
  }

  /** Reidratação pelo adapter de repositório: dados já persistidos, sem validação. */
  static reconstituir(props: PessoaProps, id: SupervisorId): SupervisorEntity {
    return new SupervisorEntity(props, id);
  }
}

export { SupervisorEntity };
