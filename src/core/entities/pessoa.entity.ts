import {
  Entity,
  Guard,
  type GuardOptions,
  Result,
  UniqueId,
  type ValidationError,
} from "core-kernel";
import { Email, Text } from "core-kernel/vo";
import { CODIGOS_ERRO } from "../erros.js";
import { opcoesDeId } from "./ids.js";

const NOME_MIN = 3;
const EMAIL_MAX = 254; // limite do Email do core-kernel (RFC 5321)

interface PessoaProps {
  /** Nome sem espaços nas pontas. */
  name: Text;
  /** E-mail normalizado pelo core-kernel (trim + minúsculas). */
  email: Email;
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

  get name(): Text {
    return this.props.name;
  }

  get email(): Email {
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
    return Result.combine([
      PessoaEntity.criarNome(props.name),
      PessoaEntity.criarEmail(props.email),
    ]).map(([name, email]) => ({ name, email }));
  }

  private static criarNome(raw: string): Result<Text, ValidationError> {
    return Text.create(raw, {
      field: "name",
      minLength: NOME_MIN,
      errors: {
        EMPTY: { code: CODIGOS_ERRO.NOME_VAZIO, message: "Nome não pode ser vazio" },
        TOO_SHORT: {
          code: CODIGOS_ERRO.NOME_CURTO,
          message: `Nome deve ter pelo menos ${NOME_MIN} caracteres`,
        },
      },
    });
  }

  /** O `Email` do core-kernel trata vazio como formato inválido; aqui vazio tem código próprio. */
  private static criarEmail(raw: string): Result<Email, ValidationError> {
    const aparado = (raw ?? "").trim();
    const field = "email";
    const vazio = Guard.notEmpty(aparado, {
      field,
      code: CODIGOS_ERRO.EMAIL_VAZIO,
      message: "Email não pode ser vazio",
    });
    if (vazio.isFail()) return vazio;

    return Email.create(aparado, {
      field,
      errors: {
        INVALID_EMAIL: { code: CODIGOS_ERRO.EMAIL_INVALIDO, message: `Email inválido: ${aparado}` },
        TOO_LONG: {
          code: CODIGOS_ERRO.EMAIL_LONGO,
          message: `Email deve ter no máximo ${EMAIL_MAX} caracteres`,
        },
      },
    });
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
