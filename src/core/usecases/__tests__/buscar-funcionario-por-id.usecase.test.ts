import { describe, expect, it } from "bun:test";
import { FuncionarioEntity } from "../../entities/funcionario.entity";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";
import { BuscarFuncionarioPorIdUseCase } from "../buscar-funcionario-por-id.usecase";

function criarSut() {
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const useCase = new BuscarFuncionarioPorIdUseCase(funcionarioRepository);

  return { funcionarioRepository, useCase };
}

describe("BuscarFuncionarioPorIdUseCase", () => {
  it("retorna o funcionário quando ele existe", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const funcionario = FuncionarioEntity.create({
      name: "Maria",
      email: "maria@exemplo.com",
    }).getValue();
    await funcionarioRepository.save(funcionario);

    const result = await useCase.execute({ id: funcionario.id });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(funcionario);
  });

  it("falha quando o funcionário não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ id: "funcionario-inexistente" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário não encontrado");
  });
});
