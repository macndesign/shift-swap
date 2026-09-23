import { describe, expect, it } from "bun:test";
import { CriarFuncionarioUseCase } from "../criar-funcionario.usecase";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";

function criarSut() {
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const useCase = new CriarFuncionarioUseCase(funcionarioRepository);

  return { funcionarioRepository, useCase };
}

describe("CriarFuncionarioUseCase", () => {
  it("cria e persiste um funcionário válido", async () => {
    const { funcionarioRepository, useCase } = criarSut();

    const result = await useCase.execute({ name: "Maria", email: "maria@exemplo.com" });

    expect(result.isSuccess).toBe(true);
    const funcionario = result.getValue();
    expect(funcionario.name.value).toBe("Maria");
    expect(funcionario.email.value).toBe("maria@exemplo.com");
    expect(await funcionarioRepository.findById(funcionario.id)).toBe(funcionario);
  });

  it("usa o id informado, permitindo vincular a um usuário autenticado", async () => {
    const { funcionarioRepository, useCase } = criarSut();

    const result = await useCase.execute({
      id: "auth-user-id",
      name: "Maria",
      email: "maria@exemplo.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().id).toBe("auth-user-id");
    expect(await funcionarioRepository.findById("auth-user-id")).toBe(result.getValue());
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
