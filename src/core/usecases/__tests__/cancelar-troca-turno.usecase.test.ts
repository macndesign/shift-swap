import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { CancelarTrocaTurnoUseCase } from "../cancelar-troca-turno.usecase";

function criarSolicitacao(solicitanteId = "func-a") {
  const turno = Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId: solicitanteId,
  }).getValue();

  return SolicitacaoTrocaTurno.create({ turno, solicitanteId }).getValue();
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
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      solicitanteId: "func-a",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe("cancelada");
  });

  it("falha quando a solicitação não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({
      solicitacaoId: "solicitacao-inexistente",
      solicitanteId: "func-a",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação não encontrada");
  });

  it("falha quando quem tenta cancelar não é o solicitante", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao("func-a");
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      solicitanteId: "func-b",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Somente o solicitante pode cancelar a solicitação");
  });

  it("falha quando a solicitação já não está mais pendente", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao("func-a");
    await solicitacaoRepository.save(solicitacao);
    solicitacao.cancelar();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      solicitanteId: "func-a",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação de troca não está mais pendente");
  });
});
