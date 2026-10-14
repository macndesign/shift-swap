import { ConflictError, ForbiddenError, Result, ValidationError } from "core-kernel";
import { CODIGOS_ERRO } from "../erros";
import type { FuncionarioId, SupervisorId } from "./ids";
import type { Turno } from "./turno.entity";

type StatusSolicitacaoTrocaTurno =
  | "pendente"
  | "aguardando_aprovacao"
  | "aprovada"
  | "rejeitada"
  | "recusada"
  | "cancelada"
  | "expirada";

const STATUS_SOLICITACAO: readonly StatusSolicitacaoTrocaTurno[] = [
  "pendente",
  "aguardando_aprovacao",
  "aprovada",
  "rejeitada",
  "recusada",
  "cancelada",
  "expirada",
];

/** Nome do estado como aparece nas mensagens de erro. */
const ROTULO_STATUS: Record<StatusSolicitacaoTrocaTurno, string> = {
  pendente: "pendente",
  aguardando_aprovacao: "aguardando aprovação",
  aprovada: "aprovada",
  rejeitada: "rejeitada",
  recusada: "recusada",
  cancelada: "cancelada",
  expirada: "expirada",
};

/** Erros possíveis de uma transição. */
type ErroTransicao = ConflictError | ForbiddenError | ValidationError;

/** Resposta do destinatário (funcionário B). `agora` vem do Clock do use case. */
interface AceitarSolicitacaoProps {
  funcionarioId: FuncionarioId;
  agora: Date;
}

interface RecusarSolicitacaoProps {
  funcionarioId: FuncionarioId;
  motivo?: string;
  agora: Date;
}

/** Decisão do supervisor. */
interface AprovarSolicitacaoProps {
  supervisorId: SupervisorId;
  agora: Date;
}

interface RejeitarSolicitacaoProps {
  supervisorId: SupervisorId;
  motivo: string;
  agora: Date;
}

interface MudancaSolicitacao {
  status: StatusSolicitacaoTrocaTurno;
  /** Quando o destinatário respondeu. */
  respondidaEm?: Date;
  /** Quem decidiu e quando. */
  decisao?: { por: SupervisorId; em: Date };
  motivo?: string;
}

/**
 * O que um estado enxerga da solicitação: dados para validar e uma única porta
 * de escrita (`aplicar`), sem expor as props internas da entidade.
 */
interface ContextoSolicitacao {
  readonly solicitanteId: FuncionarioId;
  readonly destinatarioId: FuncionarioId;
  readonly turno: Turno;
  aplicar(mudanca: MudancaSolicitacao): void;
}

/**
 * Estado base: toda transição é inválida até que um estado concreto a sobrescreva.
 * Estados são stateless — o status vive nas props da entidade, o que permite
 * reidratar a solicitação a partir do banco.
 */
abstract class EstadoSolicitacao {
  abstract readonly status: StatusSolicitacaoTrocaTurno;

  aceitar(
    _contexto: ContextoSolicitacao,
    _props: AceitarSolicitacaoProps,
  ): Result<void, ErroTransicao> {
    return this.transicaoInvalida("aceitar");
  }

  recusar(
    _contexto: ContextoSolicitacao,
    _props: RecusarSolicitacaoProps,
  ): Result<void, ErroTransicao> {
    return this.transicaoInvalida("recusar");
  }

  aprovar(
    _contexto: ContextoSolicitacao,
    _props: AprovarSolicitacaoProps,
  ): Result<void, ErroTransicao> {
    return this.transicaoInvalida("aprovar");
  }

  rejeitar(
    _contexto: ContextoSolicitacao,
    _props: RejeitarSolicitacaoProps,
  ): Result<void, ErroTransicao> {
    return this.transicaoInvalida("rejeitar");
  }

  cancelar(_contexto: ContextoSolicitacao): Result<void, ErroTransicao> {
    return this.transicaoInvalida("cancelar");
  }

  expirar(_contexto: ContextoSolicitacao): Result<void, ErroTransicao> {
    return this.transicaoInvalida("expirar");
  }

  private transicaoInvalida(acao: string): Result<void, ConflictError> {
    return Result.fail(
      new ConflictError(`Não é possível ${acao} uma solicitação ${ROTULO_STATUS[this.status]}`, {
        code: CODIGOS_ERRO.TRANSICAO_INVALIDA,
        details: { acao, status: this.status },
      }),
    );
  }
}

/** Estados ainda sem desfecho: o solicitante pode cancelar e o sistema pode expirar. */
abstract class EstadoEmAberto extends EstadoSolicitacao {
  override cancelar(contexto: ContextoSolicitacao): Result<void, ErroTransicao> {
    contexto.aplicar({ status: "cancelada" });
    return Result.ok();
  }

  override expirar(contexto: ContextoSolicitacao): Result<void, ErroTransicao> {
    contexto.aplicar({ status: "expirada" });
    return Result.ok();
  }
}

function validarSupervisor(
  contexto: ContextoSolicitacao,
  supervisorId: SupervisorId,
): Result<void, ForbiddenError> {
  // Supervisor e funcionário são pessoas: o mesmo usuário pode ter os dois papéis.
  const ehParte = [contexto.solicitanteId, contexto.destinatarioId].some(
    (id) => id.value === supervisorId.value,
  );
  if (ehParte) {
    return Result.fail(
      new ForbiddenError("O supervisor não pode decidir uma solicitação em que é parte", {
        code: CODIGOS_ERRO.SUPERVISOR_E_PARTE,
      }),
    );
  }
  return Result.ok();
}

function validarDestinatario(
  contexto: ContextoSolicitacao,
  funcionarioId: FuncionarioId,
  acao: string,
): Result<void, ForbiddenError> {
  if (!funcionarioId.equals(contexto.destinatarioId)) {
    return Result.fail(
      new ForbiddenError(`Somente o destinatário pode ${acao} a solicitação`, {
        code: CODIGOS_ERRO.SOMENTE_DESTINATARIO,
      }),
    );
  }
  return Result.ok();
}

/** Aguardando a resposta do destinatário (funcionário B). */
class EstadoPendente extends EstadoEmAberto {
  readonly status = "pendente";

  override aceitar(
    contexto: ContextoSolicitacao,
    props: AceitarSolicitacaoProps,
  ): Result<void, ErroTransicao> {
    const destinatario = validarDestinatario(contexto, props.funcionarioId, "aceitar");
    if (destinatario.isFail()) return destinatario;

    contexto.aplicar({ status: "aguardando_aprovacao", respondidaEm: props.agora });
    return Result.ok();
  }

  override recusar(
    contexto: ContextoSolicitacao,
    props: RecusarSolicitacaoProps,
  ): Result<void, ErroTransicao> {
    const destinatario = validarDestinatario(contexto, props.funcionarioId, "recusar");
    if (destinatario.isFail()) return destinatario;

    const motivo = props.motivo?.trim();
    contexto.aplicar({
      status: "recusada",
      respondidaEm: props.agora,
      ...(motivo ? { motivo } : {}),
    });
    return Result.ok();
  }
}

/** O destinatário aceitou; falta o supervisor autorizar ou não a troca. */
class EstadoAguardandoAprovacao extends EstadoEmAberto {
  readonly status = "aguardando_aprovacao";

  override aprovar(
    contexto: ContextoSolicitacao,
    props: AprovarSolicitacaoProps,
  ): Result<void, ErroTransicao> {
    const supervisor = validarSupervisor(contexto, props.supervisorId);
    if (supervisor.isFail()) return supervisor;

    if (!contexto.turno.funcionarioId.equals(contexto.solicitanteId)) {
      return Result.fail(
        new ConflictError("O turno não pertence mais ao solicitante", {
          code: CODIGOS_ERRO.TURNO_NAO_PERTENCE_AO_SOLICITANTE,
        }),
      );
    }

    const reatribuido = contexto.turno.reatribuir(contexto.destinatarioId);
    if (reatribuido.isFail()) return reatribuido;

    contexto.aplicar({ status: "aprovada", decisao: { por: props.supervisorId, em: props.agora } });
    return Result.ok();
  }

  override rejeitar(
    contexto: ContextoSolicitacao,
    props: RejeitarSolicitacaoProps,
  ): Result<void, ErroTransicao> {
    const supervisor = validarSupervisor(contexto, props.supervisorId);
    if (supervisor.isFail()) return supervisor;

    const motivo = props.motivo?.trim();
    if (!motivo) {
      return Result.fail(
        new ValidationError({
          field: "motivo",
          code: CODIGOS_ERRO.MOTIVO_OBRIGATORIO,
          message: "Motivo da rejeição não pode ser vazio",
        }),
      );
    }

    contexto.aplicar({
      status: "rejeitada",
      decisao: { por: props.supervisorId, em: props.agora },
      motivo,
    });
    return Result.ok();
  }
}

/** Estados terminais: herdam todas as transições como inválidas. */
class EstadoAprovada extends EstadoSolicitacao {
  readonly status = "aprovada";
}

class EstadoRejeitada extends EstadoSolicitacao {
  readonly status = "rejeitada";
}

class EstadoRecusada extends EstadoSolicitacao {
  readonly status = "recusada";
}

class EstadoCancelada extends EstadoSolicitacao {
  readonly status = "cancelada";
}

class EstadoExpirada extends EstadoSolicitacao {
  readonly status = "expirada";
}

const ESTADOS: Record<StatusSolicitacaoTrocaTurno, EstadoSolicitacao> = {
  pendente: new EstadoPendente(),
  aguardando_aprovacao: new EstadoAguardandoAprovacao(),
  aprovada: new EstadoAprovada(),
  rejeitada: new EstadoRejeitada(),
  recusada: new EstadoRecusada(),
  cancelada: new EstadoCancelada(),
  expirada: new EstadoExpirada(),
};

function estadoDe(status: StatusSolicitacaoTrocaTurno): EstadoSolicitacao {
  return ESTADOS[status];
}

export {
  type AceitarSolicitacaoProps,
  type AprovarSolicitacaoProps,
  type ContextoSolicitacao,
  type ErroTransicao,
  EstadoSolicitacao,
  estadoDe,
  type MudancaSolicitacao,
  type RecusarSolicitacaoProps,
  type RejeitarSolicitacaoProps,
  STATUS_SOLICITACAO,
  type StatusSolicitacaoTrocaTurno,
};
