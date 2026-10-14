import { ConflictError, Entity, Result, ValidationError } from "core-kernel";
import { CODIGOS_ERRO } from "../erros.js";
import { FuncionarioId, opcoesDeId, TurnoId } from "./ids.js";

/**
 * Data e horas ficam como texto em horário local, sem fuso (`YYYY-MM-DD`, `HH:mm`): é assim
 * que o negócio fala de turnos, e a comparação de texto já ordena corretamente.
 */
interface TurnoProps {
  data: string;
  horaInicio: string;
  horaFim: string;
  funcionarioId: FuncionarioId;
}

interface HorarioTurno {
  data: string;
  horaInicio: string;
  horaFim: string;
}

interface CriarTurnoProps extends HorarioTurno {
  funcionarioId: string;
}

const DATA_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const ehBissexto = (ano: number) => ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);

/** Formato `YYYY-MM-DD` **e** dia existente no calendário (rejeita `2026-13-01`, `2026-02-30`). */
function dataValida(data: string): boolean {
  const partes = DATA_REGEX.exec(data);
  if (!partes) return false;
  const [ano, mes, dia] = partes.slice(1).map(Number) as [number, number, number];
  if (mes < 1 || mes > 12 || dia < 1) return false;
  const diasNoMes = [31, ehBissexto(ano) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return dia <= (diasNoMes[mes - 1] ?? 0);
}
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const invalido = (field: string, code: string, message: string) =>
  Result.fail(new ValidationError({ field, code, message }));

class Turno extends Entity<TurnoProps, TurnoId> {
  private constructor(props: TurnoProps, id: TurnoId) {
    super(props, id);
  }

  get data(): string {
    return this.props.data;
  }

  get horaInicio(): string {
    return this.props.horaInicio;
  }

  get horaFim(): string {
    return this.props.horaFim;
  }

  get funcionarioId(): FuncionarioId {
    return this.props.funcionarioId;
  }

  reatribuir(novoFuncionarioId: FuncionarioId): Result<void, ConflictError> {
    if (novoFuncionarioId.equals(this.props.funcionarioId)) {
      return Result.fail(
        new ConflictError("O turno já pertence a esse funcionário", {
          code: CODIGOS_ERRO.TURNO_JA_PERTENCE_AO_FUNCIONARIO,
        }),
      );
    }

    this.props.funcionarioId = novoFuncionarioId;
    return Result.ok();
  }

  atualizarHorario(horario: HorarioTurno): Result<void, ValidationError> {
    const valido = Turno.validarHorario(horario);
    if (valido.isFail()) return valido;

    this.props.data = horario.data;
    this.props.horaInicio = horario.horaInicio;
    this.props.horaFim = horario.horaFim;
    return Result.ok();
  }

  /** Para na primeira regra violada, na ordem: data, início, fim, fim depois do início. */
  private static validarHorario(horario: HorarioTurno): Result<void, ValidationError> {
    if (!dataValida(horario.data)) {
      return invalido("data", CODIGOS_ERRO.DATA_INVALIDA, `Data inválida: ${horario.data}`);
    }
    if (!HORA_REGEX.test(horario.horaInicio)) {
      return invalido(
        "horaInicio",
        CODIGOS_ERRO.HORA_INICIO_INVALIDA,
        `Hora de início inválida: ${horario.horaInicio}`,
      );
    }
    if (!HORA_REGEX.test(horario.horaFim)) {
      return invalido(
        "horaFim",
        CODIGOS_ERRO.HORA_FIM_INVALIDA,
        `Hora de fim inválida: ${horario.horaFim}`,
      );
    }
    if (horario.horaFim <= horario.horaInicio) {
      return invalido(
        "horaFim",
        CODIGOS_ERRO.HORARIO_INVALIDO,
        "Hora de fim deve ser depois da hora de início",
      );
    }
    return Result.ok();
  }

  static create(props: CriarTurnoProps): Result<Turno, ValidationError> {
    const horario = Turno.validarHorario(props);
    if (horario.isFail()) return horario;

    return FuncionarioId.from(props.funcionarioId, opcoesDeId("funcionarioId")).map(
      (funcionarioId) =>
        new Turno(
          {
            data: props.data,
            horaInicio: props.horaInicio,
            horaFim: props.horaFim,
            funcionarioId,
          },
          TurnoId.generate(),
        ),
    );
  }

  /** Reidratação pelo adapter de repositório: dados já persistidos, sem validação. */
  static reconstituir(props: TurnoProps, id: TurnoId): Turno {
    return new Turno({ ...props }, id);
  }
}

export { type CriarTurnoProps, type HorarioTurno, Turno, type TurnoProps };
