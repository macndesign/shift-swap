import { describe, expect, it } from "bun:test";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { SolicitarTrocaTurnoUseCase } from "../solicitar-troca-turno.usecase";

function criarTurno(funcionarioId = "func-a") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId,
  }).getValue();
}

function criarSut() {
  const turnoRepository = new TurnoInMemoryRepository();
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new SolicitarTrocaTurnoUseCase(turnoRepository, solicitacaoRepository);

  return { turnoRepository, solicitacaoRepository, useCase };
}

describe("SolicitarTrocaTurnoUseCase", () => {
  it("cria e persiste uma solicitação pendente quando o turno existe e não há pendências", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);

    const result = await useCase.execute({ turnoId: turno.id, solicitanteId: "func-a" });

    expect(result.isSuccess).toBe(true);
    const solicitacao = result.getValue();
    expect(solicitacao.status).toBe("pendente");
    expect(solicitacao.turno.id).toBe(turno.id);
    expect(await solicitacaoRepository.findById(solicitacao.id)).toBe(solicitacao);
  });

  it("falha quando o turno não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ turnoId: "turno-inexistente", solicitanteId: "func-a" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Turno não encontrado");
  });

  it("falha quando já existe uma solicitação pendente para o turno", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    await useCase.execute({ turnoId: turno.id, solicitanteId: "func-a" });

    const result = await useCase.execute({ turnoId: turno.id, solicitanteId: "func-a" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Já existe uma solicitação pendente para esse turno");
  });

  it("falha quando o solicitante não é o dono do turno", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);

    const result = await useCase.execute({ turnoId: turno.id, solicitanteId: "func-b" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Somente o funcionário dono do turno pode solicitar a troca");
  });
});
