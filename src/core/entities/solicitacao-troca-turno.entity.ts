import { Entity } from "../../shared/entity";
import { Result } from "../../shared/result";
import type { Turno } from "./turno.entity";

type StatusSolicitacaoTrocaTurno = "pendente" | "aprovada" | "rejeitada" | "cancelada" | "expirada";

interface SolicitacaoTrocaTurnoProps {
  turno: Turno;
  solicitanteId: string;
  destinatarioId?: string;
  status: StatusSolicitacaoTrocaTurno;
  decididoPorId?: string;
  decididoEm?: Date;
  motivo?: string;
}

interface AprovarSolicitacaoProps {
  supervisorId: string;
  destinatarioId: string;
}

interface RejeitarSolicitacaoProps {
  supervisorId: string;
  motivo: string;
}

interface CreateSolicitacaoTrocaTurnoProps {
  turno: Turno;
  solicitanteId: string;
}

class SolicitacaoTrocaTurno extends Entity<SolicitacaoTrocaTurnoProps> {
  private constructor(props: SolicitacaoTrocaTurnoProps, id?: string) {
    super(props, id);
  }

  get turno(): Turno {
    return this.props.turno;
  }

  get solicitanteId(): string {
    return this.props.solicitanteId;
  }

  get destinatarioId(): string | undefined {
    return this.props.destinatarioId;
  }

  get status(): StatusSolicitacaoTrocaTurno {
    return this.props.status;
  }

  get decididoPorId(): string | undefined {
    return this.props.decididoPorId;
  }

  get decididoEm(): Date | undefined {
    return this.props.decididoEm;
  }

  get motivo(): string | undefined {
    return this.props.motivo;
  }

  aprovar(props: AprovarSolicitacaoProps): Result<void> {
    const pendenteOrError = this.validarPendente();
    if (pendenteOrError.isFailure) {
      return pendenteOrError;
    }
    if (props.supervisorId === this.props.solicitanteId) {
      return Result.fail<void>("O supervisor não pode decidir uma solicitação em que é parte");
    }
    if (props.destinatarioId === this.props.solicitanteId) {
      return Result.fail<void>("O solicitante não pode ser o destinatário da própria solicitação");
    }
    if (props.destinatarioId === props.supervisorId) {
      return Result.fail<void>("O supervisor não pode decidir uma solicitação em que é parte");
    }
    if (this.props.turno.funcionarioId !== this.props.solicitanteId) {
      return Result.fail<void>("O turno não pertence mais ao solicitante");
    }

    const reatribuidoOrError = this.props.turno.reatribuir(props.destinatarioId);
    if (reatribuidoOrError.isFailure) {
      return Result.fail<void>(reatribuidoOrError.error as string | Error);
    }

    this.props.destinatarioId = props.destinatarioId;
    this.registrarDecisao("aprovada", props.supervisorId);
    return Result.ok<void>();
  }

  rejeitar(props: RejeitarSolicitacaoProps): Result<void> {
    const pendenteOrError = this.validarPendente();
    if (pendenteOrError.isFailure) {
      return pendenteOrError;
    }
    if (props.supervisorId === this.props.solicitanteId) {
      return Result.fail<void>("O supervisor não pode decidir uma solicitação em que é parte");
    }
    if (!props.motivo || props.motivo.trim().length === 0) {
      return Result.fail<void>("Motivo da rejeição não pode ser vazio");
    }

    this.props.motivo = props.motivo.trim();
    this.registrarDecisao("rejeitada", props.supervisorId);
    return Result.ok<void>();
  }

  cancelar(): Result<void> {
    const pendenteOrError = this.validarPendente();
    if (pendenteOrError.isFailure) {
      return pendenteOrError;
    }

    this.props.status = "cancelada";
    return Result.ok<void>();
  }

  expirar(): Result<void> {
    const pendenteOrError = this.validarPendente();
    if (pendenteOrError.isFailure) {
      return pendenteOrError;
    }

    this.props.status = "expirada";
    return Result.ok<void>();
  }

  private validarPendente(): Result<void> {
    if (this.props.status !== "pendente") {
      return Result.fail<void>("Solicitação de troca não está mais pendente");
    }
    return Result.ok<void>();
  }

  private registrarDecisao(status: StatusSolicitacaoTrocaTurno, supervisorId: string): void {
    this.props.status = status;
    this.props.decididoPorId = supervisorId;
    this.props.decididoEm = new Date();
  }

  static create(
    props: CreateSolicitacaoTrocaTurnoProps,
    id?: string,
  ): Result<SolicitacaoTrocaTurno> {
    if (props.solicitanteId !== props.turno.funcionarioId) {
      return Result.fail<SolicitacaoTrocaTurno>(
        "Somente o funcionário dono do turno pode solicitar a troca",
      );
    }

    return Result.ok<SolicitacaoTrocaTurno>(
      new SolicitacaoTrocaTurno(
        { turno: props.turno, solicitanteId: props.solicitanteId, status: "pendente" },
        id,
      ),
    );
  }
}

export { SolicitacaoTrocaTurno, type StatusSolicitacaoTrocaTurno };
