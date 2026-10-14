import { describe, expect, it } from "bun:test";
import { assertOk } from "core-kernel/testing";
import { AGORA, funcionarioId } from "../../__tests__/fixtures";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { ListarSolicitacoesRecebidasTrocaTurnoUseCase } from "../listar-solicitacoes-recebidas-troca-turno.usecase";

function criarSolicitacao(solicitanteId: string, destinatarioId: string) {
  const turno = Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId: solicitanteId,
  }).unwrap();

  return SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: funcionarioId(solicitanteId),
    destinatarioId: funcionarioId(destinatarioId),
  }).unwrap();
}

function criarSut() {
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new ListarSolicitacoesRecebidasTrocaTurnoUseCase(solicitacaoRepository);

  return { solicitacaoRepository, useCase };
}

describe("ListarSolicitacoesRecebidasTrocaTurnoUseCase", () => {
  it("retorna as pendentes endereçadas ao funcionário, sem as de outros nem as próprias", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const paraMim = criarSolicitacao("func-a", "func-b");
    const paraOutro = criarSolicitacao("func-a", "func-c");
    const minha = criarSolicitacao("func-b", "func-c");
    await solicitacaoRepository.create(paraMim);
    await solicitacaoRepository.create(paraOutro);
    await solicitacaoRepository.create(minha);

    const result = await useCase.execute({ funcionarioId: "func-b" });

    assertOk(result);
    expect(result.value).toEqual([paraMim]);
  });

  it("não retorna as que já foram respondidas", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const aceita = criarSolicitacao("func-a", "func-b");
    aceita.aceitar({ funcionarioId: funcionarioId("func-b"), agora: AGORA }).unwrap();
    const recusada = criarSolicitacao("func-c", "func-b");
    recusada.recusar({ funcionarioId: funcionarioId("func-b"), agora: AGORA }).unwrap();
    await solicitacaoRepository.create(aceita);
    await solicitacaoRepository.create(recusada);

    const result = await useCase.execute({ funcionarioId: "func-b" });

    assertOk(result);
    expect(result.value).toEqual([]);
  });

  it("retorna uma lista vazia quando não há solicitações para o funcionário", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ funcionarioId: "func-b" });

    assertOk(result);
    expect(result.value).toEqual([]);
  });
});
