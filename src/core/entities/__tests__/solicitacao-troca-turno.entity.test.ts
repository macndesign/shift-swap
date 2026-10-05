import { describe, expect, it } from "bun:test";
import { SolicitacaoTrocaTurno } from "../solicitacao-troca-turno.entity";
import { Turno } from "../turno.entity";

function criarTurno(funcionarioId = "func-a") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId,
  }).getValue();
}

describe("SolicitacaoTrocaTurno", () => {
  it("cria uma solicitação pendente quando o solicitante é o dono do turno", () => {
    const turno = criarTurno("func-a");

    const result = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" });

    expect(result.isSuccess).toBe(true);
    const solicitacao = result.getValue();
    expect(solicitacao.status).toBe("pendente");
    expect(solicitacao.solicitanteId).toBe("func-a");
    expect(solicitacao.destinatarioId).toBeUndefined();
  });

  it("falha ao criar quando o solicitante não é o dono do turno", () => {
    const turno = criarTurno("func-a");

    const result = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-b" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Somente o funcionário dono do turno pode solicitar a troca");
  });

  it("aprova a solicitação, transfere o turno e registra quem decidiu", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();

    const result = solicitacao.aprovar({ supervisorId: "sup-1", destinatarioId: "func-b" });

    expect(result.isSuccess).toBe(true);
    expect(solicitacao.status).toBe("aprovada");
    expect(solicitacao.destinatarioId).toBe("func-b");
    expect(solicitacao.decididoPorId).toBe("sup-1");
    expect(solicitacao.decididoEm).toBeInstanceOf(Date);
    expect(turno.funcionarioId).toBe("func-b");
  });

  it("falha ao aprovar uma solicitação que já não está pendente", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    solicitacao.aprovar({ supervisorId: "sup-1", destinatarioId: "func-b" });

    const result = solicitacao.aprovar({ supervisorId: "sup-1", destinatarioId: "func-c" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação de troca não está mais pendente");
  });

  it("falha ao aprovar indicando o próprio solicitante como destinatário", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();

    const result = solicitacao.aprovar({ supervisorId: "sup-1", destinatarioId: "func-a" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("O solicitante não pode ser o destinatário da própria solicitação");
    expect(solicitacao.status).toBe("pendente");
  });

  it("falha ao aprovar quando o supervisor é parte da troca", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();

    const result = solicitacao.aprovar({ supervisorId: "func-a", destinatarioId: "func-b" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("O supervisor não pode decidir uma solicitação em que é parte");
  });

  it("rejeita a solicitação registrando o motivo e quem decidiu", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();

    const result = solicitacao.rejeitar({ supervisorId: "sup-1", motivo: "Equipe reduzida" });

    expect(result.isSuccess).toBe(true);
    expect(solicitacao.status).toBe("rejeitada");
    expect(solicitacao.motivo).toBe("Equipe reduzida");
    expect(solicitacao.decididoPorId).toBe("sup-1");
    expect(solicitacao.decididoEm).toBeInstanceOf(Date);
    expect(turno.funcionarioId).toBe("func-a");
  });

  it("falha ao rejeitar sem motivo", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();

    const result = solicitacao.rejeitar({ supervisorId: "sup-1", motivo: "   " });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Motivo da rejeição não pode ser vazio");
    expect(solicitacao.status).toBe("pendente");
  });

  it("falha ao rejeitar uma solicitação que já não está pendente", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    solicitacao.cancelar();

    const result = solicitacao.rejeitar({ supervisorId: "sup-1", motivo: "Equipe reduzida" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação de troca não está mais pendente");
  });

  it("expira uma solicitação pendente", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();

    const result = solicitacao.expirar();

    expect(result.isSuccess).toBe(true);
    expect(solicitacao.status).toBe("expirada");
    expect(turno.funcionarioId).toBe("func-a");
  });

  it("falha ao expirar uma solicitação que já não está pendente", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    solicitacao.aprovar({ supervisorId: "sup-1", destinatarioId: "func-b" });

    const result = solicitacao.expirar();

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação de troca não está mais pendente");
  });

  it("cancela uma solicitação pendente", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();

    const result = solicitacao.cancelar();

    expect(result.isSuccess).toBe(true);
    expect(solicitacao.status).toBe("cancelada");
  });

  it("falha ao cancelar uma solicitação que já não está pendente", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    solicitacao.cancelar();

    const result = solicitacao.cancelar();

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação de troca não está mais pendente");
  });
});
