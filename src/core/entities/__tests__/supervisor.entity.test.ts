import { describe, expect, it } from "bun:test";
import { PessoaEntity } from "../pessoa.entity";
import { SupervisorEntity } from "../supervisor.entity";

describe("SupervisorEntity", () => {
  it("cria uma SupervisorEntity válida com nome e email válidos", () => {
    const result = SupervisorEntity.create({ name: "Maria", email: "maria@exemplo.com" });

    expect(result.isSuccess).toBe(true);

    const supervisor = result.getValue();
    expect(supervisor.name.value).toBe("Maria");
    expect(supervisor.email.value).toBe("maria@exemplo.com");
  });

  it("é uma instância de PessoaEntity", () => {
    const supervisor = SupervisorEntity.create({
      name: "Maria",
      email: "maria@exemplo.com",
    }).getValue();

    expect(supervisor).toBeInstanceOf(PessoaEntity);
  });

  it("usa o id informado quando fornecido, permitindo vincular a um usuário autenticado", () => {
    const supervisor = SupervisorEntity.create(
      { name: "Maria", email: "maria@exemplo.com" },
      "auth-user-id",
    ).getValue();

    expect(supervisor.id).toBe("auth-user-id");
  });

  it("falha quando o nome é inválido", () => {
    const result = SupervisorEntity.create({ name: "Al", email: "maria@exemplo.com" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Nome deve ter pelo menos 3 caracteres");
  });

  it("falha quando o email é inválido", () => {
    const result = SupervisorEntity.create({ name: "Maria", email: "email-invalido" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Email inválido: email-invalido");
  });
});
