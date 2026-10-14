import { describe, expect, it } from "bun:test";
import { assertOk } from "core-kernel/testing";
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

    assertOk(result);
    expect(result.value).toEqual([]);
  });

  it("retorna todos os turnos cadastrados", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turnoA = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).unwrap();
    const turnoB = Turno.create({
      data: "2026-09-25",
      horaInicio: "13:00",
      horaFim: "17:00",
      funcionarioId: "func-b",
    }).unwrap();
    await turnoRepository.create(turnoA);
    await turnoRepository.create(turnoB);

    const result = await useCase.execute();

    assertOk(result);
    expect(result.value).toHaveLength(2);
    expect(result.value).toEqual(expect.arrayContaining([turnoA, turnoB]));
  });
});
