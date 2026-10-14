import { describe, expect, it } from "bun:test";
import { assertOk } from "core-kernel/testing";
import { FuncionarioEntity } from "../../entities/funcionario.entity";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";
import { ListarFuncionariosUseCase } from "../listar-funcionarios.usecase";

function criarSut() {
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const useCase = new ListarFuncionariosUseCase(funcionarioRepository);

  return { funcionarioRepository, useCase };
}

describe("ListarFuncionariosUseCase", () => {
  it("retorna uma lista vazia quando não há funcionários", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute();

    assertOk(result);
    expect(result.value).toEqual([]);
  });

  it("retorna todos os funcionários cadastrados", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const maria = FuncionarioEntity.create({
      name: "Maria",
      email: "maria@exemplo.com",
    }).unwrap();
    const joana = FuncionarioEntity.create({
      name: "Joana",
      email: "joana@exemplo.com",
    }).unwrap();
    await funcionarioRepository.create(maria);
    await funcionarioRepository.create(joana);

    const result = await useCase.execute();

    assertOk(result);
    expect(result.value).toHaveLength(2);
    expect(result.value).toEqual(expect.arrayContaining([maria, joana]));
  });
});
