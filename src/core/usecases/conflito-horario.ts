import type { Turno } from "../entities/turno.entity";

/**
 * Indica se algum dos turnos do funcionário se sobrepõe ao turno alvo.
 * O próprio turno alvo é ignorado: ele pode já estar na lista (ex.: depois da troca).
 */
function temConflitoDeHorario(turnosDoFuncionario: Turno[], alvo: Turno): boolean {
  return turnosDoFuncionario.some(
    (turno) =>
      turno.id !== alvo.id && turno.horaInicio < alvo.horaFim && alvo.horaInicio < turno.horaFim,
  );
}

export { temConflitoDeHorario };
