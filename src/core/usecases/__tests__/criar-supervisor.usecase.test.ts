import { describe, expect, it } from "bun:test";
import { SupervisorInMemoryRepository } from "../__mocks__/supervisor-in-memory.repository";
import { CriarSupervisorUseCase } from "../criar-supervisor.usecase";

function criarSut() {
  const supervisorRepository = new SupervisorInMemoryRepository();
  const useCase = new CriarSupervisorUseCase(supervisorRepository);

  return { supervisorRepository, useCase };
}

describe("CriarSupervisorUseCase", () => {
  it("cria e persiste um supervisor válido", async () => {
    const { supervisorRepository, useCase } = criarSut();

    const result = await useCase.execute({ name: "Maria", email: "maria@exemplo.com" });

    expect(result.isSuccess).toBe(true);
    const supervisor = result.getValue();
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

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().id).toBe("auth-user-id");
    expect(await supervisorRepository.findById("auth-user-id")).toBe(result.getValue());
  });

  it("falha quando o nome é inválido", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ name: "Al", email: "maria@exemplo.com" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Nome deve ter pelo menos 3 caracteres");
  });

  it("falha quando o email é inválido", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ name: "Maria", email: "email-invalido" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Email inválido: email-invalido");
  });
});
