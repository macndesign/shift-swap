import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { SupervisorEntity } from "../../entities/supervisor.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { SupervisorInMemoryRepository } from "../__mocks__/supervisor-in-memory.repository";
import { RejeitarTrocaTurnoUseCase } from "../rejeitar-troca-turno.usecase";

function criarSolicitacaoAceita() {
  const turno = Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId: "func-a",
  }).getValue();
  const solicitacao = SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: "func-a",
    destinatarioId: "func-b",
  }).getValue();
  solicitacao.aceitar({ funcionarioId: "func-b" });
  return solicitacao;
}

function criarSupervisor() {
  return SupervisorEntity.create({
    name: "Supervisor Teste",
    email: "sup@exemplo.com",
  }).getValue();
}

function criarSut() {
  const supervisorRepository = new SupervisorInMemoryRepository();
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new RejeitarTrocaTurnoUseCase(supervisorRepository, solicitacaoRepository);

  return { supervisorRepository, solicitacaoRepository, useCase };
}

describe("RejeitarTrocaTurnoUseCase", () => {
  it("rejeita a solicitação aceita registrando o motivo", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const solicitacao = criarSolicitacaoAceita();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      motivo: "Equipe reduzida",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe("rejeitada");
    expect(result.getValue().motivo).toBe("Equipe reduzida");
    expect(result.getValue().decididoPorId).toBe(supervisor.id);
    expect(solicitacao.turno.funcionarioId).toBe("func-a");
  });

  it("falha quando quem rejeita não é um supervisor", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacaoAceita();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: "func-c",
      motivo: "Equipe reduzida",
    });

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
      motivo: "Equipe reduzida",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação não encontrada");
  });

  it("falha quando o motivo está vazio", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const solicitacao = criarSolicitacaoAceita();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      motivo: "",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Motivo da rejeição não pode ser vazio");
  });

  it("falha quando o destinatário ainda não aceitou", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const solicitacao = SolicitacaoTrocaTurno.create({
      turno: Turno.create({
        data: "2026-09-24",
        horaInicio: "08:00",
        horaFim: "12:00",
        funcionarioId: "func-a",
      }).getValue(),
      solicitanteId: "func-a",
      destinatarioId: "func-b",
    }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      motivo: "Equipe reduzida",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Não é possível rejeitar uma solicitação pendente");
  });

  it("falha quando a solicitação já foi cancelada", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const solicitacao = criarSolicitacaoAceita();
    await solicitacaoRepository.save(solicitacao);
    solicitacao.cancelar();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      motivo: "Equipe reduzida",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Não é possível rejeitar uma solicitação cancelada");
  });
});
