import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { SupervisorEntity } from "../../entities/supervisor.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { SupervisorInMemoryRepository } from "../__mocks__/supervisor-in-memory.repository";
import { RejeitarTrocaTurnoUseCase } from "../rejeitar-troca-turno.usecase";

function criarSolicitacao(solicitanteId = "func-a") {
  const turno = Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId: solicitanteId,
  }).getValue();

  return SolicitacaoTrocaTurno.create({ turno, solicitanteId }).getValue();
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
  it("rejeita a solicitação pendente registrando o motivo", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const solicitacao = criarSolicitacao();
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
  });

  it("falha quando quem rejeita não é um supervisor", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: "func-b",
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
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      motivo: "",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Motivo da rejeição não pode ser vazio");
  });

  it("falha quando a solicitação já não está mais pendente", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.save(supervisor);
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.save(solicitacao);
    solicitacao.cancelar();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      supervisorId: supervisor.id,
      motivo: "Equipe reduzida",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação de troca não está mais pendente");
  });
});
