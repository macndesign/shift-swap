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

function criarSolicitacao(turno = criarTurno("func-a")) {
  return SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: "func-a",
    destinatarioId: "func-b",
  }).getValue();
}

function criarSolicitacaoAguardandoAprovacao(turno = criarTurno("func-a")) {
  const solicitacao = criarSolicitacao(turno);
  solicitacao.aceitar({ funcionarioId: "func-b" });
  return solicitacao;
}

const SUPERVISOR_E_PARTE = "O supervisor não pode decidir uma solicitação em que é parte";

describe("SolicitacaoTrocaTurno", () => {
  describe("create", () => {
    it("cria uma solicitação pendente direcionada ao destinatário", () => {
      const turno = criarTurno("func-a");

      const result = SolicitacaoTrocaTurno.create({
        turno,
        solicitanteId: "func-a",
        destinatarioId: "func-b",
      });

      expect(result.isSuccess).toBe(true);
      const solicitacao = result.getValue();
      expect(solicitacao.status).toBe("pendente");
      expect(solicitacao.solicitanteId).toBe("func-a");
      expect(solicitacao.destinatarioId).toBe("func-b");
      expect(solicitacao.respondidaEm).toBeUndefined();
    });

    it("falha quando o solicitante não é o dono do turno", () => {
      const result = SolicitacaoTrocaTurno.create({
        turno: criarTurno("func-a"),
        solicitanteId: "func-c",
        destinatarioId: "func-b",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Somente o funcionário dono do turno pode solicitar a troca");
    });

    it("falha quando o destinatário está vazio", () => {
      const result = SolicitacaoTrocaTurno.create({
        turno: criarTurno("func-a"),
        solicitanteId: "func-a",
        destinatarioId: "  ",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Id do destinatário não pode ser vazio");
    });

    it("falha quando o destinatário é o próprio solicitante", () => {
      const result = SolicitacaoTrocaTurno.create({
        turno: criarTurno("func-a"),
        solicitanteId: "func-a",
        destinatarioId: "func-a",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("O solicitante não pode ser o destinatário da própria solicitação");
    });
  });

  describe("aceitar", () => {
    it("move a solicitação para aguardando aprovação sem mexer no turno", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacao(turno);

      const result = solicitacao.aceitar({ funcionarioId: "func-b" });

      expect(result.isSuccess).toBe(true);
      expect(solicitacao.status).toBe("aguardando_aprovacao");
      expect(solicitacao.respondidaEm).toBeInstanceOf(Date);
      expect(turno.funcionarioId).toBe("func-a");
    });

    it("falha quando quem aceita não é o destinatário", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.aceitar({ funcionarioId: "func-c" });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Somente o destinatário pode aceitar a solicitação");
      expect(solicitacao.status).toBe("pendente");
    });

    it("falha quando o solicitante tenta aceitar a própria solicitação", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.aceitar({ funcionarioId: "func-a" });

      expect(result.error).toBe("Somente o destinatário pode aceitar a solicitação");
    });

    it("falha ao aceitar uma solicitação que não está pendente", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.aceitar({ funcionarioId: "func-b" });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Não é possível aceitar uma solicitação aguardando aprovação");
    });
  });

  describe("recusar", () => {
    it("recusa a solicitação sem motivo e mantém o turno", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacao(turno);

      const result = solicitacao.recusar({ funcionarioId: "func-b" });

      expect(result.isSuccess).toBe(true);
      expect(solicitacao.status).toBe("recusada");
      expect(solicitacao.respondidaEm).toBeInstanceOf(Date);
      expect(solicitacao.motivo).toBeUndefined();
      expect(turno.funcionarioId).toBe("func-a");
    });

    it("recusa a solicitação guardando o motivo informado", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.recusar({ funcionarioId: "func-b", motivo: " Tenho consulta " });

      expect(result.isSuccess).toBe(true);
      expect(solicitacao.motivo).toBe("Tenho consulta");
    });

    it("falha quando quem recusa não é o destinatário", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.recusar({ funcionarioId: "func-c" });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Somente o destinatário pode recusar a solicitação");
    });

    it("falha ao recusar depois de já ter aceitado", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.recusar({ funcionarioId: "func-b" });

      expect(result.error).toBe("Não é possível recusar uma solicitação aguardando aprovação");
    });
  });

  describe("aprovar", () => {
    it("aprova a solicitação aceita, transfere o turno e registra quem decidiu", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacaoAguardandoAprovacao(turno);

      const result = solicitacao.aprovar({ supervisorId: "sup-1" });

      expect(result.isSuccess).toBe(true);
      expect(solicitacao.status).toBe("aprovada");
      expect(solicitacao.decididoPorId).toBe("sup-1");
      expect(solicitacao.decididoEm).toBeInstanceOf(Date);
      expect(turno.funcionarioId).toBe("func-b");
    });

    it("falha ao aprovar uma solicitação que o destinatário ainda não aceitou", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacao(turno);

      const result = solicitacao.aprovar({ supervisorId: "sup-1" });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Não é possível aprovar uma solicitação pendente");
      expect(turno.funcionarioId).toBe("func-a");
    });

    it("falha ao aprovar uma solicitação que já foi decidida", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();
      solicitacao.aprovar({ supervisorId: "sup-1" });

      const result = solicitacao.aprovar({ supervisorId: "sup-1" });

      expect(result.error).toBe("Não é possível aprovar uma solicitação aprovada");
    });

    it("falha quando o supervisor é o solicitante ou o destinatário", () => {
      const solicitante = criarSolicitacaoAguardandoAprovacao();
      const destinatario = criarSolicitacaoAguardandoAprovacao();

      expect(solicitante.aprovar({ supervisorId: "func-a" }).error).toBe(SUPERVISOR_E_PARTE);
      expect(destinatario.aprovar({ supervisorId: "func-b" }).error).toBe(SUPERVISOR_E_PARTE);
      expect(solicitante.status).toBe("aguardando_aprovacao");
    });

    it("falha quando o turno já não pertence ao solicitante", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacaoAguardandoAprovacao(turno);
      turno.reatribuir("func-z");

      const result = solicitacao.aprovar({ supervisorId: "sup-1" });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("O turno não pertence mais ao solicitante");
    });
  });

  describe("rejeitar", () => {
    it("rejeita a solicitação aceita registrando o motivo e quem decidiu", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacaoAguardandoAprovacao(turno);

      const result = solicitacao.rejeitar({ supervisorId: "sup-1", motivo: "Equipe reduzida" });

      expect(result.isSuccess).toBe(true);
      expect(solicitacao.status).toBe("rejeitada");
      expect(solicitacao.motivo).toBe("Equipe reduzida");
      expect(solicitacao.decididoPorId).toBe("sup-1");
      expect(solicitacao.decididoEm).toBeInstanceOf(Date);
      expect(turno.funcionarioId).toBe("func-a");
    });

    it("falha ao rejeitar sem motivo", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.rejeitar({ supervisorId: "sup-1", motivo: "   " });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Motivo da rejeição não pode ser vazio");
      expect(solicitacao.status).toBe("aguardando_aprovacao");
    });

    it("falha ao rejeitar uma solicitação que o destinatário ainda não aceitou", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.rejeitar({ supervisorId: "sup-1", motivo: "Equipe reduzida" });

      expect(result.error).toBe("Não é possível rejeitar uma solicitação pendente");
    });

    it("falha quando o supervisor é parte da troca", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.rejeitar({ supervisorId: "func-b", motivo: "Equipe reduzida" });

      expect(result.error).toBe(SUPERVISOR_E_PARTE);
    });
  });

  describe("cancelar", () => {
    it("cancela uma solicitação pendente", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.cancelar();

      expect(result.isSuccess).toBe(true);
      expect(solicitacao.status).toBe("cancelada");
    });

    it("cancela uma solicitação aguardando aprovação", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.cancelar();

      expect(result.isSuccess).toBe(true);
      expect(solicitacao.status).toBe("cancelada");
    });

    it("falha ao cancelar uma solicitação já decidida", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();
      solicitacao.aprovar({ supervisorId: "sup-1" });

      const result = solicitacao.cancelar();

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Não é possível cancelar uma solicitação aprovada");
    });

    it("falha ao cancelar uma solicitação já recusada ou cancelada", () => {
      const recusada = criarSolicitacao();
      recusada.recusar({ funcionarioId: "func-b" });
      const cancelada = criarSolicitacao();
      cancelada.cancelar();

      expect(recusada.cancelar().error).toBe("Não é possível cancelar uma solicitação recusada");
      expect(cancelada.cancelar().error).toBe("Não é possível cancelar uma solicitação cancelada");
    });
  });

  describe("expirar", () => {
    it("expira uma solicitação pendente", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.expirar();

      expect(result.isSuccess).toBe(true);
      expect(solicitacao.status).toBe("expirada");
    });

    it("expira uma solicitação aguardando aprovação sem mexer no turno", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacaoAguardandoAprovacao(turno);

      const result = solicitacao.expirar();

      expect(result.isSuccess).toBe(true);
      expect(solicitacao.status).toBe("expirada");
      expect(turno.funcionarioId).toBe("func-a");
    });

    it("falha ao expirar uma solicitação já decidida", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();
      solicitacao.aprovar({ supervisorId: "sup-1" });

      const result = solicitacao.expirar();

      expect(result.error).toBe("Não é possível expirar uma solicitação aprovada");
    });
  });

  describe("reconstituir", () => {
    const respondidaEm = new Date("2026-09-19T10:00:00.000Z");
    const decididoEm = new Date("2026-09-20T10:00:00.000Z");
    const base = { solicitanteId: "func-a", destinatarioId: "func-b" };

    it("reconstitui uma solicitação pendente sem alterar o turno", () => {
      const turno = criarTurno("func-a");

      const result = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "pendente" },
        "sol-1",
      );

      expect(result.isSuccess).toBe(true);
      const solicitacao = result.getValue();
      expect(solicitacao.id).toBe("sol-1");
      expect(solicitacao.status).toBe("pendente");
      expect(solicitacao.destinatarioId).toBe("func-b");
      expect(solicitacao.turno).toBe(turno);
      expect(turno.funcionarioId).toBe("func-a");
    });

    it("reconstitui uma solicitação aguardando aprovação", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno: criarTurno("func-a"), status: "aguardando_aprovacao", respondidaEm },
        "sol-1",
      );

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().respondidaEm).toBe(respondidaEm);
    });

    it("reconstitui uma solicitação aprovada preservando a decisão e o turno", () => {
      const turno = criarTurno("func-b");

      const result = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "aprovada", respondidaEm, decididoPorId: "sup-1", decididoEm },
        "sol-1",
      );

      expect(result.isSuccess).toBe(true);
      const solicitacao = result.getValue();
      expect(solicitacao.decididoPorId).toBe("sup-1");
      expect(solicitacao.decididoEm).toBe(decididoEm);
      expect(turno.funcionarioId).toBe("func-b");
    });

    it("reconstitui uma solicitação rejeitada com o motivo", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        {
          ...base,
          turno: criarTurno("func-a"),
          status: "rejeitada",
          respondidaEm,
          decididoPorId: "sup-1",
          decididoEm,
          motivo: "Equipe reduzida",
        },
        "sol-1",
      );

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().motivo).toBe("Equipe reduzida");
    });

    it("reconstitui uma solicitação recusada, com ou sem motivo", () => {
      const semMotivo = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno: criarTurno("func-a"), status: "recusada", respondidaEm },
        "sol-1",
      );
      const comMotivo = SolicitacaoTrocaTurno.reconstituir(
        {
          ...base,
          turno: criarTurno("func-a"),
          status: "recusada",
          respondidaEm,
          motivo: "Tenho consulta",
        },
        "sol-2",
      );

      expect(semMotivo.isSuccess).toBe(true);
      expect(comMotivo.getValue().motivo).toBe("Tenho consulta");
    });

    it("reconstitui solicitações canceladas e expiradas, respondidas ou não", () => {
      for (const status of ["cancelada", "expirada"] as const) {
        for (const resposta of [undefined, respondidaEm]) {
          const result = SolicitacaoTrocaTurno.reconstituir(
            { ...base, turno: criarTurno("func-a"), status, respondidaEm: resposta },
            "sol-1",
          );

          expect(result.isSuccess).toBe(true);
          expect(result.getValue().status).toBe(status);
        }
      }
    });

    it("mantém as transições do estado reconstituído", () => {
      const aguardando = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno: criarTurno("func-a"), status: "aguardando_aprovacao", respondidaEm },
        "sol-1",
      ).getValue();

      expect(aguardando.aprovar({ supervisorId: "sup-1" }).isSuccess).toBe(true);
      expect(aguardando.status).toBe("aprovada");
    });

    it("falha quando o id está vazio", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno: criarTurno("func-a"), status: "pendente" },
        "  ",
      );

      expect(result.error).toBe("Id da solicitação não pode ser vazio");
    });

    it("falha quando o solicitante ou o destinatário estão vazios", () => {
      const turno = criarTurno("func-a");

      const semSolicitante = SolicitacaoTrocaTurno.reconstituir(
        { ...base, solicitanteId: "", turno, status: "pendente" },
        "sol-1",
      );
      const semDestinatario = SolicitacaoTrocaTurno.reconstituir(
        { ...base, destinatarioId: "", turno, status: "pendente" },
        "sol-1",
      );

      expect(semSolicitante.error).toBe("Id do solicitante não pode ser vazio");
      expect(semDestinatario.error).toBe("Id do destinatário não pode ser vazio");
    });

    it("falha quando o status é desconhecido", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno: criarTurno("func-a"), status: "inexistente" as unknown as "pendente" },
        "sol-1",
      );

      expect(result.error).toBe("Status inválido: inexistente");
    });

    it("falha ao reconstituir pendente com dados de resposta ou decisão", () => {
      const turno = criarTurno("func-a");

      const comResposta = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "pendente", respondidaEm },
        "sol-1",
      );
      const comDecisao = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "pendente", decididoPorId: "sup-1" },
        "sol-1",
      );

      expect(comResposta.error).toBe(
        "Solicitação pendente não pode ter dados de resposta ou decisão",
      );
      expect(comDecisao.error).toBe(
        "Solicitação pendente não pode ter dados de resposta ou decisão",
      );
    });

    it("falha ao reconstituir aguardando aprovação sem a data da resposta ou com decisão", () => {
      const turno = criarTurno("func-a");

      const semResposta = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "aguardando_aprovacao" },
        "sol-1",
      );
      const comDecisao = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "aguardando_aprovacao", respondidaEm, decididoPorId: "sup-1" },
        "sol-1",
      );

      expect(semResposta.error).toBe(
        "Solicitação aguardando aprovação exige a data da resposta do destinatário",
      );
      expect(comDecisao.error).toBe(
        "Solicitação aguardando aprovação não pode ter dados de decisão",
      );
    });

    it("falha ao reconstituir aprovada sem supervisor ou data da decisão", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        {
          ...base,
          turno: criarTurno("func-b"),
          status: "aprovada",
          respondidaEm,
          decididoPorId: "sup-1",
        },
        "sol-1",
      );

      expect(result.error).toBe("Solicitação aprovada exige supervisor e data da decisão");
    });

    it("falha ao reconstituir rejeitada sem supervisor, data da decisão ou motivo", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        {
          ...base,
          turno: criarTurno("func-a"),
          status: "rejeitada",
          respondidaEm,
          decididoPorId: "sup-1",
          decididoEm,
        },
        "sol-1",
      );

      expect(result.error).toBe("Solicitação rejeitada exige supervisor, data da decisão e motivo");
    });

    it("falha ao reconstituir recusada sem a data da resposta ou com decisão de supervisor", () => {
      const turno = criarTurno("func-a");

      const semResposta = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "recusada" },
        "sol-1",
      );
      const comDecisao = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "recusada", respondidaEm, decididoPorId: "sup-1", decididoEm },
        "sol-1",
      );

      expect(semResposta.error).toBe(
        "Solicitação recusada exige a data da resposta do destinatário",
      );
      expect(comDecisao.error).toBe("Solicitação recusada não pode ter dados de decisão");
    });

    it("falha ao reconstituir cancelada ou expirada com dados de decisão", () => {
      for (const status of ["cancelada", "expirada"] as const) {
        const result = SolicitacaoTrocaTurno.reconstituir(
          { ...base, turno: criarTurno("func-a"), status, decididoPorId: "sup-1" },
          "sol-1",
        );

        expect(result.error).toBe(`Solicitação ${status} não pode ter dados de decisão`);
      }
    });
  });
});
