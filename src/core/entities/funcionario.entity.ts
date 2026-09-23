import { Result } from "../../shared/result";
import { CreatePessoaProps, PessoaEntity, PessoaProps } from "./pessoa.entity";

class FuncionarioEntity extends PessoaEntity {
  private constructor(props: PessoaProps, id?: string) {
    super(props, id);
  }

  static create(props: CreatePessoaProps, id?: string): Result<FuncionarioEntity> {
    const propsOrError = FuncionarioEntity.buildProps(props);
    if (propsOrError.isFailure) {
      return Result.fail<FuncionarioEntity>(propsOrError.error as string | Error);
    }

    return Result.ok<FuncionarioEntity>(new FuncionarioEntity(propsOrError.getValue(), id));
  }
}

export { FuncionarioEntity };
