import { Entity } from "../../shared/entity";
import { Result } from "../../shared/result";

interface TurnoProps {
  data: string;
  horaInicio: string;
  horaFim: string;
  funcionarioId: string;
}

interface HorarioTurno {
  data: string;
  horaInicio: string;
  horaFim: string;
}

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

class Turno extends Entity<TurnoProps> {
  private constructor(props: TurnoProps, id?: string) {
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

  get funcionarioId(): string {
    return this.props.funcionarioId;
  }

  reatribuir(novoFuncionarioId: string): Result<void> {
    if (!novoFuncionarioId || novoFuncionarioId.trim().length === 0) {
      return Result.fail<void>("Id do novo funcionário não pode ser vazio");
    }
    if (novoFuncionarioId === this.props.funcionarioId) {
      return Result.fail<void>("O turno já pertence a esse funcionário");
    }

    this.props.funcionarioId = novoFuncionarioId;
    return Result.ok<void>();
  }

  atualizarHorario(horario: HorarioTurno): Result<void> {
    const validacao = Turno.validarHorario(horario);
    if (validacao.isFailure) {
      return validacao;
    }

    this.props.data = horario.data;
    this.props.horaInicio = horario.horaInicio;
    this.props.horaFim = horario.horaFim;
    return Result.ok<void>();
  }

  private static validarHorario(horario: HorarioTurno): Result<void> {
    if (!DATA_REGEX.test(horario.data)) {
      return Result.fail<void>(`Data inválida: ${horario.data}`);
    }
    if (!HORA_REGEX.test(horario.horaInicio)) {
      return Result.fail<void>(`Hora de início inválida: ${horario.horaInicio}`);
    }
    if (!HORA_REGEX.test(horario.horaFim)) {
      return Result.fail<void>(`Hora de fim inválida: ${horario.horaFim}`);
    }
    if (horario.horaFim <= horario.horaInicio) {
      return Result.fail<void>("Hora de fim deve ser depois da hora de início");
    }
    return Result.ok<void>();
  }

  static create(props: TurnoProps, id?: string): Result<Turno> {
    const validacao = Turno.validarHorario(props);
    if (validacao.isFailure) {
      return Result.fail<Turno>(validacao.error as string | Error);
    }
    if (!props.funcionarioId || props.funcionarioId.trim().length === 0) {
      return Result.fail<Turno>("Id do funcionário não pode ser vazio");
    }

    return Result.ok<Turno>(
      new Turno(
        {
          data: props.data,
          horaInicio: props.horaInicio,
          horaFim: props.horaFim,
          funcionarioId: props.funcionarioId,
        },
        id,
      ),
    );
  }
}

export { Turno, type TurnoProps };
