import { describe, expect, it } from "bun:test";
import { FuncionarioEntity } from "../../entities/funcionario.entity";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { SupervisorEntity } from "../../entities/supervisor.entity";
import { Turno } from "../../entities/turno.entity";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";
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

function criarFuncionario(email: string) {
  return FuncionarioEntity.create({ name: "Funcionário Teste", email }).getValue();
}

function criarSupervisor() {
  return SupervisorEntity.create({
    name: "Supervisor Teste",
    email: "sup@exemplo.com",
  }).getValue();
}

function criarSut() {
  const supervisorRepository = new SupervisorInMemoryRepository();
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const turnoRepository = new TurnoInMemoryRepository();
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new AprovarTrocaTurnoUseCase(
    supervisorRepository,
    funcionarioRepository,
    turnoRepository,
    solicitacaoRepository,
  );

  return {
    supervisorRepository,
    funcionarioRepository,
    turnoRepository,
    solicitacaoRepository,
    useCase,
  };
}

describe("AprovarTrocaTurnoUseCase", () => {
  it("aprova a solicitação e transfere o turno quando não há conflito de horário", async () => {
    const {
      supervisorRepository,
      funcionarioRepository,
      turnoRepository,
      solicitacaoRepository,
      useCase,
    } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const destinatario = criarFuncionario("destino@exemplo.com");
    await funcionarioRepository.save(destinatario);
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      destinatarioId: destinatario.id,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe("aprovada");
    expect(result.getValue().destinatarioId).toBe(destinatario.id);
    expect(result.getValue().decididoPorId).toBe(supervisor.id);
    expect(turno.funcionarioId).toBe(destinatario.id);
  });

  it("falha quando quem aprova não é um supervisor", async () => {
    const { funcionarioRepository, solicitacaoRepository, useCase } = criarSut();
    const destinatario = criarFuncionario("destino@exemplo.com");
    await funcionarioRepository.save(destinatario);
    const solicitacao = SolicitacaoTrocaTurno.create({
      turno: criarTurno("func-a"),
      solicitanteId: "func-a",
    }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: destinatario.id,
      destinatarioId: destinatario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Supervisor não encontrado");
  });

  it("falha quando a solicitação não existe", async () => {
    const { supervisorRepository, funcionarioRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const destinatario = criarFuncionario("destino@exemplo.com");
    await funcionarioRepository.save(destinatario);

    const result = await useCase.execute({
      solicitacaoId: "solicitacao-inexistente",
      supervisorId: supervisor.id,
      destinatarioId: destinatario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação não encontrada");
  });

  it("falha quando o funcionário destinatário não existe", async () => {
    const { supervisorRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      destinatarioId: "funcionario-inexistente",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário não encontrado");
  });

  it("falha quando o destinatário já possui um turno no mesmo horário", async () => {
    const {
      supervisorRepository,
      funcionarioRepository,
      turnoRepository,
      solicitacaoRepository,
      useCase,
    } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const destinatario = criarFuncionario("destino@exemplo.com");
    await funcionarioRepository.save(destinatario);
    const turno = criarTurno("func-a", "08:00", "12:00");
    await turnoRepository.save(turno);
    await turnoRepository.save(criarTurno(destinatario.id, "10:00", "14:00"));
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      destinatarioId: destinatario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário já possui um turno nesse horário");
    expect(solicitacao.status).toBe("pendente");
  });

  it("falha quando a solicitação já não está mais pendente", async () => {
    const {
      supervisorRepository,
      funcionarioRepository,
      turnoRepository,
      solicitacaoRepository,
      useCase,
    } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const destinatario = criarFuncionario("destino@exemplo.com");
    await funcionarioRepository.save(destinatario);
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    await solicitacaoRepository.save(solicitacao);
    solicitacao.cancelar();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      destinatarioId: destinatario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação de troca não está mais pendente");
  });
});
