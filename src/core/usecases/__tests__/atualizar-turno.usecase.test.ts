import { describe, expect, it } from "bun:test";
import { Turno } from "../../entities/turno.entity";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { AtualizarTurnoUseCase } from "../atualizar-turno.usecase";

function criarSut() {
  const turnoRepository = new TurnoInMemoryRepository();
  const useCase = new AtualizarTurnoUseCase(turnoRepository);

  return { turnoRepository, useCase };
}

describe("AtualizarTurnoUseCase", () => {
  it("atualiza o horário de um turno existente", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).getValue();
    await turnoRepository.save(turno);

    const result = await useCase.execute({
      id: turno.id,
      data: "2026-09-25",
      horaInicio: "13:00",
      horaFim: "17:00",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().data).toBe("2026-09-25");
    expect(result.getValue().horaInicio).toBe("13:00");
    expect(result.getValue().horaFim).toBe("17:00");
  });

  it("falha quando o turno não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({
      id: "turno-inexistente",
      data: "2026-09-25",
      horaInicio: "13:00",
      horaFim: "17:00",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Turno não encontrado");
  });

  it("falha quando o novo horário é inválido", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).getValue();
    await turnoRepository.save(turno);

    const result = await useCase.execute({
      id: turno.id,
      data: "2026-09-25",
      horaInicio: "17:00",
      horaFim: "13:00",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Hora de fim deve ser depois da hora de início");
  });
});
