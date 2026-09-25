import { describe, expect, it } from "bun:test";
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
    }).getValue();
    await turnoRepository.save(turno);

    const result = await useCase.execute({ id: turno.id });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(turno);
  });

  it("falha quando o turno não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ id: "turno-inexistente" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Turno não encontrado");
  });
});
