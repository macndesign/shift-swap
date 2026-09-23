import { describe, expect, it } from "bun:test";
import { Turno } from "../../entities/turno.entity";
import { ListarTurnosPorFuncionarioEDataUseCase } from "../listar-turnos-por-funcionario-e-data.usecase";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";

function criarTurno(funcionarioId: string, data: string, horaInicio = "08:00", horaFim = "12:00") {
  return Turno.create({ data, horaInicio, horaFim, funcionarioId }).getValue();
}

function criarSut() {
  const turnoRepository = new TurnoInMemoryRepository();
  const useCase = new ListarTurnosPorFuncionarioEDataUseCase(turnoRepository);

  return { turnoRepository, useCase };
}

describe("ListarTurnosPorFuncionarioEDataUseCase", () => {
  it("retorna apenas os turnos do funcionário na data informada", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turnoAlvo = criarTurno("func-a", "2026-09-24");
    const turnoOutraData = criarTurno("func-a", "2026-09-25");
    const turnoOutroFuncionario = criarTurno("func-b", "2026-09-24");
    await turnoRepository.save(turnoAlvo);
    await turnoRepository.save(turnoOutraData);
    await turnoRepository.save(turnoOutroFuncionario);

    const result = await useCase.execute({ funcionarioId: "func-a", data: "2026-09-24" });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([turnoAlvo]);
  });

  it("retorna uma lista vazia quando o funcionário não tem turnos na data", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a", "2026-09-25");
    await turnoRepository.save(turno);

    const result = await useCase.execute({ funcionarioId: "func-a", data: "2026-09-24" });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([]);
  });
});
