import { Entity } from "../../shared/entity";
import { Result } from "../../shared/result";
import {
  type AprovarSolicitacaoProps,
  type ContextoSolicitacao,
  type EstadoSolicitacao,
  estadoDe,
  type MudancaSolicitacao,
  type RejeitarSolicitacaoProps,
  STATUS_SOLICITACAO,
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

type ReconstituirSolicitacaoTrocaTurnoProps = SolicitacaoTrocaTurnoProps;

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

  /**
   * Recria uma solicitação já persistida, no estado em que foi salva. Não executa as
   * transições (nada é reatribuído nem tem `decididoEm` regravado): só confere se os
   * dados são coerentes com o status. Destinado a adapters de repositório.
   */
  static reconstituir(
    props: ReconstituirSolicitacaoTrocaTurnoProps,
    id: string,
  ): Result<SolicitacaoTrocaTurno> {
    if (!id || id.trim().length === 0) {
      return Result.fail<SolicitacaoTrocaTurno>("Id da solicitação não pode ser vazio");
    }
    if (!props.solicitanteId || props.solicitanteId.trim().length === 0) {
      return Result.fail<SolicitacaoTrocaTurno>("Id do solicitante não pode ser vazio");
    }
    if (!STATUS_SOLICITACAO.includes(props.status)) {
      return Result.fail<SolicitacaoTrocaTurno>(`Status inválido: ${props.status}`);
    }

    const coerenciaOrError = SolicitacaoTrocaTurno.validarCoerencia(props);
    if (coerenciaOrError.isFailure) {
      return Result.fail<SolicitacaoTrocaTurno>(coerenciaOrError.error as string | Error);
    }

    return Result.ok<SolicitacaoTrocaTurno>(new SolicitacaoTrocaTurno({ ...props }, id));
  }

  private static validarCoerencia(props: SolicitacaoTrocaTurnoProps): Result<void> {
    const temDecisao = Boolean(props.decididoPorId && props.decididoEm);

    if (props.status === "aprovada" && !(props.destinatarioId && temDecisao)) {
      return Result.fail<void>(
        "Solicitação aprovada exige destinatário, supervisor e data da decisão",
      );
    }
    if (props.status === "rejeitada" && !(temDecisao && props.motivo)) {
      return Result.fail<void>("Solicitação rejeitada exige supervisor, data da decisão e motivo");
    }

    const semDecisao = ["pendente", "cancelada", "expirada"].includes(props.status);
    if (
      semDecisao &&
      (props.decididoPorId || props.decididoEm || props.motivo || props.destinatarioId)
    ) {
      return Result.fail<void>(`Solicitação ${props.status} não pode ter dados de decisão`);
    }

    return Result.ok<void>();
  }
}

export {
  type ReconstituirSolicitacaoTrocaTurnoProps,
  SolicitacaoTrocaTurno,
  type StatusSolicitacaoTrocaTurno,
};
