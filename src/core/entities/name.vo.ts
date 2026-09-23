import { Result } from "../../shared/result";
import { ValueObject } from "../../shared/value-object";

const MIN_LENGTH = 3;

class NameVO extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(name: string): Result<NameVO> {
    if (!name || name.trim().length === 0) {
      return Result.fail<NameVO>("Nome não pode ser vazio");
    }
    if (name.trim().length < MIN_LENGTH) {
      return Result.fail<NameVO>(`Nome deve ter pelo menos ${MIN_LENGTH} caracteres`);
    }
    return Result.ok<NameVO>(new NameVO(name));
  }
}

export { NameVO };
