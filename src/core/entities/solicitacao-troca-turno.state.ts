import { Result } from "../../shared/result";
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

/** Resposta do destinatário (funcionário B). */
interface AceitarSolicitacaoProps {
  funcionarioId: string;
}

interface RecusarSolicitacaoProps {
  funcionarioId: string;
  motivo?: string;
}

/** Decisão do supervisor. */
interface AprovarSolicitacaoProps {
  supervisorId: string;
}

interface RejeitarSolicitacaoProps {
  supervisorId: string;
  motivo: string;
}

interface MudancaSolicitacao {
  status: StatusSolicitacaoTrocaTurno;
  /** Marca que o destinatário respondeu (grava `respondidaEm`). */
  respondida?: boolean;
  /** Quem decidiu (grava também `decididoEm`). */
  decididoPorId?: string;
  motivo?: string;
}

/**
 * O que um estado enxerga da solicitação: dados para validar e uma única porta
 * de escrita (`aplicar`), sem expor as props internas da entidade.
 */
interface ContextoSolicitacao {
  readonly solicitanteId: string;
  readonly destinatarioId: string;
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

  aceitar(_contexto: ContextoSolicitacao, _props: AceitarSolicitacaoProps): Result<void> {
    return this.transicaoInvalida("aceitar");
  }

  recusar(_contexto: ContextoSolicitacao, _props: RecusarSolicitacaoProps): Result<void> {
    return this.transicaoInvalida("recusar");
  }

  aprovar(_contexto: ContextoSolicitacao, _props: AprovarSolicitacaoProps): Result<void> {
    return this.transicaoInvalida("aprovar");
  }

  rejeitar(_contexto: ContextoSolicitacao, _props: RejeitarSolicitacaoProps): Result<void> {
    return this.transicaoInvalida("rejeitar");
  }

  cancelar(_contexto: ContextoSolicitacao): Result<void> {
    return this.transicaoInvalida("cancelar");
  }

  expirar(_contexto: ContextoSolicitacao): Result<void> {
    return this.transicaoInvalida("expirar");
  }

  private transicaoInvalida(acao: string): Result<void> {
    return Result.fail<void>(
      `Não é possível ${acao} uma solicitação ${ROTULO_STATUS[this.status]}`,
    );
  }
}

/** Estados ainda sem desfecho: o solicitante pode cancelar e o sistema pode expirar. */
abstract class EstadoEmAberto extends EstadoSolicitacao {
  override cancelar(contexto: ContextoSolicitacao): Result<void> {
    contexto.aplicar({ status: "cancelada" });
    return Result.ok<void>();
  }

  override expirar(contexto: ContextoSolicitacao): Result<void> {
    contexto.aplicar({ status: "expirada" });
    return Result.ok<void>();
  }
}

function validarSupervisor(contexto: ContextoSolicitacao, supervisorId: string): Result<void> {
  if (supervisorId === contexto.solicitanteId || supervisorId === contexto.destinatarioId) {
    return Result.fail<void>("O supervisor não pode decidir uma solicitação em que é parte");
  }
  return Result.ok<void>();
}

function validarDestinatario(
  contexto: ContextoSolicitacao,
  funcionarioId: string,
  acao: string,
): Result<void> {
  if (funcionarioId !== contexto.destinatarioId) {
    return Result.fail<void>(`Somente o destinatário pode ${acao} a solicitação`);
  }
  return Result.ok<void>();
}

/** Aguardando a resposta do destinatário (funcionário B). */
class EstadoPendente extends EstadoEmAberto {
  readonly status = "pendente";

  override aceitar(contexto: ContextoSolicitacao, props: AceitarSolicitacaoProps): Result<void> {
    const destinatarioOrError = validarDestinatario(contexto, props.funcionarioId, "aceitar");
    if (destinatarioOrError.isFailure) {
      return destinatarioOrError;
    }

    contexto.aplicar({ status: "aguardando_aprovacao", respondida: true });
    return Result.ok<void>();
  }

  override recusar(contexto: ContextoSolicitacao, props: RecusarSolicitacaoProps): Result<void> {
    const destinatarioOrError = validarDestinatario(contexto, props.funcionarioId, "recusar");
    if (destinatarioOrError.isFailure) {
      return destinatarioOrError;
    }

    contexto.aplicar({
      status: "recusada",
      respondida: true,
      motivo: props.motivo?.trim() || undefined,
    });
    return Result.ok<void>();
  }
}

/** O destinatário aceitou; falta o supervisor autorizar ou não a troca. */
class EstadoAguardandoAprovacao extends EstadoEmAberto {
  readonly status = "aguardando_aprovacao";

  override aprovar(contexto: ContextoSolicitacao, props: AprovarSolicitacaoProps): Result<void> {
    const supervisorOrError = validarSupervisor(contexto, props.supervisorId);
    if (supervisorOrError.isFailure) {
      return supervisorOrError;
    }
    if (contexto.turno.funcionarioId !== contexto.solicitanteId) {
      return Result.fail<void>("O turno não pertence mais ao solicitante");
    }

    const reatribuidoOrError = contexto.turno.reatribuir(contexto.destinatarioId);
    if (reatribuidoOrError.isFailure) {
      return Result.fail<void>(reatribuidoOrError.error as string | Error);
    }

    contexto.aplicar({ status: "aprovada", decididoPorId: props.supervisorId });
    return Result.ok<void>();
  }

  override rejeitar(contexto: ContextoSolicitacao, props: RejeitarSolicitacaoProps): Result<void> {
    const supervisorOrError = validarSupervisor(contexto, props.supervisorId);
    if (supervisorOrError.isFailure) {
      return supervisorOrError;
    }
    if (!props.motivo || props.motivo.trim().length === 0) {
      return Result.fail<void>("Motivo da rejeição não pode ser vazio");
    }

    contexto.aplicar({
      status: "rejeitada",
      decididoPorId: props.supervisorId,
      motivo: props.motivo.trim(),
    });
    return Result.ok<void>();
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
  EstadoSolicitacao,
  estadoDe,
  type MudancaSolicitacao,
  type RecusarSolicitacaoProps,
  type RejeitarSolicitacaoProps,
  STATUS_SOLICITACAO,
  type StatusSolicitacaoTrocaTurno,
};
