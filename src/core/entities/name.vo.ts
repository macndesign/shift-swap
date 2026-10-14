import { Guard, type Result, type ValidationError, ValueObject } from "core-kernel";
import { CODIGOS_ERRO } from "../erros.js";

const MIN_LENGTH = 3;

class NameVO extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(name: string, campo = "name"): Result<NameVO, ValidationError> {
    const aparado = (name ?? "").trim();
    return Guard.notEmpty(aparado, {
      field: campo,
      code: CODIGOS_ERRO.NOME_VAZIO,
      message: "Nome não pode ser vazio",
    })
      .flatMap(() =>
        Guard.minLength(aparado, MIN_LENGTH, {
          field: campo,
          code: CODIGOS_ERRO.NOME_CURTO,
          message: `Nome deve ter pelo menos ${MIN_LENGTH} caracteres`,
        }),
      )
      .map(() => new NameVO(name));
  }
}

export { NameVO };
