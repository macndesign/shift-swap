import { Entity } from "../../shared/entity";
import { Result } from "../../shared/result";
import type { Turno } from "./turno.entity";

type StatusSolicitacaoTrocaTurno = "pendente" | "aceita" | "cancelada";

interface SolicitacaoTrocaTurnoProps {
  turno: Turno;
  solicitanteId: string;
  destinatarioId?: string;
  status: StatusSolicitacaoTrocaTurno;
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

  aceitar(funcionarioId: string): Result<void> {
    if (this.props.status !== "pendente") {
      return Result.fail<void>("Solicitação de troca não está mais pendente");
    }
    if (funcionarioId === this.props.solicitanteId) {
      return Result.fail<void>("O solicitante não pode aceitar a própria solicitação");
    }

    const reatribuidoOrError = this.props.turno.reatribuir(funcionarioId);
    if (reatribuidoOrError.isFailure) {
      return Result.fail<void>(reatribuidoOrError.error as string | Error);
    }

    this.props.destinatarioId = funcionarioId;
    this.props.status = "aceita";
    return Result.ok<void>();
  }

  cancelar(): Result<void> {
    if (this.props.status !== "pendente") {
      return Result.fail<void>("Solicitação de troca não está mais pendente");
    }

    this.props.status = "cancelada";
    return Result.ok<void>();
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
