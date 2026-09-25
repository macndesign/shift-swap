import { Result } from "../../shared/result";
import { type CreatePessoaProps, PessoaEntity, type PessoaProps } from "./pessoa.entity";

class SupervisorEntity extends PessoaEntity {
  private constructor(props: PessoaProps, id?: string) {
    super(props, id);
  }

  static create(props: CreatePessoaProps, id?: string): Result<SupervisorEntity> {
    const propsOrError = SupervisorEntity.buildProps(props);
    if (propsOrError.isFailure) {
      return Result.fail<SupervisorEntity>(propsOrError.error as string | Error);
    }

    return Result.ok<SupervisorEntity>(new SupervisorEntity(propsOrError.getValue(), id));
  }
}

export { SupervisorEntity };
