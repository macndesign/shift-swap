import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { funcionarioId } from "../../__tests__/fixtures.js";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity.js";
import { Turno } from "../../entities/turno.entity.js";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository.js";
import { BuscarSolicitacaoTrocaTurnoPorIdUseCase } from "../buscar-solicitacao-troca-turno-por-id.usecase.js";

function criarSut() {
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new BuscarSolicitacaoTrocaTurnoPorIdUseCase(solicitacaoRepository);

  return { solicitacaoRepository, useCase };
}

describe("BuscarSolicitacaoTrocaTurnoPorIdUseCase", () => {
  it("retorna a solicitação quando ela existe", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
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
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({ id: solicitacao.id.value });

    assertOk(result);
    expect(result.value).toBe(solicitacao);
  });

  it("falha quando a solicitação não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ id: "solicitacao-inexistente" });

    assertFail(result, "SOLICITACAO_NAO_ENCONTRADA");
    expect(result.error.message).toBe("Solicitação não encontrada");
  });
});
