import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { PessoaEntity } from "../pessoa.entity.js";
import { SupervisorEntity } from "../supervisor.entity.js";

describe("SupervisorEntity", () => {
  it("cria uma SupervisorEntity válida com nome e email válidos", () => {
    const result = SupervisorEntity.create({ name: "Maria", email: "maria@exemplo.com" });

    assertOk(result);

    const supervisor = result.value;
    expect(supervisor.name.value).toBe("Maria");
    expect(supervisor.email.value).toBe("maria@exemplo.com");
  });

  it("é uma instância de PessoaEntity", () => {
    const supervisor = SupervisorEntity.create({
      name: "Maria",
      email: "maria@exemplo.com",
    }).unwrap();

    expect(supervisor).toBeInstanceOf(PessoaEntity);
  });

  it("usa o id informado quando fornecido, permitindo vincular a um usuário autenticado", () => {
    const supervisor = SupervisorEntity.create(
      { name: "Maria", email: "maria@exemplo.com" },
      "auth-user-id",
    ).unwrap();

    expect(supervisor.id.value).toBe("auth-user-id");
  });

  it("falha quando o nome é inválido", () => {
    const result = SupervisorEntity.create({ name: "Al", email: "maria@exemplo.com" });

    assertFail(result, "NOME_CURTO");
    expect(result.error.message).toBe("Nome deve ter pelo menos 3 caracteres");
  });

  it("falha quando o email é inválido", () => {
    const result = SupervisorEntity.create({ name: "Maria", email: "email-invalido" });

    assertFail(result, "EMAIL_INVALIDO");
    expect(result.error.message).toBe("Email inválido: email-invalido");
  });
});
