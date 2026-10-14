import { describe, expect, it } from "bun:test";
import { assertOk } from "core-kernel/testing";
import { funcionarioId } from "../../__tests__/fixtures.js";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity.js";
import { Turno } from "../../entities/turno.entity.js";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository.js";
import { ListarSolicitacoesTrocaTurnoUseCase } from "../listar-solicitacoes-troca-turno.usecase.js";

function criarTurno(funcionarioId: string) {
  return Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId,
  }).unwrap();
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

    assertOk(result);
    expect(result.value).toEqual([]);
  });

  it("retorna todas as solicitações cadastradas", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacaoA = SolicitacaoTrocaTurno.create({
      turno: criarTurno("func-a"),
      solicitanteId: funcionarioId("func-a"),
      destinatarioId: funcionarioId("func-c"),
    }).unwrap();
    const solicitacaoB = SolicitacaoTrocaTurno.create({
      turno: criarTurno("func-b"),
      solicitanteId: funcionarioId("func-b"),
      destinatarioId: funcionarioId("func-c"),
    }).unwrap();
    await solicitacaoRepository.create(solicitacaoA);
    await solicitacaoRepository.create(solicitacaoB);

    const result = await useCase.execute();

    assertOk(result);
    expect(result.value).toHaveLength(2);
    expect(result.value).toEqual(expect.arrayContaining([solicitacaoA, solicitacaoB]));
  });
});
