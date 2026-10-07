import { describe, expect, it } from "bun:test";
import { SupervisorEntity } from "../../entities/supervisor.entity";
import { Turno } from "../../entities/turno.entity";
import { SupervisorInMemoryRepository } from "../__mocks__/supervisor-in-memory.repository";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { RemoverTurnoUseCase } from "../remover-turno.usecase";

function criarSut() {
  const supervisorRepository = new SupervisorInMemoryRepository();
  const turnoRepository = new TurnoInMemoryRepository();
  const useCase = new RemoverTurnoUseCase(supervisorRepository, turnoRepository);

  return { supervisorRepository, turnoRepository, useCase };
}

async function criarSupervisor(repository: SupervisorInMemoryRepository) {
  const supervisor = SupervisorEntity.create({
    name: "Sup Visor",
    email: "sup@empresa.com",
  }).getValue();
  await repository.save(supervisor);
  return supervisor;
}

describe("RemoverTurnoUseCase", () => {
  it("remove um turno existente", async () => {
    const { supervisorRepository, turnoRepository, useCase } = criarSut();
    const supervisor = await criarSupervisor(supervisorRepository);
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).getValue();
    await turnoRepository.save(turno);

    const result = await useCase.execute({ supervisorId: supervisor.id, id: turno.id });

    expect(result.isSuccess).toBe(true);
    expect(await turnoRepository.findById(turno.id)).toBeNull();
  });

  it("falha quando o turno não existe", async () => {
    const { supervisorRepository, useCase } = criarSut();
    const supervisor = await criarSupervisor(supervisorRepository);

    const result = await useCase.execute({ supervisorId: supervisor.id, id: "turno-inexistente" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Turno não encontrado");
  });

  it("falha quando o supervisor não existe e não remove o turno", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).getValue();
    await turnoRepository.save(turno);

    const result = await useCase.execute({ supervisorId: "sup-inexistente", id: turno.id });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Supervisor não encontrado");
    expect(await turnoRepository.findById(turno.id)).toBe(turno);
  });
});
