import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { AGORA, funcionarioId } from "../../__tests__/fixtures.js";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity.js";
import { Turno } from "../../entities/turno.entity.js";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository.js";
import { CancelarTrocaTurnoUseCase } from "../cancelar-troca-turno.usecase.js";

function criarSolicitacao(solicitanteId = "func-a") {
  const turno = Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId: solicitanteId,
  }).unwrap();

  return SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: funcionarioId(solicitanteId),
    destinatarioId: funcionarioId("func-b"),
  }).unwrap();
}

function criarSut() {
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new CancelarTrocaTurnoUseCase(solicitacaoRepository);

  return { solicitacaoRepository, useCase };
}

describe("CancelarTrocaTurnoUseCase", () => {
  it("cancela uma solicitação pendente quando quem cancela é o solicitante", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao("func-a");
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      solicitanteId: "func-a",
    });

    assertOk(result);
    expect(result.value.status).toBe("cancelada");
  });

  it("cancela uma solicitação que o destinatário já aceitou e aguarda aprovação", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao("func-a");
    await solicitacaoRepository.create(solicitacao);
    solicitacao.aceitar({ funcionarioId: funcionarioId("func-b"), agora: AGORA }).unwrap();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      solicitanteId: "func-a",
    });

    assertOk(result);
    expect(result.value.status).toBe("cancelada");
  });

  it("falha quando a solicitação não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({
      solicitacaoId: "solicitacao-inexistente",
      solicitanteId: "func-a",
    });

    assertFail(result, "SOLICITACAO_NAO_ENCONTRADA");
    expect(result.error.message).toBe("Solicitação não encontrada");
  });

  it("falha quando quem tenta cancelar não é o solicitante", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao("func-a");
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      solicitanteId: "func-b",
    });

    assertFail(result, "SOMENTE_SOLICITANTE");
    expect(result.error.message).toBe("Somente o solicitante pode cancelar a solicitação");
  });

  it("falha quando a solicitação já foi cancelada", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao("func-a");
    await solicitacaoRepository.create(solicitacao);
    solicitacao.cancelar().unwrap();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      solicitanteId: "func-a",
    });

    assertFail(result, "TRANSICAO_INVALIDA");
    expect(result.error.message).toBe("Não é possível cancelar uma solicitação cancelada");
  });
});
