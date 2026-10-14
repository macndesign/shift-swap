import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { NameVO } from "../name.vo.js";

describe("NameVO", () => {
  it("cria um NameVO válido", () => {
    const result = NameVO.create("Maria");

    assertOk(result);
    expect(result.value.value).toBe("Maria");
  });

  it("aceita um nome com exatamente 3 caracteres", () => {
    const result = NameVO.create("Ana");

    assertOk(result);
  });

  it("falha quando o nome é vazio", () => {
    const result = NameVO.create("");

    assertFail(result, "NOME_VAZIO");
    expect(result.error.message).toBe("Nome não pode ser vazio");
  });

  it("falha quando o nome contém apenas espaços", () => {
    const result = NameVO.create("   ");

    assertFail(result, "NOME_VAZIO");
    expect(result.error.message).toBe("Nome não pode ser vazio");
  });

  it("falha quando o nome tem menos de 3 caracteres", () => {
    const result = NameVO.create("Al");

    assertFail(result, "NOME_CURTO");
    expect(result.error.message).toBe("Nome deve ter pelo menos 3 caracteres");
  });

  it("considera dois NameVO com o mesmo valor iguais", () => {
    const a = NameVO.create("Maria").unwrap();
    const b = NameVO.create("Maria").unwrap();

    expect(a.equals(b)).toBe(true);
  });

  it("considera dois NameVO com valores diferentes desiguais", () => {
    const a = NameVO.create("Maria").unwrap();
    const b = NameVO.create("Joana").unwrap();

    expect(a.equals(b)).toBe(false);
  });
});
