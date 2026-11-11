import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { Email, Text } from "core-kernel/vo";
import { supervisorId } from "../../__tests__/fixtures.js";
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

  describe("reconstituir", () => {
    it("reidrata o supervisor com o id e os dados salvos", () => {
      const supervisor = SupervisorEntity.reconstituir(
        {
          name: Text.create("Maria").unwrap(),
          email: Email.create("maria@exemplo.com").unwrap(),
        },
        supervisorId("sup-salvo"),
      );

      expect(supervisor).toBeInstanceOf(SupervisorEntity);
      expect(supervisor.id.value).toBe("sup-salvo");
      expect(supervisor.name.value).toBe("Maria");
      expect(supervisor.email.value).toBe("maria@exemplo.com");
    });
  });
});
