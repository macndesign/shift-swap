import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { SupervisorEntity } from "../../entities/supervisor.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { SupervisorInMemoryRepository } from "../__mocks__/supervisor-in-memory.repository";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { AprovarTrocaTurnoUseCase } from "../aprovar-troca-turno.usecase";

function criarTurno(funcionarioId: string, horaInicio = "08:00", horaFim = "12:00") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio,
    horaFim,
    funcionarioId,
  }).getValue();
}

function criarSupervisor() {
  return SupervisorEntity.create({
    name: "Supervisor Teste",
    email: "sup@exemplo.com",
  }).getValue();
}

function criarSolicitacaoAceita(turno: Turno) {
  const solicitacao = SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: "func-a",
    destinatarioId: "func-b",
  }).getValue();
  solicitacao.aceitar({ funcionarioId: "func-b" });
  return solicitacao;
}

function criarSut() {
  const supervisorRepository = new SupervisorInMemoryRepository();
  const turnoRepository = new TurnoInMemoryRepository();
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new AprovarTrocaTurnoUseCase(
    supervisorRepository,
    turnoRepository,
    solicitacaoRepository,
  );

  return { supervisorRepository, turnoRepository, solicitacaoRepository, useCase };
}

describe("AprovarTrocaTurnoUseCase", () => {
  it("aprova a solicitação aceita e transfere o turno para o destinatário", async () => {
    const { supervisorRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = criarSolicitacaoAceita(turno);
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe("aprovada");
    expect(result.getValue().decididoPorId).toBe(supervisor.id);
    expect(turno.funcionarioId).toBe("func-b");
    expect((await turnoRepository.findById(turno.id))?.funcionarioId).toBe("func-b");
  });

  it("falha quando quem aprova não é um supervisor", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = criarSolicitacaoAceita(turno);
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({ solicitacaoId: solicitacao.id, supervisorId: "func-b" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Supervisor não encontrado");
  });

  it("falha quando a solicitação não existe", async () => {
    const { supervisorRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);

    const result = await useCase.execute({
      solicitacaoId: "solicitacao-inexistente",
      supervisorId: supervisor.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação não encontrada");
  });

  it("falha quando o destinatário ainda não aceitou", async () => {
    const { supervisorRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = SolicitacaoTrocaTurno.create({
      turno,
      solicitanteId: "func-a",
      destinatarioId: "func-b",
    }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Não é possível aprovar uma solicitação pendente");
    expect(turno.funcionarioId).toBe("func-a");
  });

  it("falha quando o destinatário passou a ter um turno no mesmo horário depois do aceite", async () => {
    const { supervisorRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const turno = criarTurno("func-a", "08:00", "12:00");
    await turnoRepository.save(turno);
    const solicitacao = criarSolicitacaoAceita(turno);
    await solicitacaoRepository.save(solicitacao);
    await turnoRepository.save(criarTurno("func-b", "10:00", "14:00"));

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário já possui um turno nesse horário");
    expect(solicitacao.status).toBe("aguardando_aprovacao");
    expect(turno.funcionarioId).toBe("func-a");
  });

  it("falha quando a solicitação já foi decidida", async () => {
    const { supervisorRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = criarSolicitacaoAceita(turno);
    await solicitacaoRepository.save(solicitacao);
    await useCase.execute({ solicitacaoId: solicitacao.id, supervisorId: supervisor.id });

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Não é possível aprovar uma solicitação aprovada");
  });
});
