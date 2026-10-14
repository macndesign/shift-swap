import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { EmailVO } from "../email.vo.js";

describe("EmailVO", () => {
  it("cria um EmailVO válido", () => {
    const result = EmailVO.create("teste@exemplo.com");

    assertOk(result);
    expect(result.value.value).toBe("teste@exemplo.com");
  });

  it("falha quando o email é vazio", () => {
    const result = EmailVO.create("");

    assertFail(result, "EMAIL_VAZIO");
    expect(result.error.message).toBe("Email não pode ser vazio");
  });

  it("falha quando o email contém apenas espaços", () => {
    const result = EmailVO.create("   ");

    assertFail(result, "EMAIL_VAZIO");
    expect(result.error.message).toBe("Email não pode ser vazio");
  });

  it("falha quando o email não tem formato válido", () => {
    const result = EmailVO.create("email-invalido");

    assertFail(result, "EMAIL_INVALIDO");
    expect(result.error.message).toBe("Email inválido: email-invalido");
  });

  it("considera dois EmailVO com o mesmo valor iguais", () => {
    const a = EmailVO.create("teste@exemplo.com").unwrap();
    const b = EmailVO.create("teste@exemplo.com").unwrap();

    expect(a.equals(b)).toBe(true);
  });

  it("considera dois EmailVO com valores diferentes desiguais", () => {
    const a = EmailVO.create("a@exemplo.com").unwrap();
    const b = EmailVO.create("b@exemplo.com").unwrap();

    expect(a.equals(b)).toBe(false);
  });
});
