import { describe, expect, it } from "bun:test";
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
  }).getValue();

  return SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: "func-a",
    destinatarioId: "func-b",
  }).getValue();
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
    await solicitacaoRepository.save(jaComecou);
    await solicitacaoRepository.save(futura);

    const result = await useCase.execute({ referencia: "2026-09-24T09:00" });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([jaComecou]);
    expect(jaComecou.status).toBe("expirada");
    expect(futura.status).toBe("pendente");
  });

  it("expira também as que já foram aceitas e ainda aguardam aprovação", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const aguardando = criarSolicitacao("2026-09-24", "08:00");
    aguardando.aceitar({ funcionarioId: "func-b" });
    await solicitacaoRepository.save(aguardando);

    const result = await useCase.execute({ referencia: "2026-09-24T09:00" });

    expect(result.getValue()).toEqual([aguardando]);
    expect(aguardando.status).toBe("expirada");
    expect(aguardando.turno.funcionarioId).toBe("func-a");
  });

  it("expira quando o turno começa exatamente na referência", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao("2026-09-24", "08:00");
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({ referencia: "2026-09-24T08:00" });

    expect(result.getValue()).toEqual([solicitacao]);
  });

  it("não altera solicitações que já foram encerradas", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const cancelada = criarSolicitacao("2026-09-20");
    cancelada.cancelar();
    const recusada = criarSolicitacao("2026-09-20");
    recusada.recusar({ funcionarioId: "func-b" });
    await solicitacaoRepository.save(cancelada);
    await solicitacaoRepository.save(recusada);

    const result = await useCase.execute({ referencia: "2026-09-24T09:00" });

    expect(result.getValue()).toEqual([]);
    expect(cancelada.status).toBe("cancelada");
    expect(recusada.status).toBe("recusada");
  });

  it("falha quando a referência tem formato inválido", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ referencia: "24/09/2026" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Referência inválida: 24/09/2026");
  });
});
