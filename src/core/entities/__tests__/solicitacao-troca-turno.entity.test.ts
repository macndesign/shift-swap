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

  it("aceita a solicitação e transfere o turno para quem aceitou", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();

    const result = solicitacao.aceitar("func-b");

    expect(result.isSuccess).toBe(true);
    expect(solicitacao.status).toBe("aceita");
    expect(solicitacao.destinatarioId).toBe("func-b");
    expect(turno.funcionarioId).toBe("func-b");
  });

  it("falha ao aceitar uma solicitação que já não está pendente", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    solicitacao.aceitar("func-b");

    const result = solicitacao.aceitar("func-c");

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação de troca não está mais pendente");
  });

  it("falha quando o próprio solicitante tenta aceitar a solicitação", () => {
    const turno = criarTurno("func-a");
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();

    const result = solicitacao.aceitar("func-a");

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("O solicitante não pode aceitar a própria solicitação");
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
