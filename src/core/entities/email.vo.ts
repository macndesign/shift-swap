import { Result } from "../../shared/result";
import { ValueObject } from "../../shared/value-object";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class EmailVO extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(email: string): Result<EmailVO> {
    if (!email || email.trim().length === 0) {
      return Result.fail<EmailVO>("Email não pode ser vazio");
    }
    if (!EMAIL_REGEX.test(email)) {
      return Result.fail<EmailVO>(`Email inválido: ${email}`);
    }
    return Result.ok<EmailVO>(new EmailVO(email));
  }
}

export { EmailVO };
