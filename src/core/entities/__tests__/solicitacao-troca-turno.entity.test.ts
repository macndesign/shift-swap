import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { AGORA, funcionarioId, solicitacaoId, supervisorId } from "../../__tests__/fixtures";
import { SolicitacaoTrocaTurno } from "../solicitacao-troca-turno.entity";
import { Turno } from "../turno.entity";

const FUNC_A = funcionarioId("func-a");
const FUNC_B = funcionarioId("func-b");
const FUNC_C = funcionarioId("func-c");
const SUP_1 = supervisorId("sup-1");

function criarTurno(dono = "func-a") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId: dono,
  }).unwrap();
}

function criarSolicitacao(turno = criarTurno("func-a")) {
  return SolicitacaoTrocaTurno.create({
    turno,
    solicitanteId: FUNC_A,
    destinatarioId: FUNC_B,
  }).unwrap();
}

function criarSolicitacaoAguardandoAprovacao(turno = criarTurno("func-a")) {
  const solicitacao = criarSolicitacao(turno);
  solicitacao.aceitar({ funcionarioId: FUNC_B, agora: AGORA }).unwrap();
  return solicitacao;
}

const SUPERVISOR_E_PARTE = "O supervisor não pode decidir uma solicitação em que é parte";

describe("SolicitacaoTrocaTurno", () => {
  describe("create", () => {
    it("cria uma solicitação pendente direcionada ao destinatário", () => {
      const turno = criarTurno("func-a");

      const result = SolicitacaoTrocaTurno.create({
        turno,
        solicitanteId: FUNC_A,
        destinatarioId: FUNC_B,
      });

      assertOk(result);
      const solicitacao = result.value;
      expect(solicitacao.status).toBe("pendente");
      expect(solicitacao.solicitanteId.value).toBe("func-a");
      expect(solicitacao.destinatarioId.value).toBe("func-b");
      expect(solicitacao.respondidaEm).toBeUndefined();
    });

    it("falha quando o solicitante não é o dono do turno", () => {
      const result = SolicitacaoTrocaTurno.create({
        turno: criarTurno("func-a"),
        solicitanteId: FUNC_C,
        destinatarioId: FUNC_B,
      });

      assertFail(result, "SOMENTE_DONO_DO_TURNO");
      expect(result.error.message).toBe(
        "Somente o funcionário dono do turno pode solicitar a troca",
      );
    });

    it("falha quando o destinatário é o próprio solicitante", () => {
      const result = SolicitacaoTrocaTurno.create({
        turno: criarTurno("func-a"),
        solicitanteId: FUNC_A,
        destinatarioId: FUNC_A,
      });

      assertFail(result, "DESTINATARIO_IGUAL_SOLICITANTE");
      expect(result.error.message).toBe(
        "O solicitante não pode ser o destinatário da própria solicitação",
      );
    });
  });

  describe("aceitar", () => {
    it("move a solicitação para aguardando aprovação sem mexer no turno", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacao(turno);

      const result = solicitacao.aceitar({ funcionarioId: FUNC_B, agora: AGORA });

      assertOk(result);
      expect(solicitacao.status).toBe("aguardando_aprovacao");
      expect(solicitacao.respondidaEm).toEqual(AGORA);
      expect(turno.funcionarioId.value).toBe("func-a");
    });

    it("falha quando quem aceita não é o destinatário", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.aceitar({ funcionarioId: FUNC_C, agora: AGORA });

      assertFail(result, "SOMENTE_DESTINATARIO");
      expect(result.error.message).toBe("Somente o destinatário pode aceitar a solicitação");
      expect(solicitacao.status).toBe("pendente");
    });

    it("falha quando o solicitante tenta aceitar a própria solicitação", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.aceitar({ funcionarioId: FUNC_A, agora: AGORA });

      assertFail(result, "SOMENTE_DESTINATARIO");
      expect(result.error.message).toBe("Somente o destinatário pode aceitar a solicitação");
    });

    it("falha ao aceitar uma solicitação que não está pendente", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.aceitar({ funcionarioId: FUNC_B, agora: AGORA });

      assertFail(result, "TRANSICAO_INVALIDA");
      expect(result.error.message).toBe(
        "Não é possível aceitar uma solicitação aguardando aprovação",
      );
    });
  });

  describe("recusar", () => {
    it("recusa a solicitação sem motivo e mantém o turno", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacao(turno);

      const result = solicitacao.recusar({ funcionarioId: FUNC_B, agora: AGORA });

      assertOk(result);
      expect(solicitacao.status).toBe("recusada");
      expect(solicitacao.respondidaEm).toEqual(AGORA);
      expect(solicitacao.motivo).toBeUndefined();
      expect(turno.funcionarioId.value).toBe("func-a");
    });

    it("recusa a solicitação guardando o motivo informado", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.recusar({
        funcionarioId: FUNC_B,
        motivo: " Tenho consulta ",
        agora: AGORA,
      });

      assertOk(result);
      expect(solicitacao.motivo).toBe("Tenho consulta");
    });

    it("falha quando quem recusa não é o destinatário", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.recusar({ funcionarioId: FUNC_C, agora: AGORA });

      assertFail(result, "SOMENTE_DESTINATARIO");
      expect(result.error.message).toBe("Somente o destinatário pode recusar a solicitação");
    });

    it("falha ao recusar depois de já ter aceitado", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.recusar({ funcionarioId: FUNC_B, agora: AGORA });

      assertFail(result, "TRANSICAO_INVALIDA");
      expect(result.error.message).toBe(
        "Não é possível recusar uma solicitação aguardando aprovação",
      );
    });
  });

  describe("aprovar", () => {
    it("aprova a solicitação aceita, transfere o turno e registra quem decidiu", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacaoAguardandoAprovacao(turno);

      const result = solicitacao.aprovar({ supervisorId: SUP_1, agora: AGORA });

      assertOk(result);
      expect(solicitacao.status).toBe("aprovada");
      expect(solicitacao.decididoPorId?.value).toBe("sup-1");
      expect(solicitacao.decididoEm).toEqual(AGORA);
      expect(turno.funcionarioId.value).toBe("func-b");
    });

    it("falha ao aprovar uma solicitação que o destinatário ainda não aceitou", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacao(turno);

      const result = solicitacao.aprovar({ supervisorId: SUP_1, agora: AGORA });

      assertFail(result, "TRANSICAO_INVALIDA");
      expect(result.error.message).toBe("Não é possível aprovar uma solicitação pendente");
      expect(turno.funcionarioId.value).toBe("func-a");
    });

    it("falha ao aprovar uma solicitação que já foi decidida", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();
      solicitacao.aprovar({ supervisorId: SUP_1, agora: AGORA }).unwrap();

      const result = solicitacao.aprovar({ supervisorId: SUP_1, agora: AGORA });

      assertFail(result, "TRANSICAO_INVALIDA");
      expect(result.error.message).toBe("Não é possível aprovar uma solicitação aprovada");
    });

    it("falha quando o supervisor é o solicitante ou o destinatário", () => {
      const solicitante = criarSolicitacaoAguardandoAprovacao();
      const destinatario = criarSolicitacaoAguardandoAprovacao();

      const comoSolicitante = solicitante.aprovar({
        supervisorId: supervisorId("func-a"),
        agora: AGORA,
      });
      const comoDestinatario = destinatario.aprovar({
        supervisorId: supervisorId("func-b"),
        agora: AGORA,
      });

      assertFail(comoSolicitante, "SUPERVISOR_E_PARTE");
      expect(comoSolicitante.error.message).toBe(SUPERVISOR_E_PARTE);
      assertFail(comoDestinatario, "SUPERVISOR_E_PARTE");
      expect(comoDestinatario.error.message).toBe(SUPERVISOR_E_PARTE);
      expect(solicitante.status).toBe("aguardando_aprovacao");
    });

    it("falha quando o turno já não pertence ao solicitante", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacaoAguardandoAprovacao(turno);
      turno.reatribuir(funcionarioId("func-z")).unwrap();

      const result = solicitacao.aprovar({ supervisorId: SUP_1, agora: AGORA });

      assertFail(result, "TURNO_NAO_PERTENCE_AO_SOLICITANTE");
      expect(result.error.message).toBe("O turno não pertence mais ao solicitante");
    });
  });

  describe("rejeitar", () => {
    it("rejeita a solicitação aceita registrando o motivo e quem decidiu", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacaoAguardandoAprovacao(turno);

      const result = solicitacao.rejeitar({
        supervisorId: SUP_1,
        motivo: "Equipe reduzida",
        agora: AGORA,
      });

      assertOk(result);
      expect(solicitacao.status).toBe("rejeitada");
      expect(solicitacao.motivo).toBe("Equipe reduzida");
      expect(solicitacao.decididoPorId?.value).toBe("sup-1");
      expect(solicitacao.decididoEm).toEqual(AGORA);
      expect(turno.funcionarioId.value).toBe("func-a");
    });

    it("falha ao rejeitar sem motivo", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.rejeitar({ supervisorId: SUP_1, motivo: "   ", agora: AGORA });

      assertFail(result, "MOTIVO_OBRIGATORIO");
      expect(result.error.message).toBe("Motivo da rejeição não pode ser vazio");
      expect(solicitacao.status).toBe("aguardando_aprovacao");
    });

    it("falha ao rejeitar uma solicitação que o destinatário ainda não aceitou", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.rejeitar({
        supervisorId: SUP_1,
        motivo: "Equipe reduzida",
        agora: AGORA,
      });

      assertFail(result, "TRANSICAO_INVALIDA");
      expect(result.error.message).toBe("Não é possível rejeitar uma solicitação pendente");
    });

    it("falha quando o supervisor é parte da troca", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.rejeitar({
        supervisorId: supervisorId("func-b"),
        motivo: "Equipe reduzida",
        agora: AGORA,
      });

      assertFail(result, "SUPERVISOR_E_PARTE");
      expect(result.error.message).toBe(SUPERVISOR_E_PARTE);
    });
  });

  describe("cancelar", () => {
    it("cancela uma solicitação pendente", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.cancelar();

      assertOk(result);
      expect(solicitacao.status).toBe("cancelada");
    });

    it("cancela uma solicitação aguardando aprovação", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();

      const result = solicitacao.cancelar();

      assertOk(result);
      expect(solicitacao.status).toBe("cancelada");
    });

    it("falha ao cancelar uma solicitação já decidida", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();
      solicitacao.aprovar({ supervisorId: SUP_1, agora: AGORA }).unwrap();

      const result = solicitacao.cancelar();

      assertFail(result, "TRANSICAO_INVALIDA");
      expect(result.error.message).toBe("Não é possível cancelar uma solicitação aprovada");
    });

    it("falha ao cancelar uma solicitação já recusada ou cancelada", () => {
      const recusada = criarSolicitacao();
      recusada.recusar({ funcionarioId: FUNC_B, agora: AGORA }).unwrap();
      const cancelada = criarSolicitacao();
      cancelada.cancelar().unwrap();

      const cancelarRecusada = recusada.cancelar();
      const cancelarCancelada = cancelada.cancelar();

      assertFail(cancelarRecusada, "TRANSICAO_INVALIDA");
      expect(cancelarRecusada.error.message).toBe(
        "Não é possível cancelar uma solicitação recusada",
      );
      assertFail(cancelarCancelada, "TRANSICAO_INVALIDA");
      expect(cancelarCancelada.error.message).toBe(
        "Não é possível cancelar uma solicitação cancelada",
      );
    });
  });

  describe("expirar", () => {
    it("expira uma solicitação pendente", () => {
      const solicitacao = criarSolicitacao();

      const result = solicitacao.expirar();

      assertOk(result);
      expect(solicitacao.status).toBe("expirada");
    });

    it("expira uma solicitação aguardando aprovação sem mexer no turno", () => {
      const turno = criarTurno("func-a");
      const solicitacao = criarSolicitacaoAguardandoAprovacao(turno);

      const result = solicitacao.expirar();

      assertOk(result);
      expect(solicitacao.status).toBe("expirada");
      expect(turno.funcionarioId.value).toBe("func-a");
    });

    it("falha ao expirar uma solicitação já decidida", () => {
      const solicitacao = criarSolicitacaoAguardandoAprovacao();
      solicitacao.aprovar({ supervisorId: SUP_1, agora: AGORA }).unwrap();

      const result = solicitacao.expirar();

      assertFail(result, "TRANSICAO_INVALIDA");
      expect(result.error.message).toBe("Não é possível expirar uma solicitação aprovada");
    });
  });

  describe("reconstituir", () => {
    const respondidaEm = new Date("2026-09-19T10:00:00.000Z");
    const decididoEm = new Date("2026-09-20T10:00:00.000Z");
    const base = { solicitanteId: FUNC_A, destinatarioId: FUNC_B };
    const SOL_1 = solicitacaoId("sol-1");
    const SOL_2 = solicitacaoId("sol-2");

    it("reconstitui uma solicitação pendente sem alterar o turno", () => {
      const turno = criarTurno("func-a");

      const result = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "pendente" },
        SOL_1,
      );

      assertOk(result);
      const solicitacao = result.value;
      expect(solicitacao.id.value).toBe("sol-1");
      expect(solicitacao.status).toBe("pendente");
      expect(solicitacao.destinatarioId.value).toBe("func-b");
      expect(solicitacao.turno).toBe(turno);
      expect(turno.funcionarioId.value).toBe("func-a");
    });

    it("reconstitui uma solicitação aguardando aprovação", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno: criarTurno("func-a"), status: "aguardando_aprovacao", respondidaEm },
        SOL_1,
      );

      assertOk(result);
      expect(result.value.respondidaEm).toBe(respondidaEm);
    });

    it("reconstitui uma solicitação aprovada preservando a decisão e o turno", () => {
      const turno = criarTurno("func-b");

      const result = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "aprovada", respondidaEm, decididoPorId: SUP_1, decididoEm },
        SOL_1,
      );

      assertOk(result);
      const solicitacao = result.value;
      expect(solicitacao.decididoPorId?.value).toBe("sup-1");
      expect(solicitacao.decididoEm).toBe(decididoEm);
      expect(turno.funcionarioId.value).toBe("func-b");
    });

    it("reconstitui uma solicitação rejeitada com o motivo", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        {
          ...base,
          turno: criarTurno("func-a"),
          status: "rejeitada",
          respondidaEm,
          decididoPorId: SUP_1,
          decididoEm,
          motivo: "Equipe reduzida",
        },
        SOL_1,
      );

      assertOk(result);
      expect(result.value.motivo).toBe("Equipe reduzida");
    });

    it("reconstitui uma solicitação recusada, com ou sem motivo", () => {
      const semMotivo = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno: criarTurno("func-a"), status: "recusada", respondidaEm },
        SOL_1,
      );
      const comMotivo = SolicitacaoTrocaTurno.reconstituir(
        {
          ...base,
          turno: criarTurno("func-a"),
          status: "recusada",
          respondidaEm,
          motivo: "Tenho consulta",
        },
        SOL_2,
      );

      assertOk(semMotivo);
      expect(comMotivo.unwrap().motivo).toBe("Tenho consulta");
    });

    it("reconstitui solicitações canceladas e expiradas, respondidas ou não", () => {
      for (const status of ["cancelada", "expirada"] as const) {
        for (const resposta of [undefined, respondidaEm]) {
          const result = SolicitacaoTrocaTurno.reconstituir(
            { ...base, turno: criarTurno("func-a"), status, respondidaEm: resposta },
            SOL_1,
          );

          assertOk(result);
          expect(result.value.status).toBe(status);
        }
      }
    });

    it("mantém as transições do estado reconstituído", () => {
      const aguardando = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno: criarTurno("func-a"), status: "aguardando_aprovacao", respondidaEm },
        SOL_1,
      ).unwrap();

      expect(aguardando.aprovar({ supervisorId: SUP_1, agora: AGORA }).isOk()).toBe(true);
      expect(aguardando.status).toBe("aprovada");
    });

    it("falha quando o status é desconhecido", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno: criarTurno("func-a"), status: "inexistente" as unknown as "pendente" },
        SOL_1,
      );

      assertFail(result, "STATUS_INVALIDO");
      expect(result.error.message).toBe("Status inválido: inexistente");
    });

    it("falha ao reconstituir pendente com dados de resposta ou decisão", () => {
      const turno = criarTurno("func-a");

      const comResposta = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "pendente", respondidaEm },
        SOL_1,
      );
      const comDecisao = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "pendente", decididoPorId: SUP_1 },
        SOL_1,
      );

      assertFail(comResposta, "DADOS_INCOERENTES");
      expect(comResposta.error.message).toBe(
        "Solicitação pendente não pode ter dados de resposta ou decisão",
      );
      assertFail(comDecisao, "DADOS_INCOERENTES");
      expect(comDecisao.error.message).toBe(
        "Solicitação pendente não pode ter dados de resposta ou decisão",
      );
    });

    it("falha ao reconstituir aguardando aprovação sem a data da resposta ou com decisão", () => {
      const turno = criarTurno("func-a");

      const semResposta = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "aguardando_aprovacao" },
        SOL_1,
      );
      const comDecisao = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "aguardando_aprovacao", respondidaEm, decididoPorId: SUP_1 },
        SOL_1,
      );

      assertFail(semResposta, "DADOS_INCOERENTES");
      expect(semResposta.error.message).toBe(
        "Solicitação aguardando aprovação exige a data da resposta do destinatário",
      );
      assertFail(comDecisao, "DADOS_INCOERENTES");
      expect(comDecisao.error.message).toBe(
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
          decididoPorId: SUP_1,
        },
        SOL_1,
      );

      assertFail(result, "DADOS_INCOERENTES");
      expect(result.error.message).toBe("Solicitação aprovada exige supervisor e data da decisão");
    });

    it("falha ao reconstituir rejeitada sem supervisor, data da decisão ou motivo", () => {
      const result = SolicitacaoTrocaTurno.reconstituir(
        {
          ...base,
          turno: criarTurno("func-a"),
          status: "rejeitada",
          respondidaEm,
          decididoPorId: SUP_1,
          decididoEm,
        },
        SOL_1,
      );

      assertFail(result, "DADOS_INCOERENTES");
      expect(result.error.message).toBe(
        "Solicitação rejeitada exige supervisor, data da decisão e motivo",
      );
    });

    it("falha ao reconstituir recusada sem a data da resposta ou com decisão de supervisor", () => {
      const turno = criarTurno("func-a");

      const semResposta = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "recusada" },
        SOL_1,
      );
      const comDecisao = SolicitacaoTrocaTurno.reconstituir(
        { ...base, turno, status: "recusada", respondidaEm, decididoPorId: SUP_1, decididoEm },
        SOL_1,
      );

      assertFail(semResposta, "DADOS_INCOERENTES");
      expect(semResposta.error.message).toBe(
        "Solicitação recusada exige a data da resposta do destinatário",
      );
      assertFail(comDecisao, "DADOS_INCOERENTES");
      expect(comDecisao.error.message).toBe("Solicitação recusada não pode ter dados de decisão");
    });

    it("falha ao reconstituir cancelada ou expirada com dados de decisão", () => {
      for (const status of ["cancelada", "expirada"] as const) {
        const result = SolicitacaoTrocaTurno.reconstituir(
          { ...base, turno: criarTurno("func-a"), status, decididoPorId: SUP_1 },
          SOL_1,
        );

        assertFail(result, "DADOS_INCOERENTES");
        expect(result.error.message).toBe(`Solicitação ${status} não pode ter dados de decisão`);
      }
    });
  });
});
