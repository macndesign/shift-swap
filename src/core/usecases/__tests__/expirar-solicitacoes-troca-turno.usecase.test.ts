import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { AGORA, funcionarioId } from "../../__tests__/fixtures";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { ExpirarSolicitacoesTrocaTurnoUseCase } from "../expirar-solicitacoes-troca-turno.usecase";

function criarSolicitacao(data: string, horaInicio = "08:00") {
  const turno = Turno.create({
    data,
    horaInicio,
    horaFim: "18:00",
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
  const useCase = new ExpirarSolicitacoesTrocaTurnoUseCase(solicitacaoRepository);

  return { solicitacaoRepository, useCase };
}

describe("ExpirarSolicitacoesTrocaTurnoUseCase", () => {
  it("expira as pendentes cujo turno já começou e mantém as demais pendentes", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const jaComecou = criarSolicitacao("2026-09-24", "08:00");
    const futura = criarSolicitacao("2026-09-24", "14:00");
    await solicitacaoRepository.create(jaComecou);
    await solicitacaoRepository.create(futura);

    const result = await useCase.execute({ referencia: "2026-09-24T09:00" });

    assertOk(result);
    expect(result.value).toEqual([jaComecou]);
    expect(jaComecou.status).toBe("expirada");
    expect(futura.status).toBe("pendente");
  });

  it("expira também as que já foram aceitas e ainda aguardam aprovação", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const aguardando = criarSolicitacao("2026-09-24", "08:00");
    aguardando.aceitar({ funcionarioId: funcionarioId("func-b"), agora: AGORA }).unwrap();
    await solicitacaoRepository.create(aguardando);

    const result = await useCase.execute({ referencia: "2026-09-24T09:00" });

    assertOk(result);
    expect(result.value).toEqual([aguardando]);
    expect(aguardando.status).toBe("expirada");
    expect(aguardando.turno.funcionarioId.value).toBe("func-a");
  });

  it("expira quando o turno começa exatamente na referência", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao("2026-09-24", "08:00");
    await solicitacaoRepository.create(solicitacao);

    const result = await useCase.execute({ referencia: "2026-09-24T08:00" });

    assertOk(result);
    expect(result.value).toEqual([solicitacao]);
  });

  it("não altera solicitações que já foram encerradas", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const cancelada = criarSolicitacao("2026-09-20");
    cancelada.cancelar().unwrap();
    const recusada = criarSolicitacao("2026-09-20");
    recusada.recusar({ funcionarioId: funcionarioId("func-b"), agora: AGORA }).unwrap();
    await solicitacaoRepository.create(cancelada);
    await solicitacaoRepository.create(recusada);

    const result = await useCase.execute({ referencia: "2026-09-24T09:00" });

    assertOk(result);
    expect(result.value).toEqual([]);
    expect(cancelada.status).toBe("cancelada");
    expect(recusada.status).toBe("recusada");
  });

  it("falha quando a referência tem formato inválido", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ referencia: "24/09/2026" });

    assertFail(result, "REFERENCIA_INVALIDA");
    expect(result.error.message).toBe("Referência inválida: 24/09/2026");
  });
});
