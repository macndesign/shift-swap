import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { AceitarTrocaTurnoUseCase } from "../aceitar-troca-turno.usecase";

function criarTurno(funcionarioId: string, horaInicio = "08:00", horaFim = "12:00") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio,
    horaFim,
    funcionarioId,
  }).getValue();
}

function criarSolicitacao(turno: Turno) {
  return SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: "func-a",
    destinatarioId: "func-b",
  }).getValue();
}

function criarSut() {
  const turnoRepository = new TurnoInMemoryRepository();
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new AceitarTrocaTurnoUseCase(turnoRepository, solicitacaoRepository);

  return { turnoRepository, solicitacaoRepository, useCase };
}

describe("AceitarTrocaTurnoUseCase", () => {
  it("aceita a solicitação e passa a aguardar a aprovação sem mexer no turno", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "func-b",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe("aguardando_aprovacao");
    expect(result.getValue().respondidaEm).toBeInstanceOf(Date);
    expect(turno.funcionarioId).toBe("func-a");
    expect((await solicitacaoRepository.findById(solicitacao.id))?.status).toBe(
      "aguardando_aprovacao",
    );
  });

  it("falha quando a solicitação não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({
      solicitacaoId: "solicitacao-inexistente",
      funcionarioId: "func-b",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação não encontrada");
  });

  it("falha quando quem aceita não é o destinatário", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "func-c",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Somente o destinatário pode aceitar a solicitação");
    expect(solicitacao.status).toBe("pendente");
  });

  it("falha quando o destinatário já possui um turno no mesmo horário", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a", "08:00", "12:00");
    await turnoRepository.save(turno);
    await turnoRepository.save(criarTurno("func-b", "10:00", "14:00"));
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "func-b",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário já possui um turno nesse horário");
    expect(solicitacao.status).toBe("pendente");
  });

  it("não considera um turno em outro horário como conflito", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a", "08:00", "12:00");
    await turnoRepository.save(turno);
    await turnoRepository.save(criarTurno("func-b", "13:00", "17:00"));
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "func-b",
    });

    expect(result.isSuccess).toBe(true);
  });

  it("falha quando a solicitação já foi respondida", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.save(solicitacao);
    solicitacao.cancelar();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "func-b",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Não é possível aceitar uma solicitação cancelada");
  });
});
