import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { supervisorId } from "../../__tests__/fixtures.js";
import { SupervisorInMemoryRepository } from "../__mocks__/supervisor-in-memory.repository.js";
import { CriarSupervisorUseCase } from "../criar-supervisor.usecase.js";

function criarSut() {
  const supervisorRepository = new SupervisorInMemoryRepository();
  const useCase = new CriarSupervisorUseCase(supervisorRepository);

  return { supervisorRepository, useCase };
}

describe("CriarSupervisorUseCase", () => {
  it("cria e persiste um supervisor válido", async () => {
    const { supervisorRepository, useCase } = criarSut();

    const result = await useCase.execute({ name: "Maria", email: "maria@exemplo.com" });

    assertOk(result);
    const supervisor = result.value;
    expect(supervisor.name.value).toBe("Maria");
    expect(supervisor.email.value).toBe("maria@exemplo.com");
    expect(await supervisorRepository.findById(supervisor.id)).toBe(supervisor);
  });

  it("usa o id informado, permitindo vincular a um usuário autenticado", async () => {
    const { supervisorRepository, useCase } = criarSut();

    const result = await useCase.execute({
      id: "auth-user-id",
      name: "Maria",
      email: "maria@exemplo.com",
    });

    assertOk(result);
    expect(result.value.id.value).toBe("auth-user-id");
    expect(await supervisorRepository.findById(supervisorId("auth-user-id"))).toBe(result.value);
  });

  it("falha quando o nome é inválido", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ name: "Al", email: "maria@exemplo.com" });

    assertFail(result, "NOME_CURTO");
    expect(result.error.message).toBe("Nome deve ter pelo menos 3 caracteres");
  });

  it("falha quando o email é inválido", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ name: "Maria", email: "email-invalido" });

    assertFail(result, "EMAIL_INVALIDO");
    expect(result.error.message).toBe("Email inválido: email-invalido");
  });
});
