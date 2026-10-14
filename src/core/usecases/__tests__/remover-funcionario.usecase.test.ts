import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
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
    }).unwrap();
    await funcionarioRepository.create(funcionario);

    const result = await useCase.execute({ id: funcionario.id.value });

    assertOk(result);
    expect(await funcionarioRepository.findById(funcionario.id)).toBeNull();
  });

  it("falha quando o funcionário não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ id: "funcionario-inexistente" });

    assertFail(result, "FUNCIONARIO_NAO_ENCONTRADO");
    expect(result.error.message).toBe("Funcionário não encontrado");
  });
});
