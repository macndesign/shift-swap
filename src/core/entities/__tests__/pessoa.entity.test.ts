import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { Email, Text } from "core-kernel/vo";
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

  describe("nome (Text do core-kernel)", () => {
    it("guarda o nome sem espaços nas pontas", () => {
      const pessoa = PessoaEntity.create({
        name: "  Maria  ",
        email: "maria@exemplo.com",
      }).unwrap();

      expect(pessoa.name).toBeInstanceOf(Text);
      expect(pessoa.name.value).toBe("Maria");
    });

    it("aceita um nome com exatamente 3 caracteres", () => {
      assertOk(PessoaEntity.create({ name: "Ana", email: "ana@exemplo.com" }));
    });

    it.each(["", "   "])("falha com NOME_VAZIO no campo name para %p", (name) => {
      const result = PessoaEntity.create({ name, email: "maria@exemplo.com" });

      assertFail(result, "NOME_VAZIO");
      expect(result.error.issues).toEqual([
        { field: "name", code: "NOME_VAZIO", message: "Nome não pode ser vazio" },
      ]);
    });

    it("falha com NOME_CURTO no campo name quando tem menos de 3 caracteres", () => {
      const result = PessoaEntity.create({ name: " Al ", email: "maria@exemplo.com" });

      expect(result.isFail() && result.error.issues).toEqual([
        { field: "name", code: "NOME_CURTO", message: "Nome deve ter pelo menos 3 caracteres" },
      ]);
    });
  });

  describe("email (Email do core-kernel)", () => {
    it("guarda o email sem espaços e em minúsculas", () => {
      const pessoa = PessoaEntity.create({ name: "Maria", email: " Maria@Exemplo.COM " }).unwrap();

      expect(pessoa.email).toBeInstanceOf(Email);
      expect(pessoa.email.value).toBe("maria@exemplo.com");
    });

    it.each(["", "   "])("falha com EMAIL_VAZIO no campo email para %p", (email) => {
      const result = PessoaEntity.create({ name: "Maria", email });

      assertFail(result, "EMAIL_VAZIO");
      expect(result.error.issues).toEqual([
        { field: "email", code: "EMAIL_VAZIO", message: "Email não pode ser vazio" },
      ]);
    });

    it("falha com EMAIL_INVALIDO no campo email quando o formato é inválido", () => {
      const result = PessoaEntity.create({ name: "Maria", email: "email-invalido" });

      expect(result.isFail() && result.error.issues).toEqual([
        { field: "email", code: "EMAIL_INVALIDO", message: "Email inválido: email-invalido" },
      ]);
    });

    it("falha com EMAIL_LONGO quando passa de 254 caracteres", () => {
      const email = `${"a".repeat(245)}@exemplo.com`;
      const result = PessoaEntity.create({ name: "Maria", email });

      expect(result.isFail() && result.error.issues).toEqual([
        {
          field: "email",
          code: "EMAIL_LONGO",
          message: "Email deve ter no máximo 254 caracteres",
        },
      ]);
    });

    it("aceita um email com exatamente 254 caracteres", () => {
      const email = `${"a".repeat(242)}@exemplo.com`;

      expect(email.length).toBe(254);
      assertOk(PessoaEntity.create({ name: "Maria", email }));
    });
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
