import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { ListarSolicitacoesTrocaTurnoUseCase } from "../listar-solicitacoes-troca-turno.usecase";

function criarTurno(funcionarioId: string) {
  return Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId,
  }).getValue();
}

function criarSut() {
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new ListarSolicitacoesTrocaTurnoUseCase(solicitacaoRepository);

  return { solicitacaoRepository, useCase };
}

describe("ListarSolicitacoesTrocaTurnoUseCase", () => {
  it("retorna uma lista vazia quando não há solicitações", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([]);
  });

  it("retorna todas as solicitações cadastradas", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacaoA = SolicitacaoTrocaTurno.create({
      turno: criarTurno("func-a"),
      solicitanteId: "func-a",
    }).getValue();
    const solicitacaoB = SolicitacaoTrocaTurno.create({
      turno: criarTurno("func-b"),
      solicitanteId: "func-b",
    }).getValue();
    await solicitacaoRepository.save(solicitacaoA);
    await solicitacaoRepository.save(solicitacaoB);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(2);
    expect(result.getValue()).toEqual(expect.arrayContaining([solicitacaoA, solicitacaoB]));
  });
});
