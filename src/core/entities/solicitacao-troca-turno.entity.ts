import { Entity, ForbiddenError, Result, ValidationError } from "core-kernel";
import { CODIGOS_ERRO } from "../erros.js";
import { type FuncionarioId, SolicitacaoTrocaTurnoId, type SupervisorId } from "./ids.js";
import {
  type AceitarSolicitacaoProps,
  type AprovarSolicitacaoProps,
  type ContextoSolicitacao,
  type ErroTransicao,
  type EstadoSolicitacao,
  estadoDe,
  type MudancaSolicitacao,
  type RecusarSolicitacaoProps,
  type RejeitarSolicitacaoProps,
  STATUS_SOLICITACAO,
  type StatusSolicitacaoTrocaTurno,
} from "./solicitacao-troca-turno.state.js";
import type { Turno } from "./turno.entity.js";

interface SolicitacaoTrocaTurnoProps {
  turno: Turno;
  solicitanteId: FuncionarioId;
  destinatarioId: FuncionarioId;
  status: StatusSolicitacaoTrocaTurno;
  respondidaEm?: Date;
  decididoPorId?: SupervisorId;
  decididoEm?: Date;
  motivo?: string;
}

interface CreateSolicitacaoTrocaTurnoProps {
  turno: Turno;
  solicitanteId: FuncionarioId;
  destinatarioId: FuncionarioId;
}

type ReconstituirSolicitacaoTrocaTurnoProps = SolicitacaoTrocaTurnoProps;

const incoerente = (message: string) =>
  Result.fail(new ValidationError({ code: CODIGOS_ERRO.DADOS_INCOERENTES, message }));

class SolicitacaoTrocaTurno extends Entity<SolicitacaoTrocaTurnoProps, SolicitacaoTrocaTurnoId> {
  private constructor(props: SolicitacaoTrocaTurnoProps, id: SolicitacaoTrocaTurnoId) {
    super(props, id);
  }

  get turno(): Turno {
    return this.props.turno;
  }

  get solicitanteId(): FuncionarioId {
    return this.props.solicitanteId;
  }

  get destinatarioId(): FuncionarioId {
    return this.props.destinatarioId;
  }

  get status(): StatusSolicitacaoTrocaTurno {
    return this.props.status;
  }

  get respondidaEm(): Date | undefined {
    return this.props.respondidaEm;
  }

  get decididoPorId(): SupervisorId | undefined {
    return this.props.decididoPorId;
  }

  get decididoEm(): Date | undefined {
    return this.props.decididoEm;
  }

  get motivo(): string | undefined {
    return this.props.motivo;
  }

  /** O destinatário topa a troca; passa a aguardar a autorização do supervisor. */
  aceitar(props: AceitarSolicitacaoProps): Result<void, ErroTransicao> {
    return this.estado.aceitar(this.contexto, props);
  }

  /** O destinatário não topa a troca; encerra a solicitação. */
  recusar(props: RecusarSolicitacaoProps): Result<void, ErroTransicao> {
    return this.estado.recusar(this.contexto, props);
  }

  /** O supervisor autoriza a troca já aceita e o turno muda de dono. */
  aprovar(props: AprovarSolicitacaoProps): Result<void, ErroTransicao> {
    return this.estado.aprovar(this.contexto, props);
  }

  /** O supervisor não autoriza a troca já aceita. */
  rejeitar(props: RejeitarSolicitacaoProps): Result<void, ErroTransicao> {
    return this.estado.rejeitar(this.contexto, props);
  }

  cancelar(): Result<void, ErroTransicao> {
    return this.estado.cancelar(this.contexto);
  }

  expirar(): Result<void, ErroTransicao> {
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
    if (mudanca.respondidaEm) {
      this.props.respondidaEm = mudanca.respondidaEm;
    }
    if (mudanca.motivo !== undefined) {
      this.props.motivo = mudanca.motivo;
    }
    if (mudanca.decisao) {
      this.props.decididoPorId = mudanca.decisao.por;
      this.props.decididoEm = mudanca.decisao.em;
    }
  }

  static create(
    props: CreateSolicitacaoTrocaTurnoProps,
  ): Result<SolicitacaoTrocaTurno, ForbiddenError | ValidationError> {
    if (!props.solicitanteId.equals(props.turno.funcionarioId)) {
      return Result.fail(
        new ForbiddenError("Somente o funcionário dono do turno pode solicitar a troca", {
          code: CODIGOS_ERRO.SOMENTE_DONO_DO_TURNO,
        }),
      );
    }
    if (props.destinatarioId.equals(props.solicitanteId)) {
      return Result.fail(
        new ValidationError({
          field: "destinatarioId",
          code: CODIGOS_ERRO.DESTINATARIO_IGUAL_SOLICITANTE,
          message: "O solicitante não pode ser o destinatário da própria solicitação",
        }),
      );
    }

    return Result.ok(
      new SolicitacaoTrocaTurno(
        {
          turno: props.turno,
          solicitanteId: props.solicitanteId,
          destinatarioId: props.destinatarioId,
          status: "pendente",
        },
        SolicitacaoTrocaTurnoId.generate(),
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
    id: SolicitacaoTrocaTurnoId,
  ): Result<SolicitacaoTrocaTurno, ValidationError> {
    if (!STATUS_SOLICITACAO.includes(props.status)) {
      return Result.fail(
        new ValidationError({
          field: "status",
          code: CODIGOS_ERRO.STATUS_INVALIDO,
          message: `Status inválido: ${props.status}`,
        }),
      );
    }

    return SolicitacaoTrocaTurno.validarCoerencia(props).map(
      () => new SolicitacaoTrocaTurno({ ...props }, id),
    );
  }

  private static validarCoerencia(
    props: SolicitacaoTrocaTurnoProps,
  ): Result<void, ValidationError> {
    const temSupervisor = Boolean(props.decididoPorId || props.decididoEm);
    const temDecisaoCompleta = Boolean(props.decididoPorId && props.decididoEm);
    const temDadosDeDecisao = temSupervisor || Boolean(props.motivo);

    switch (props.status) {
      case "pendente":
        if (props.respondidaEm || temDadosDeDecisao) {
          return incoerente("Solicitação pendente não pode ter dados de resposta ou decisão");
        }
        break;
      case "aguardando_aprovacao":
        if (!props.respondidaEm) {
          return incoerente(
            "Solicitação aguardando aprovação exige a data da resposta do destinatário",
          );
        }
        if (temDadosDeDecisao) {
          return incoerente("Solicitação aguardando aprovação não pode ter dados de decisão");
        }
        break;
      case "aprovada":
        if (!temDecisaoCompleta) {
          return incoerente("Solicitação aprovada exige supervisor e data da decisão");
        }
        break;
      case "rejeitada":
        if (!(temDecisaoCompleta && props.motivo)) {
          return incoerente("Solicitação rejeitada exige supervisor, data da decisão e motivo");
        }
        break;
      case "recusada":
        if (!props.respondidaEm) {
          return incoerente("Solicitação recusada exige a data da resposta do destinatário");
        }
        if (temSupervisor) {
          return incoerente("Solicitação recusada não pode ter dados de decisão");
        }
        break;
      case "cancelada":
      case "expirada":
        if (temDadosDeDecisao) {
          return incoerente(`Solicitação ${props.status} não pode ter dados de decisão`);
        }
        break;
    }

    return Result.ok();
  }
}

export {
  type ReconstituirSolicitacaoTrocaTurnoProps,
  SolicitacaoTrocaTurno,
  type StatusSolicitacaoTrocaTurno,
};
