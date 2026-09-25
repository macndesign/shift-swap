import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { BuscarSolicitacaoTrocaTurnoPorIdUseCase } from "../buscar-solicitacao-troca-turno-por-id.usecase";

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
    }).getValue();
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({ id: solicitacao.id });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(solicitacao);
  });

  it("falha quando a solicitação não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ id: "solicitacao-inexistente" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação não encontrada");
  });
});
