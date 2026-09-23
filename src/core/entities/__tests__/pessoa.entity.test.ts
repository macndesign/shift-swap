import { describe, expect, it } from "bun:test";
import { PessoaEntity } from "../pessoa.entity";

describe("PessoaEntity", () => {
  it("cria uma PessoaEntity válida com nome e email válidos", () => {
    const result = PessoaEntity.create({ name: "Maria", email: "maria@exemplo.com" });

    expect(result.isSuccess).toBe(true);

    const pessoa = result.getValue();
    expect(pessoa.name.value).toBe("Maria");
    expect(pessoa.email.value).toBe("maria@exemplo.com");
  });

  it("gera um id automaticamente quando nenhum é informado", () => {
    const pessoa = PessoaEntity.create({ name: "Maria", email: "maria@exemplo.com" }).getValue();

    expect(typeof pessoa.id).toBe("string");
    expect(pessoa.id.length).toBeGreaterThan(0);
  });

  it("usa o id informado quando fornecido", () => {
    const pessoa = PessoaEntity.create(
      { name: "Maria", email: "maria@exemplo.com" },
      "id-fixo"
    ).getValue();

    expect(pessoa.id).toBe("id-fixo");
  });

  it("falha quando o nome é inválido", () => {
    const result = PessoaEntity.create({ name: "Al", email: "maria@exemplo.com" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Nome deve ter pelo menos 3 caracteres");
  });

  it("falha quando o email é inválido", () => {
    const result = PessoaEntity.create({ name: "Maria", email: "email-invalido" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Email inválido: email-invalido");
  });

  it("falha com o erro do primeiro Value Object inválido quando ambos são inválidos", () => {
    const result = PessoaEntity.create({ name: "Al", email: "email-invalido" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Nome deve ter pelo menos 3 caracteres");
  });

  it("considera duas PessoaEntity com o mesmo id iguais, mesmo com props diferentes", () => {
    const a = PessoaEntity.create(
      { name: "Maria", email: "maria@exemplo.com" },
      "mesmo-id"
    ).getValue();
    const b = PessoaEntity.create(
      { name: "Joana", email: "joana@exemplo.com" },
      "mesmo-id"
    ).getValue();

    expect(a.equals(b)).toBe(true);
  });

  it("considera duas PessoaEntity com ids diferentes desiguais, mesmo com as mesmas props", () => {
    const a = PessoaEntity.create({ name: "Maria", email: "maria@exemplo.com" }).getValue();
    const b = PessoaEntity.create({ name: "Maria", email: "maria@exemplo.com" }).getValue();

    expect(a.equals(b)).toBe(false);
  });
});
