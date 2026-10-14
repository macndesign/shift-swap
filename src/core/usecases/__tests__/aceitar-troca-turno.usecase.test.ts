import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { AGORA, funcionarioId, relogio } from "../../__tests__/fixtures";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { AceitarTrocaTurnoUseCase } from "../aceitar-troca-turno.usecase";

function criarTurno(dono: string, horaInicio = "08:00", horaFim = "12:00") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio,
    horaFim,
    funcionarioId: dono,
  }).unwrap();
}

function criarSolicitacao(turno: Turno) {
  return SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: funcionarioId("func-a"),
    destinatarioId: funcionarioId("func-b"),
  }).unwrap();
}

function criarSut() {
  const turnoRepository = new TurnoInMemoryRepository();
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new AceitarTrocaTurnoUseCase(turnoRepository, solicitacaoRepository, relogio());

  return { turnoRepository, solicitacaoRepository, useCase };
}

describe("AceitarTrocaTurnoUseCase", () => {
  it("aceita a solicitação e passa a aguardar a aprovação sem mexer no turno", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      funcionarioId: "func-b",
    });

    assertOk(result);
    expect(result.value.status).toBe("aguardando_aprovacao");
    expect(result.value.respondidaEm).toEqual(AGORA);
    expect(turno.funcionarioId.value).toBe("func-a");
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

    assertFail(result, "SOLICITACAO_NAO_ENCONTRADA");
    expect(result.error.message).toBe("Solicitação não encontrada");
  });

  it("falha quando quem aceita não é o destinatário", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      funcionarioId: "func-c",
    });

    assertFail(result, "SOMENTE_DESTINATARIO");
    expect(result.error.message).toBe("Somente o destinatário pode aceitar a solicitação");
    expect(solicitacao.status).toBe("pendente");
  });

  it("falha quando o destinatário já possui um turno no mesmo horário", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a", "08:00", "12:00");
    await turnoRepository.create(turno);
    await turnoRepository.create(criarTurno("func-b", "10:00", "14:00"));
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      funcionarioId: "func-b",
    });

    assertFail(result, "CONFLITO_DE_HORARIO");
    expect(result.error.message).toBe("Funcionário já possui um turno nesse horário");
    expect(solicitacao.status).toBe("pendente");
  });

  it("não considera um turno em outro horário como conflito", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a", "08:00", "12:00");
    await turnoRepository.create(turno);
    await turnoRepository.create(criarTurno("func-b", "13:00", "17:00"));
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      funcionarioId: "func-b",
    });

    assertOk(result);
  });

  it("falha quando a solicitação já foi respondida", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const solicitacao = criarSolicitacao(turno);
    await solicitacaoRepository.create(solicitacao);
    solicitacao.cancelar().unwrap();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      funcionarioId: "func-b",
    });

    assertFail(result, "TRANSICAO_INVALIDA");
    expect(result.error.message).toBe("Não é possível aceitar uma solicitação cancelada");
  });
});
