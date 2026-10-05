import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { ExpirarSolicitacoesTrocaTurnoUseCase } from "../expirar-solicitacoes-troca-turno.usecase";

function criarSolicitacao(data: string, horaInicio = "08:00", solicitanteId = "func-a") {
  const turno = Turno.create({
    data,
    horaInicio,
    horaFim: "18:00",
    funcionarioId: solicitanteId,
  }).getValue();

  return SolicitacaoTrocaTurno.create({ turno, solicitanteId }).getValue();
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

  it("expira quando o turno começa exatamente na referência", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao("2026-09-24", "08:00");
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({ referencia: "2026-09-24T08:00" });

    expect(result.getValue()).toEqual([solicitacao]);
  });

  it("não altera solicitações que já foram decididas", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const cancelada = criarSolicitacao("2026-09-20");
    cancelada.cancelar();
    await solicitacaoRepository.save(cancelada);

    const result = await useCase.execute({ referencia: "2026-09-24T09:00" });

    expect(result.getValue()).toEqual([]);
    expect(cancelada.status).toBe("cancelada");
  });

  it("falha quando a referência tem formato inválido", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({ referencia: "24/09/2026" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Referência inválida: 24/09/2026");
  });
});
