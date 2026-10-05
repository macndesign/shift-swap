import { Entity } from "../../shared/entity";
import { Result } from "../../shared/result";
import {
  type AprovarSolicitacaoProps,
  type ContextoSolicitacao,
  type EstadoSolicitacao,
  estadoDe,
  type MudancaSolicitacao,
  type RejeitarSolicitacaoProps,
  type StatusSolicitacaoTrocaTurno,
} from "./solicitacao-troca-turno.state";
import type { Turno } from "./turno.entity";

interface SolicitacaoTrocaTurnoProps {
  turno: Turno;
  solicitanteId: string;
  destinatarioId?: string;
  status: StatusSolicitacaoTrocaTurno;
  decididoPorId?: string;
  decididoEm?: Date;
  motivo?: string;
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
    return this.estado.aprovar(this.contexto, props);
  }

  rejeitar(props: RejeitarSolicitacaoProps): Result<void> {
    return this.estado.rejeitar(this.contexto, props);
  }

  cancelar(): Result<void> {
    return this.estado.cancelar(this.contexto);
  }

  expirar(): Result<void> {
    return this.estado.expirar(this.contexto);
  }

  private get estado(): EstadoSolicitacao {
    return estadoDe(this.props.status);
  }

  private get contexto(): ContextoSolicitacao {
    return {
      solicitanteId: this.props.solicitanteId,
      turno: this.props.turno,
      aplicar: (mudanca) => this.aplicar(mudanca),
    };
  }

  private aplicar(mudanca: MudancaSolicitacao): void {
    this.props.status = mudanca.status;
    if (mudanca.destinatarioId !== undefined) {
      this.props.destinatarioId = mudanca.destinatarioId;
    }
    if (mudanca.motivo !== undefined) {
      this.props.motivo = mudanca.motivo;
    }
    if (mudanca.decididoPorId !== undefined) {
      this.props.decididoPorId = mudanca.decididoPorId;
      this.props.decididoEm = new Date();
    }
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
