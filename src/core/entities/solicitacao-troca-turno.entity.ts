import { Entity } from "../../shared/entity";
import { Result } from "../../shared/result";
import {
  type AceitarSolicitacaoProps,
  type AprovarSolicitacaoProps,
  type ContextoSolicitacao,
  type EstadoSolicitacao,
  estadoDe,
  type MudancaSolicitacao,
  type RecusarSolicitacaoProps,
  type RejeitarSolicitacaoProps,
  STATUS_SOLICITACAO,
  type StatusSolicitacaoTrocaTurno,
} from "./solicitacao-troca-turno.state";
import type { Turno } from "./turno.entity";

interface SolicitacaoTrocaTurnoProps {
  turno: Turno;
  solicitanteId: string;
  destinatarioId: string;
  status: StatusSolicitacaoTrocaTurno;
  respondidaEm?: Date;
  decididoPorId?: string;
  decididoEm?: Date;
  motivo?: string;
}

interface CreateSolicitacaoTrocaTurnoProps {
  turno: Turno;
  solicitanteId: string;
  destinatarioId: string;
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

  get destinatarioId(): string {
    return this.props.destinatarioId;
  }

  get status(): StatusSolicitacaoTrocaTurno {
    return this.props.status;
  }

  get respondidaEm(): Date | undefined {
    return this.props.respondidaEm;
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

  /** O destinatário topa a troca; passa a aguardar a autorização do supervisor. */
  aceitar(props: AceitarSolicitacaoProps): Result<void> {
    return this.estado.aceitar(this.contexto, props);
  }

  /** O destinatário não topa a troca; encerra a solicitação. */
  recusar(props: RecusarSolicitacaoProps): Result<void> {
    return this.estado.recusar(this.contexto, props);
  }

  /** O supervisor autoriza a troca já aceita e o turno muda de dono. */
  aprovar(props: AprovarSolicitacaoProps): Result<void> {
    return this.estado.aprovar(this.contexto, props);
  }

  /** O supervisor não autoriza a troca já aceita. */
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
      destinatarioId: this.props.destinatarioId,
      turno: this.props.turno,
      aplicar: (mudanca) => this.aplicar(mudanca),
    };
  }

  private aplicar(mudanca: MudancaSolicitacao): void {
    this.props.status = mudanca.status;
    if (mudanca.respondida) {
      this.props.respondidaEm = new Date();
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
    if (!props.destinatarioId || props.destinatarioId.trim().length === 0) {
      return Result.fail<SolicitacaoTrocaTurno>("Id do destinatário não pode ser vazio");
    }
    if (props.destinatarioId === props.solicitanteId) {
      return Result.fail<SolicitacaoTrocaTurno>(
        "O solicitante não pode ser o destinatário da própria solicitação",
      );
    }

    return Result.ok<SolicitacaoTrocaTurno>(
      new SolicitacaoTrocaTurno(
        {
          turno: props.turno,
          solicitanteId: props.solicitanteId,
          destinatarioId: props.destinatarioId,
          status: "pendente",
        },
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
    if (!props.destinatarioId || props.destinatarioId.trim().length === 0) {
      return Result.fail<SolicitacaoTrocaTurno>("Id do destinatário não pode ser vazio");
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
    const temSupervisor = Boolean(props.decididoPorId || props.decididoEm);
    const temDecisaoCompleta = Boolean(props.decididoPorId && props.decididoEm);
    const temDadosDeDecisao = temSupervisor || Boolean(props.motivo);

    switch (props.status) {
      case "pendente":
        if (props.respondidaEm || temDadosDeDecisao) {
          return Result.fail<void>(
            "Solicitação pendente não pode ter dados de resposta ou decisão",
          );
        }
        break;
      case "aguardando_aprovacao":
        if (!props.respondidaEm) {
          return Result.fail<void>(
            "Solicitação aguardando aprovação exige a data da resposta do destinatário",
          );
        }
        if (temDadosDeDecisao) {
          return Result.fail<void>(
            "Solicitação aguardando aprovação não pode ter dados de decisão",
          );
        }
        break;
      case "aprovada":
        if (!temDecisaoCompleta) {
          return Result.fail<void>("Solicitação aprovada exige supervisor e data da decisão");
        }
        break;
      case "rejeitada":
        if (!(temDecisaoCompleta && props.motivo)) {
          return Result.fail<void>(
            "Solicitação rejeitada exige supervisor, data da decisão e motivo",
          );
        }
        break;
      case "recusada":
        if (!props.respondidaEm) {
          return Result.fail<void>("Solicitação recusada exige a data da resposta do destinatário");
        }
        if (temSupervisor) {
          return Result.fail<void>("Solicitação recusada não pode ter dados de decisão");
        }
        break;
      case "cancelada":
      case "expirada":
        if (temDadosDeDecisao) {
          return Result.fail<void>(`Solicitação ${props.status} não pode ter dados de decisão`);
        }
        break;
    }

    return Result.ok<void>();
  }
}

export {
  type ReconstituirSolicitacaoTrocaTurnoProps,
  SolicitacaoTrocaTurno,
  type StatusSolicitacaoTrocaTurno,
};
