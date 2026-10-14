import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { FuncionarioEntity } from "../../entities/funcionario.entity.js";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository.js";
import { AtualizarFuncionarioUseCase } from "../atualizar-funcionario.usecase.js";

function criarSut() {
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const useCase = new AtualizarFuncionarioUseCase(funcionarioRepository);

  return { funcionarioRepository, useCase };
}

describe("AtualizarFuncionarioUseCase", () => {
  it("atualiza os dados de um funcionário existente", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const funcionario = FuncionarioEntity.create({
      name: "Maria",
      email: "maria@exemplo.com",
    }).unwrap();
    await funcionarioRepository.create(funcionario);

    const result = await useCase.execute({
      id: funcionario.id.value,
      name: "Maria Silva",
      email: "maria.silva@exemplo.com",
    });

    assertOk(result);
    expect(result.value.name.value).toBe("Maria Silva");
    expect(result.value.email.value).toBe("maria.silva@exemplo.com");
  });

  it("falha quando o funcionário não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({
      id: "funcionario-inexistente",
      name: "Maria Silva",
      email: "maria.silva@exemplo.com",
    });

    assertFail(result, "FUNCIONARIO_NAO_ENCONTRADO");
    expect(result.error.message).toBe("Funcionário não encontrado");
  });

  it("falha quando os novos dados são inválidos", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const funcionario = FuncionarioEntity.create({
      name: "Maria",
      email: "maria@exemplo.com",
    }).unwrap();
    await funcionarioRepository.create(funcionario);

    const result = await useCase.execute({
      id: funcionario.id.value,
      name: "Al",
      email: "maria@exemplo.com",
    });

    assertFail(result, "NOME_CURTO");
    expect(result.error.message).toBe("Nome deve ter pelo menos 3 caracteres");
  });
});
