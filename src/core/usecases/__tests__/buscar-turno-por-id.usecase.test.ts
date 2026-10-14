import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { Turno } from "../../entities/turno.entity";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { BuscarTurnoPorIdUseCase } from "../buscar-turno-por-id.usecase";

function criarSut() {
  const turnoRepository = new TurnoInMemoryRepository();
  const useCase = new BuscarTurnoPorIdUseCase(turnoRepository);

  return { turnoRepository, useCase };
}

describe("BuscarTurnoPorIdUseCase", () => {
  it("retorna o turno quando ele existe", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).unwrap();
    await turnoRepository.create(turno);

    const result = await useCase.execute({ id: turno.id.value });

    assertOk(result);
    expect(result.value).toBe(turno);
  });

  it("falha quando o turno não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ id: "turno-inexistente" });

    assertFail(result, "TURNO_NAO_ENCONTRADO");
    expect(result.error.message).toBe("Turno não encontrado");
  });
});
