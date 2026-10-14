import { Guard, type Result, type ValidationError, ValueObject } from "core-kernel";
import { CODIGOS_ERRO } from "../erros";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class EmailVO extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(email: string, campo = "email"): Result<EmailVO, ValidationError> {
    const valor = email ?? "";
    return Guard.notEmpty(valor, {
      field: campo,
      code: CODIGOS_ERRO.EMAIL_VAZIO,
      message: "Email não pode ser vazio",
    })
      .flatMap(() =>
        Guard.matches(valor, EMAIL_REGEX, {
          field: campo,
          code: CODIGOS_ERRO.EMAIL_INVALIDO,
          message: `Email inválido: ${valor}`,
        }),
      )
      .map(() => new EmailVO(valor));
  }
}

export { EmailVO };
