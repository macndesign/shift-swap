import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { SupervisorEntity } from "../../entities/supervisor.entity.js";
import { Turno } from "../../entities/turno.entity.js";
import { SupervisorInMemoryRepository } from "../__mocks__/supervisor-in-memory.repository.js";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository.js";
import { AtualizarTurnoUseCase } from "../atualizar-turno.usecase.js";

function criarSut() {
  const supervisorRepository = new SupervisorInMemoryRepository();
  const turnoRepository = new TurnoInMemoryRepository();
  const useCase = new AtualizarTurnoUseCase(supervisorRepository, turnoRepository);

  return { supervisorRepository, turnoRepository, useCase };
}

async function criarSupervisor(repository: SupervisorInMemoryRepository) {
  const supervisor = SupervisorEntity.create({
    name: "Sup Visor",
    email: "sup@empresa.com",
  }).unwrap();
  await repository.create(supervisor);
  return supervisor;
}

describe("AtualizarTurnoUseCase", () => {
  it("atualiza o horário de um turno existente", async () => {
    const { supervisorRepository, turnoRepository, useCase } = criarSut();
    const supervisor = await criarSupervisor(supervisorRepository);
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).unwrap();
    await turnoRepository.create(turno);

    const result = await useCase.execute({
      supervisorId: supervisor.id.value,
      id: turno.id.value,
      data: "2026-09-25",
      horaInicio: "13:00",
      horaFim: "17:00",
    });

    assertOk(result);
    expect(result.value.data).toBe("2026-09-25");
    expect(result.value.horaInicio).toBe("13:00");
    expect(result.value.horaFim).toBe("17:00");
  });

  it("falha quando o turno não existe", async () => {
    const { supervisorRepository, useCase } = criarSut();
    const supervisor = await criarSupervisor(supervisorRepository);

    const result = await useCase.execute({
      supervisorId: supervisor.id.value,
      id: "turno-inexistente",
      data: "2026-09-25",
      horaInicio: "13:00",
      horaFim: "17:00",
    });

    assertFail(result, "TURNO_NAO_ENCONTRADO");
    expect(result.error.message).toBe("Turno não encontrado");
  });

  it("falha quando o novo horário é inválido", async () => {
    const { supervisorRepository, turnoRepository, useCase } = criarSut();
    const supervisor = await criarSupervisor(supervisorRepository);
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).unwrap();
    await turnoRepository.create(turno);

    const result = await useCase.execute({
      supervisorId: supervisor.id.value,
      id: turno.id.value,
      data: "2026-09-25",
      horaInicio: "17:00",
      horaFim: "13:00",
    });

    assertFail(result, "HORARIO_INVALIDO");
    expect(result.error.message).toBe("Hora de fim deve ser depois da hora de início");
  });

  it("falha quando o supervisor não existe e não altera o turno", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).unwrap();
    await turnoRepository.create(turno);

    const result = await useCase.execute({
      supervisorId: "sup-inexistente",
      id: turno.id.value,
      data: "2026-09-25",
      horaInicio: "13:00",
      horaFim: "17:00",
    });

    assertFail(result, "SUPERVISOR_NAO_ENCONTRADO");
    expect(result.error.message).toBe("Supervisor não encontrado");
    expect(turno.data).toBe("2026-09-24");
  });
});
