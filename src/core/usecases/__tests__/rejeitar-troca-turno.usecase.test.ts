import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { AGORA, funcionarioId, relogio } from "../../__tests__/fixtures";
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
  }).unwrap();
  const solicitacao = SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: funcionarioId("func-a"),
    destinatarioId: funcionarioId("func-b"),
  }).unwrap();
  solicitacao.aceitar({ funcionarioId: funcionarioId("func-b"), agora: AGORA }).unwrap();
  return solicitacao;
}

function criarSupervisor() {
  return SupervisorEntity.create({
    name: "Supervisor Teste",
    email: "sup@exemplo.com",
  }).unwrap();
}

function criarSut() {
  const supervisorRepository = new SupervisorInMemoryRepository();
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new RejeitarTrocaTurnoUseCase(
    supervisorRepository,
    solicitacaoRepository,
    relogio(),
  );

  return { supervisorRepository, solicitacaoRepository, useCase };
}

describe("RejeitarTrocaTurnoUseCase", () => {
  it("rejeita a solicitação aceita registrando o motivo", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.create(supervisor);
    const solicitacao = criarSolicitacaoAceita();
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: supervisor.id.value,
      motivo: "Equipe reduzida",
    });

    assertOk(result);
    expect(result.value.status).toBe("rejeitada");
    expect(result.value.motivo).toBe("Equipe reduzida");
    expect(result.value.decididoPorId?.equals(supervisor.id)).toBe(true);
    expect(result.value.decididoEm).toEqual(AGORA);
    expect(solicitacao.turno.funcionarioId.value).toBe("func-a");
  });

  it("falha quando quem rejeita não é um supervisor", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacaoAceita();
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: "func-c",
      motivo: "Equipe reduzida",
    });

    assertFail(result, "SUPERVISOR_NAO_ENCONTRADO");
    expect(result.error.message).toBe("Supervisor não encontrado");
  });

  it("falha quando a solicitação não existe", async () => {
    const { supervisorRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.create(supervisor);

    const result = await useCase.execute({
      solicitacaoId: "solicitacao-inexistente",
      supervisorId: supervisor.id.value,
      motivo: "Equipe reduzida",
    });

    assertFail(result, "SOLICITACAO_NAO_ENCONTRADA");
    expect(result.error.message).toBe("Solicitação não encontrada");
  });

  it("falha quando o motivo está vazio", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.create(supervisor);
    const solicitacao = criarSolicitacaoAceita();
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: supervisor.id.value,
      motivo: "",
    });

    assertFail(result, "MOTIVO_OBRIGATORIO");
    expect(result.error.message).toBe("Motivo da rejeição não pode ser vazio");
  });

  it("falha quando o destinatário ainda não aceitou", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.create(supervisor);
    const solicitacao = SolicitacaoTrocaTurno.create({
      turno: Turno.create({
        data: "2026-09-24",
        horaInicio: "08:00",
        horaFim: "12:00",
        funcionarioId: "func-a",
      }).unwrap(),
      solicitanteId: funcionarioId("func-a"),
      destinatarioId: funcionarioId("func-b"),
    }).unwrap();
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: supervisor.id.value,
      motivo: "Equipe reduzida",
    });

    assertFail(result, "TRANSICAO_INVALIDA");
    expect(result.error.message).toBe("Não é possível rejeitar uma solicitação pendente");
  });

  it("falha quando a solicitação já foi cancelada", async () => {
    const { supervisorRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.create(supervisor);
    const solicitacao = criarSolicitacaoAceita();
    await solicitacaoRepository.create(solicitacao);
    solicitacao.cancelar().unwrap();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: supervisor.id.value,
      motivo: "Equipe reduzida",
    });

    assertFail(result, "TRANSICAO_INVALIDA");
    expect(result.error.message).toBe("Não é possível rejeitar uma solicitação cancelada");
  });
});
