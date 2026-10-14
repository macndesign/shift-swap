import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { AGORA, funcionarioId, relogio } from "../../__tests__/fixtures";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { RecusarTrocaTurnoUseCase } from "../recusar-troca-turno.usecase";

function criarSolicitacao() {
  const turno = Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId: "func-a",
  }).unwrap();

  return SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: funcionarioId("func-a"),
    destinatarioId: funcionarioId("func-b"),
  }).unwrap();
}

function criarSut() {
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new RecusarTrocaTurnoUseCase(solicitacaoRepository, relogio());

  return { solicitacaoRepository, useCase };
}

describe("RecusarTrocaTurnoUseCase", () => {
  it("recusa a solicitação pendente e mantém o turno com o solicitante", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      funcionarioId: "func-b",
    });

    assertOk(result);
    expect(result.value.status).toBe("recusada");
    expect(result.value.respondidaEm).toEqual(AGORA);
    expect(solicitacao.turno.funcionarioId.value).toBe("func-a");
  });

  it("guarda o motivo quando informado", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      funcionarioId: "func-b",
      motivo: "Tenho consulta",
    });

    assertOk(result);
    expect(result.value.motivo).toBe("Tenho consulta");
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

  it("falha quando quem recusa não é o destinatário", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      funcionarioId: "func-c",
    });

    assertFail(result, "SOMENTE_DESTINATARIO");
    expect(result.error.message).toBe("Somente o destinatário pode recusar a solicitação");
  });

  it("falha quando o destinatário já aceitou", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.create(solicitacao);
    solicitacao.aceitar({ funcionarioId: funcionarioId("func-b"), agora: AGORA }).unwrap();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id.value,
      funcionarioId: "func-b",
    });

    assertFail(result, "TRANSICAO_INVALIDA");
    expect(result.error.message).toBe(
      "Não é possível recusar uma solicitação aguardando aprovação",
    );
  });
});
