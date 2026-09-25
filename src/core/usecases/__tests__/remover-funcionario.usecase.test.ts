import { describe, expect, it } from "bun:test";
import { FuncionarioEntity } from "../../entities/funcionario.entity";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";
import { RemoverFuncionarioUseCase } from "../remover-funcionario.usecase";

function criarSut() {
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const useCase = new RemoverFuncionarioUseCase(funcionarioRepository);

  return { funcionarioRepository, useCase };
}

describe("RemoverFuncionarioUseCase", () => {
  it("remove um funcionário existente", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const funcionario = FuncionarioEntity.create({
      name: "Maria",
      email: "maria@exemplo.com",
    }).getValue();
    await funcionarioRepository.save(funcionario);

    const result = await useCase.execute({ id: funcionario.id });

    expect(result.isSuccess).toBe(true);
    expect(await funcionarioRepository.findById(funcionario.id)).toBeNull();
  });

  it("falha quando o funcionário não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ id: "funcionario-inexistente" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário não encontrado");
  });
});
