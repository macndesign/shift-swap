import { Entity } from "../../shared/entity";
import { Result } from "../../shared/result";
import { EmailVO } from "./email.vo";
import { NameVO } from "./name.vo";

interface PessoaProps {
  name: NameVO;
  email: EmailVO;
}

interface CreatePessoaProps {
  name: string;
  email: string;
}

class PessoaEntity extends Entity<PessoaProps> {
  protected constructor(props: PessoaProps, id?: string) {
    super(props, id);
  }

  get name(): NameVO {
    return this.props.name;
  }

  get email(): EmailVO {
    return this.props.email;
  }

  atualizarDados(props: CreatePessoaProps): Result<void> {
    const propsOrError = PessoaEntity.buildProps(props);
    if (propsOrError.isFailure) {
      return Result.fail<void>(propsOrError.error as string | Error);
    }

    this.props = propsOrError.getValue();
    return Result.ok<void>();
  }

  protected static buildProps(props: CreatePessoaProps): Result<PessoaProps> {
    const nameOrError = NameVO.create(props.name);
    const emailOrError = EmailVO.create(props.email);

    const combined = Result.combine([nameOrError, emailOrError]);
    if (combined.isFailure) {
      return Result.fail<PessoaProps>(combined.error as string | Error);
    }

    return Result.ok<PessoaProps>({ name: nameOrError.getValue(), email: emailOrError.getValue() });
  }

  static create(props: CreatePessoaProps, id?: string): Result<PessoaEntity> {
    const propsOrError = PessoaEntity.buildProps(props);
    if (propsOrError.isFailure) {
      return Result.fail<PessoaEntity>(propsOrError.error as string | Error);
    }

    return Result.ok<PessoaEntity>(new PessoaEntity(propsOrError.getValue(), id));
  }
}

export { PessoaEntity, PessoaProps, CreatePessoaProps };
