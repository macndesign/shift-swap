import { describe, expect, it } from "bun:test";
import { assertOk } from "core-kernel/testing";
import { Turno } from "../../entities/turno.entity";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { ListarTurnosPorFuncionarioEDataUseCase } from "../listar-turnos-por-funcionario-e-data.usecase";

function criarTurno(funcionarioId: string, data: string, horaInicio = "08:00", horaFim = "12:00") {
  return Turno.create({ data, horaInicio, horaFim, funcionarioId }).unwrap();
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
    await turnoRepository.create(turnoAlvo);
    await turnoRepository.create(turnoOutraData);
    await turnoRepository.create(turnoOutroFuncionario);

    const result = await useCase.execute({ funcionarioId: "func-a", data: "2026-09-24" });

    assertOk(result);
    expect(result.value).toEqual([turnoAlvo]);
  });

  it("retorna uma lista vazia quando o funcionário não tem turnos na data", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a", "2026-09-25");
    await turnoRepository.create(turno);

    const result = await useCase.execute({ funcionarioId: "func-a", data: "2026-09-24" });

    assertOk(result);
    expect(result.value).toEqual([]);
  });
});
