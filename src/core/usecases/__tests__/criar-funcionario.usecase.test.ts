import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { funcionarioId } from "../../__tests__/fixtures";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";
import { CriarFuncionarioUseCase } from "../criar-funcionario.usecase";

function criarSut() {
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const useCase = new CriarFuncionarioUseCase(funcionarioRepository);

  return { funcionarioRepository, useCase };
}

describe("CriarFuncionarioUseCase", () => {
  it("cria e persiste um funcionário válido", async () => {
    const { funcionarioRepository, useCase } = criarSut();

    const result = await useCase.execute({ name: "Maria", email: "maria@exemplo.com" });

    assertOk(result);
    const funcionario = result.value;
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

    assertOk(result);
    expect(result.value.id.value).toBe("auth-user-id");
    expect(await funcionarioRepository.findById(funcionarioId("auth-user-id"))).toBe(result.value);
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
