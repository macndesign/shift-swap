import { describe, expect, it } from "bun:test";
import { SupervisorEntity } from "../../entities/supervisor.entity";
import { SupervisorInMemoryRepository } from "../__mocks__/supervisor-in-memory.repository";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { CriarTurnoUseCase } from "../criar-turno.usecase";

function criarSut() {
  const supervisorRepository = new SupervisorInMemoryRepository();
  const turnoRepository = new TurnoInMemoryRepository();
  const useCase = new CriarTurnoUseCase(supervisorRepository, turnoRepository);

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

describe("CriarTurnoUseCase", () => {
  it("cria e persiste um turno válido", async () => {
    const { supervisorRepository, turnoRepository, useCase } = criarSut();
    const supervisor = await criarSupervisor(supervisorRepository);

    const result = await useCase.execute({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
      supervisorId: supervisor.id,
    });

    expect(result.isSuccess).toBe(true);
    const turno = result.getValue();
    expect(turno.funcionarioId).toBe("func-a");
    expect(await turnoRepository.findById(turno.id)).toBe(turno);
  });

  it("falha quando o horário é inválido", async () => {
    const { supervisorRepository, useCase } = criarSut();
    const supervisor = await criarSupervisor(supervisorRepository);

    const result = await useCase.execute({
      data: "2026-09-24",
      horaInicio: "12:00",
      horaFim: "08:00",
      funcionarioId: "func-a",
      supervisorId: supervisor.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Hora de fim deve ser depois da hora de início");
  });

  it("falha quando o supervisor não existe", async () => {
    const { turnoRepository, useCase } = criarSut();

    const result = await useCase.execute({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
      supervisorId: "sup-inexistente",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Supervisor não encontrado");
    expect(await turnoRepository.findAll()).toHaveLength(0);
  });
});
