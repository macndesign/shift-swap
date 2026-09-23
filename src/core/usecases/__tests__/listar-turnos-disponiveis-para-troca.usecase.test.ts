import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { ListarTurnosDisponiveisParaTrocaUseCase } from "../listar-turnos-disponiveis-para-troca.usecase";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";

function criarSolicitacao(solicitanteId: string) {
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
  const useCase = new ListarTurnosDisponiveisParaTrocaUseCase(solicitacaoRepository);

  return { solicitacaoRepository, useCase };
}

describe("ListarTurnosDisponiveisParaTrocaUseCase", () => {
  it("retorna solicitações pendentes de outros funcionários, excluindo as próprias", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacaoDeOutro = criarSolicitacao("func-b");
    const solicitacaoPropria = criarSolicitacao("func-a");
    await solicitacaoRepository.save(solicitacaoDeOutro);
    await solicitacaoRepository.save(solicitacaoPropria);

    const result = await useCase.execute({ funcionarioId: "func-a" });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([solicitacaoDeOutro]);
  });

  it("não retorna solicitações que já não estão mais pendentes", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacaoAceita = criarSolicitacao("func-b");
    solicitacaoAceita.aceitar("func-c");
    await solicitacaoRepository.save(solicitacaoAceita);

    const result = await useCase.execute({ funcionarioId: "func-a" });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([]);
  });

  it("retorna uma lista vazia quando não há solicitações pendentes de outros funcionários", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ funcionarioId: "func-a" });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([]);
  });
});
