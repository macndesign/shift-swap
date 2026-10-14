import { Entity, type GuardOptions, Result, UniqueId, type ValidationError } from "core-kernel";
import { EmailVO } from "./email.vo";
import { opcoesDeId } from "./ids";
import { NameVO } from "./name.vo";

interface PessoaProps {
  name: NameVO;
  email: EmailVO;
}

interface CreatePessoaProps {
  name: string;
  email: string;
}

/** Base dos tipos de pessoa (funcionário, supervisor). `Id` é o id tipado de cada um. */
class PessoaEntity<Id extends UniqueId = UniqueId> extends Entity<PessoaProps, Id> {
  protected constructor(props: PessoaProps, id: Id) {
    super(props, id);
  }

  get name(): NameVO {
    return this.props.name;
  }

  get email(): EmailVO {
    return this.props.email;
  }

  atualizarDados(props: CreatePessoaProps): Result<void, ValidationError> {
    const validadas = PessoaEntity.buildProps(props);
    if (validadas.isFail()) return validadas;

    this.props.name = validadas.value.name;
    this.props.email = validadas.value.email;
    return Result.ok();
  }

  /** Valida nome e e-mail juntos: devolve as issues dos dois campos de uma vez. */
  protected static buildProps(props: CreatePessoaProps): Result<PessoaProps, ValidationError> {
    return Result.combine([NameVO.create(props.name), EmailVO.create(props.email)]).map(
      ([name, email]) => ({ name, email }),
    );
  }

  /**
   * Resolve o id: gera um novo ou reaproveita um id externo (ex.: usuário do BetterAuth),
   * validado pela classe de id da subclasse.
   */
  protected static resolverId<I extends UniqueId>(
    classe: { generate(): I; from(raw: string, opcoes?: GuardOptions): Result<I, ValidationError> },
    id: string | undefined,
  ): Result<I, ValidationError> {
    return id === undefined ? Result.ok(classe.generate()) : classe.from(id, opcoesDeId("id"));
  }

  static create(props: CreatePessoaProps, id?: string): Result<PessoaEntity, ValidationError> {
    return Result.combine([
      PessoaEntity.buildProps(props),
      PessoaEntity.resolverId(UniqueId, id),
    ]).map(([pessoaProps, pessoaId]) => new PessoaEntity(pessoaProps, pessoaId));
  }
}

export { type CreatePessoaProps, PessoaEntity, type PessoaProps };
