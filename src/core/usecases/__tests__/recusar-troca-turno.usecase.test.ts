import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { RecusarTrocaTurnoUseCase } from "../recusar-troca-turno.usecase";

function criarSolicitacao() {
  const turno = Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
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
  const useCase = new RecusarTrocaTurnoUseCase(solicitacaoRepository);

  return { solicitacaoRepository, useCase };
}

describe("RecusarTrocaTurnoUseCase", () => {
  it("recusa a solicitação pendente e mantém o turno com o solicitante", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "func-b",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe("recusada");
    expect(result.getValue().respondidaEm).toBeInstanceOf(Date);
    expect(solicitacao.turno.funcionarioId).toBe("func-a");
  });

  it("guarda o motivo quando informado", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "func-b",
      motivo: "Tenho consulta",
    });

    expect(result.getValue().motivo).toBe("Tenho consulta");
  });

  it("falha quando a solicitação não existe", async () => {
    const { useCase } = criarSut();

    const result = await useCase.execute({
      solicitacaoId: "solicitacao-inexistente",
      funcionarioId: "func-b",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação não encontrada");
  });

  it("falha quando quem recusa não é o destinatário", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "func-c",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Somente o destinatário pode recusar a solicitação");
  });

  it("falha quando o destinatário já aceitou", async () => {
    const { solicitacaoRepository, useCase } = criarSut();
    const solicitacao = criarSolicitacao();
    await solicitacaoRepository.save(solicitacao);
    solicitacao.aceitar({ funcionarioId: "func-b" });

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "func-b",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Não é possível recusar uma solicitação aguardando aprovação");
  });
});
