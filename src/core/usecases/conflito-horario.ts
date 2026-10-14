import type { Turno } from "../entities/turno.entity.js";

/**
 * Regra de domínio pura: algum turno do funcionário se sobrepõe ao turno alvo?
 * O próprio turno alvo é ignorado: ele pode já estar na lista (ex.: depois da troca).
 * Data e horas são texto local (`YYYY-MM-DD`, `HH:mm`), então a comparação de texto vale.
 */
function temConflitoDeHorario(turnosDoFuncionario: readonly Turno[], alvo: Turno): boolean {
  return turnosDoFuncionario.some(
    (turno) =>
      !turno.equals(alvo) &&
      turno.data === alvo.data &&
      turno.horaInicio < alvo.horaFim &&
      alvo.horaInicio < turno.horaFim,
  );
}

export { temConflitoDeHorario };
