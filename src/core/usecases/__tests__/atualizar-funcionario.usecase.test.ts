import { describe, expect, it } from "bun:test";
import { FuncionarioEntity } from "../../entities/funcionario.entity";
import { AtualizarFuncionarioUseCase } from "../atualizar-funcionario.usecase";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";

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
    }).getValue();
    await funcionarioRepository.save(funcionario);

    const result = await useCase.execute({
      id: funcionario.id,
      name: "Maria Silva",
      email: "maria.silva@exemplo.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().name.value).toBe("Maria Silva");
    expect(result.getValue().email.value).toBe("maria.silva@exemplo.com");
  });

  it("falha quando o funcionário não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({
      id: "funcionario-inexistente",
      name: "Maria Silva",
      email: "maria.silva@exemplo.com",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário não encontrado");
  });

  it("falha quando os novos dados são inválidos", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const funcionario = FuncionarioEntity.create({
      name: "Maria",
      email: "maria@exemplo.com",
    }).getValue();
    await funcionarioRepository.save(funcionario);

    const result = await useCase.execute({
      id: funcionario.id,
      name: "Al",
      email: "maria@exemplo.com",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Nome deve ter pelo menos 3 caracteres");
  });
});
