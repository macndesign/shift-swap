import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { FuncionarioEntity } from "../../entities/funcionario.entity.js";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository.js";
import { BuscarFuncionarioPorIdUseCase } from "../buscar-funcionario-por-id.usecase.js";

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
    }).unwrap();
    await funcionarioRepository.create(funcionario);

    const result = await useCase.execute({ id: funcionario.id.value });

    assertOk(result);
    expect(result.value).toBe(funcionario);
  });

  it("falha quando o funcionário não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ id: "funcionario-inexistente" });

    assertFail(result, "FUNCIONARIO_NAO_ENCONTRADO");
    expect(result.error.message).toBe("Funcionário não encontrado");
  });
});
