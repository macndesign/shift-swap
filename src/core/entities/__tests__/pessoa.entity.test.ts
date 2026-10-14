import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { PessoaEntity } from "../pessoa.entity.js";

describe("PessoaEntity", () => {
  it("cria uma PessoaEntity válida com nome e email válidos", () => {
    const result = PessoaEntity.create({ name: "Maria", email: "maria@exemplo.com" });

    assertOk(result);

    const pessoa = result.value;
    expect(pessoa.name.value).toBe("Maria");
    expect(pessoa.email.value).toBe("maria@exemplo.com");
  });

  it("gera um id automaticamente quando nenhum é informado", () => {
    const pessoa = PessoaEntity.create({ name: "Maria", email: "maria@exemplo.com" }).unwrap();

    expect(typeof pessoa.id.value).toBe("string");
    expect(pessoa.id.value.length).toBeGreaterThan(0);
  });

  it("usa o id informado quando fornecido", () => {
    const pessoa = PessoaEntity.create(
      { name: "Maria", email: "maria@exemplo.com" },
      "id-fixo",
    ).unwrap();

    expect(pessoa.id.value).toBe("id-fixo");
  });

  it("falha quando o nome é inválido", () => {
    const result = PessoaEntity.create({ name: "Al", email: "maria@exemplo.com" });

    assertFail(result, "NOME_CURTO");
    expect(result.error.message).toBe("Nome deve ter pelo menos 3 caracteres");
  });

  it("falha quando o email é inválido", () => {
    const result = PessoaEntity.create({ name: "Maria", email: "email-invalido" });

    assertFail(result, "EMAIL_INVALIDO");
    expect(result.error.message).toBe("Email inválido: email-invalido");
  });

  it("falha com um único ValidationError com as issues de nome e email quando ambos são inválidos", () => {
    const result = PessoaEntity.create({ name: "Al", email: "email-invalido" });

    assertFail(result, "NOME_CURTO");
    assertFail(result, "EMAIL_INVALIDO");
    expect(result.error.issues.map((issue) => issue.code)).toEqual([
      "NOME_CURTO",
      "EMAIL_INVALIDO",
    ]);
    expect(result.error.message).toBe(
      "Nome deve ter pelo menos 3 caracteres; Email inválido: email-invalido",
    );
  });

  it("considera duas PessoaEntity com o mesmo id iguais, mesmo com props diferentes", () => {
    const a = PessoaEntity.create(
      { name: "Maria", email: "maria@exemplo.com" },
      "mesmo-id",
    ).unwrap();
    const b = PessoaEntity.create(
      { name: "Joana", email: "joana@exemplo.com" },
      "mesmo-id",
    ).unwrap();

    expect(a.equals(b)).toBe(true);
  });

  it("considera duas PessoaEntity com ids diferentes desiguais, mesmo com as mesmas props", () => {
    const a = PessoaEntity.create({ name: "Maria", email: "maria@exemplo.com" }).unwrap();
    const b = PessoaEntity.create({ name: "Maria", email: "maria@exemplo.com" }).unwrap();

    expect(a.equals(b)).toBe(false);
  });
});
