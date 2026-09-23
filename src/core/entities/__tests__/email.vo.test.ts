import { describe, expect, it } from "bun:test";
import { EmailVO } from "../email.vo";

describe("EmailVO", () => {
  it("cria um EmailVO válido", () => {
    const result = EmailVO.create("teste@exemplo.com");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe("teste@exemplo.com");
  });

  it("falha quando o email é vazio", () => {
    const result = EmailVO.create("");

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Email não pode ser vazio");
  });

  it("falha quando o email contém apenas espaços", () => {
    const result = EmailVO.create("   ");

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Email não pode ser vazio");
  });

  it("falha quando o email não tem formato válido", () => {
    const result = EmailVO.create("email-invalido");

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Email inválido: email-invalido");
  });

  it("considera dois EmailVO com o mesmo valor iguais", () => {
    const a = EmailVO.create("teste@exemplo.com").getValue();
    const b = EmailVO.create("teste@exemplo.com").getValue();

    expect(a.equals(b)).toBe(true);
  });

  it("considera dois EmailVO com valores diferentes desiguais", () => {
    const a = EmailVO.create("a@exemplo.com").getValue();
    const b = EmailVO.create("b@exemplo.com").getValue();

    expect(a.equals(b)).toBe(false);
  });
});
