import { describe, expect, it } from "bun:test";
import { NameVO } from "../name.vo";

describe("NameVO", () => {
  it("cria um NameVO válido", () => {
    const result = NameVO.create("Maria");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe("Maria");
  });

  it("aceita um nome com exatamente 3 caracteres", () => {
    const result = NameVO.create("Ana");

    expect(result.isSuccess).toBe(true);
  });

  it("falha quando o nome é vazio", () => {
    const result = NameVO.create("");

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Nome não pode ser vazio");
  });

  it("falha quando o nome contém apenas espaços", () => {
    const result = NameVO.create("   ");

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Nome não pode ser vazio");
  });

  it("falha quando o nome tem menos de 3 caracteres", () => {
    const result = NameVO.create("Al");

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Nome deve ter pelo menos 3 caracteres");
  });

  it("considera dois NameVO com o mesmo valor iguais", () => {
    const a = NameVO.create("Maria").getValue();
    const b = NameVO.create("Maria").getValue();

    expect(a.equals(b)).toBe(true);
  });

  it("considera dois NameVO com valores diferentes desiguais", () => {
    const a = NameVO.create("Maria").getValue();
    const b = NameVO.create("Joana").getValue();

    expect(a.equals(b)).toBe(false);
  });
});
