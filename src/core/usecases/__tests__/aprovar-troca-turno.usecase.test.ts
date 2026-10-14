import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { AGORA, funcionarioId, relogio } from "../../__tests__/fixtures.js";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity.js";
import { SupervisorEntity } from "../../entities/supervisor.entity.js";
import { Turno } from "../../entities/turno.entity.js";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository.js";
import { SupervisorInMemoryRepository } from "../__mocks__/supervisor-in-memory.repository.js";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository.js";
import { AprovarTrocaTurnoUseCase } from "../aprovar-troca-turno.usecase.js";

function criarTurno(dono: string, horaInicio = "08:00", horaFim = "12:00") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio,
    horaFim,
    funcionarioId: dono,
  }).unwrap();
}

function criarSupervisor() {
  return SupervisorEntity.create({
    name: "Supervisor Teste",
    email: "sup@exemplo.com",
  }).unwrap();
}

function criarSolicitacaoAceita(turno: Turno) {
  const solicitacao = SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: funcionarioId("func-a"),
    destinatarioId: funcionarioId("func-b"),
  }).unwrap();
  solicitacao.aceitar({ funcionarioId: funcionarioId("func-b"), agora: AGORA }).unwrap();
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
    relogio(),
  );

  return { supervisorRepository, turnoRepository, solicitacaoRepository, useCase };
}

describe("AprovarTrocaTurnoUseCase", () => {
  it("aprova a solicitação aceita e transfere o turno para o destinatário", async () => {
    const { supervisorRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.create(supervisor);
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const solicitacao = criarSolicitacaoAceita(turno);
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: supervisor.id.value,
    });

    assertOk(result);
    expect(result.value.status).toBe("aprovada");
    expect(result.value.decididoPorId?.equals(supervisor.id)).toBe(true);
    expect(result.value.decididoEm).toEqual(AGORA);
    expect(turno.funcionarioId.value).toBe("func-b");
    expect((await turnoRepository.findById(turno.id))?.funcionarioId.value).toBe("func-b");
  });

  it("falha quando quem aprova não é um supervisor", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const solicitacao = criarSolicitacaoAceita(turno);
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: "func-b",
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
    });

    assertFail(result, "SOLICITACAO_NAO_ENCONTRADA");
    expect(result.error.message).toBe("Solicitação não encontrada");
  });

  it("falha quando o destinatário ainda não aceitou", async () => {
    const { supervisorRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.create(supervisor);
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const solicitacao = SolicitacaoTrocaTurno.create({
      turno,
      solicitanteId: funcionarioId("func-a"),
      destinatarioId: funcionarioId("func-b"),
    }).unwrap();
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: supervisor.id.value,
    });

    assertFail(result, "TRANSICAO_INVALIDA");
    expect(result.error.message).toBe("Não é possível aprovar uma solicitação pendente");
    expect(turno.funcionarioId.value).toBe("func-a");
  });

  it("falha quando o destinatário passou a ter um turno no mesmo horário depois do aceite", async () => {
    const { supervisorRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.create(supervisor);
    const turno = criarTurno("func-a", "08:00", "12:00");
    await turnoRepository.create(turno);
    const solicitacao = criarSolicitacaoAceita(turno);
    await solicitacaoRepository.create(solicitacao);
    await turnoRepository.create(criarTurno("func-b", "10:00", "14:00"));

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: supervisor.id.value,
    });

    assertFail(result, "CONFLITO_DE_HORARIO");
    expect(result.error.message).toBe("Funcionário já possui um turno nesse horário");
    expect(solicitacao.status).toBe("aguardando_aprovacao");
    expect(turno.funcionarioId.value).toBe("func-a");
  });

  it("falha quando a solicitação já foi decidida", async () => {
    const { supervisorRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const supervisor = criarSupervisor();
    await supervisorRepository.create(supervisor);
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const solicitacao = criarSolicitacaoAceita(turno);
    await solicitacaoRepository.create(solicitacao);
    assertOk(
      await useCase.execute({
        solicitacaoId: solicitacao.id.value,
        supervisorId: supervisor.id.value,
      }),
    );

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      supervisorId: supervisor.id.value,
    });

    assertFail(result, "TRANSICAO_INVALIDA");
    expect(result.error.message).toBe("Não é possível aprovar uma solicitação aprovada");
  });
});
