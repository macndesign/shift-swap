import { describe, expect, it } from "bun:test";
import { FuncionarioEntity } from "../../entities/funcionario.entity";
import { ListarFuncionariosUseCase } from "../listar-funcionarios.usecase";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";

function criarSut() {
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const useCase = new ListarFuncionariosUseCase(funcionarioRepository);

  return { funcionarioRepository, useCase };
}

describe("ListarFuncionariosUseCase", () => {
  it("retorna uma lista vazia quando não há funcionários", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([]);
  });

  it("retorna todos os funcionários cadastrados", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const maria = FuncionarioEntity.create({ name: "Maria", email: "maria@exemplo.com" }).getValue();
    const joana = FuncionarioEntity.create({ name: "Joana", email: "joana@exemplo.com" }).getValue();
    await funcionarioRepository.save(maria);
    await funcionarioRepository.save(joana);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(2);
    expect(result.getValue()).toEqual(expect.arrayContaining([maria, joana]));
  });
});
