import { describe, expect, it } from "bun:test";
import { Turno } from "../../entities/turno.entity";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { ListarTurnosUseCase } from "../listar-turnos.usecase";

function criarSut() {
  const turnoRepository = new TurnoInMemoryRepository();
  const useCase = new ListarTurnosUseCase(turnoRepository);

  return { turnoRepository, useCase };
}

describe("ListarTurnosUseCase", () => {
  it("retorna uma lista vazia quando não há turnos", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([]);
  });

  it("retorna todos os turnos cadastrados", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turnoA = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).getValue();
    const turnoB = Turno.create({
      data: "2026-09-25",
      horaInicio: "13:00",
      horaFim: "17:00",
      funcionarioId: "func-b",
    }).getValue();
    await turnoRepository.save(turnoA);
    await turnoRepository.save(turnoB);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(2);
    expect(result.getValue()).toEqual(expect.arrayContaining([turnoA, turnoB]));
  });
});
