import { describe, expect, it } from "bun:test";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { CriarTurnoUseCase } from "../criar-turno.usecase";

function criarSut() {
  const turnoRepository = new TurnoInMemoryRepository();
  const useCase = new CriarTurnoUseCase(turnoRepository);

  return { turnoRepository, useCase };
}

describe("CriarTurnoUseCase", () => {
  it("cria e persiste um turno válido", async () => {
    const { turnoRepository, useCase } = criarSut();

    const result = await useCase.execute({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    });

    expect(result.isSuccess).toBe(true);
    const turno = result.getValue();
    expect(turno.funcionarioId).toBe("func-a");
    expect(await turnoRepository.findById(turno.id)).toBe(turno);
  });

  it("falha quando o horário é inválido", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({
      data: "2026-09-24",
      horaInicio: "12:00",
      horaFim: "08:00",
      funcionarioId: "func-a",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Hora de fim deve ser depois da hora de início");
  });
});
