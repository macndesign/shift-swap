import { Result } from "../../shared/result";
import type { Turno } from "./turno.entity";

type StatusSolicitacaoTrocaTurno = "pendente" | "aprovada" | "rejeitada" | "cancelada" | "expirada";

const STATUS_SOLICITACAO: readonly StatusSolicitacaoTrocaTurno[] = [
  "pendente",
  "aprovada",
  "rejeitada",
  "cancelada",
  "expirada",
];

interface AprovarSolicitacaoProps {
  supervisorId: string;
  destinatarioId: string;
}

interface RejeitarSolicitacaoProps {
  supervisorId: string;
  motivo: string;
}

interface MudancaSolicitacao {
  status: StatusSolicitacaoTrocaTurno;
  destinatarioId?: string;
  decididoPorId?: string;
  motivo?: string;
}

/**
 * O que um estado enxerga da solicitação: dados para validar e uma única porta
 * de escrita (`aplicar`), sem expor as props internas da entidade.
 */
interface ContextoSolicitacao {
  readonly solicitanteId: string;
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

  aprovar(_contexto: ContextoSolicitacao, _props: AprovarSolicitacaoProps): Result<void> {
    return EstadoSolicitacao.transicaoInvalida();
  }

  rejeitar(_contexto: ContextoSolicitacao, _props: RejeitarSolicitacaoProps): Result<void> {
    return EstadoSolicitacao.transicaoInvalida();
  }

  cancelar(_contexto: ContextoSolicitacao): Result<void> {
    return EstadoSolicitacao.transicaoInvalida();
  }

  expirar(_contexto: ContextoSolicitacao): Result<void> {
    return EstadoSolicitacao.transicaoInvalida();
  }

  private static transicaoInvalida(): Result<void> {
    return Result.fail<void>("Solicitação de troca não está mais pendente");
  }
}

/** Único estado com transições de saída. */
class EstadoPendente extends EstadoSolicitacao {
  readonly status = "pendente";

  override aprovar(contexto: ContextoSolicitacao, props: AprovarSolicitacaoProps): Result<void> {
    const decisaoOrError = EstadoPendente.validarSupervisor(contexto, props.supervisorId);
    if (decisaoOrError.isFailure) {
      return decisaoOrError;
    }
    if (props.destinatarioId === contexto.solicitanteId) {
      return Result.fail<void>("O solicitante não pode ser o destinatário da própria solicitação");
    }
    if (props.destinatarioId === props.supervisorId) {
      return Result.fail<void>("O supervisor não pode decidir uma solicitação em que é parte");
    }
    if (contexto.turno.funcionarioId !== contexto.solicitanteId) {
      return Result.fail<void>("O turno não pertence mais ao solicitante");
    }

    const reatribuidoOrError = contexto.turno.reatribuir(props.destinatarioId);
    if (reatribuidoOrError.isFailure) {
      return Result.fail<void>(reatribuidoOrError.error as string | Error);
    }

    contexto.aplicar({
      status: "aprovada",
      destinatarioId: props.destinatarioId,
      decididoPorId: props.supervisorId,
    });
    return Result.ok<void>();
  }

  override rejeitar(contexto: ContextoSolicitacao, props: RejeitarSolicitacaoProps): Result<void> {
    const decisaoOrError = EstadoPendente.validarSupervisor(contexto, props.supervisorId);
    if (decisaoOrError.isFailure) {
      return decisaoOrError;
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

  override cancelar(contexto: ContextoSolicitacao): Result<void> {
    contexto.aplicar({ status: "cancelada" });
    return Result.ok<void>();
  }

  override expirar(contexto: ContextoSolicitacao): Result<void> {
    contexto.aplicar({ status: "expirada" });
    return Result.ok<void>();
  }

  private static validarSupervisor(
    contexto: ContextoSolicitacao,
    supervisorId: string,
  ): Result<void> {
    if (supervisorId === contexto.solicitanteId) {
      return Result.fail<void>("O supervisor não pode decidir uma solicitação em que é parte");
    }
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

class EstadoCancelada extends EstadoSolicitacao {
  readonly status = "cancelada";
}

class EstadoExpirada extends EstadoSolicitacao {
  readonly status = "expirada";
}

const ESTADOS: Record<StatusSolicitacaoTrocaTurno, EstadoSolicitacao> = {
  pendente: new EstadoPendente(),
  aprovada: new EstadoAprovada(),
  rejeitada: new EstadoRejeitada(),
  cancelada: new EstadoCancelada(),
  expirada: new EstadoExpirada(),
};

function estadoDe(status: StatusSolicitacaoTrocaTurno): EstadoSolicitacao {
  return ESTADOS[status];
}

export {
  type AprovarSolicitacaoProps,
  type ContextoSolicitacao,
  EstadoSolicitacao,
  estadoDe,
  type MudancaSolicitacao,
  type RejeitarSolicitacaoProps,
  STATUS_SOLICITACAO,
  type StatusSolicitacaoTrocaTurno,
};
