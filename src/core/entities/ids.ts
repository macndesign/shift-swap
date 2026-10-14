import { type Result, UniqueId, ValidationError } from "core-kernel";

/** Ids tipados: o compilador não deixa passar o id de um tipo onde se espera o de outro. */
class FuncionarioId extends UniqueId {
  declare private readonly __brand: "FuncionarioId";
}

class SupervisorId extends UniqueId {
  declare private readonly __brand: "SupervisorId";
}

class TurnoId extends UniqueId {
  declare private readonly __brand: "TurnoId";
}

class SolicitacaoTrocaTurnoId extends UniqueId {
  declare private readonly __brand: "SolicitacaoTrocaTurnoId";
}

/**
 * Converte a falha de `XxxId.from(raw)` (código genérico `INVALID_ID`, campo `id`) para o
 * padrão do shift-swap: código `ID_INVALIDO` e o campo de origem (`turnoId`, `funcionarioId`...).
 */
function idDoCampo<I extends UniqueId>(
  resultado: Result<I, ValidationError>,
  campo: string,
): Result<I, ValidationError> {
  return resultado.mapError(
    () => new ValidationError({ field: campo, code: "ID_INVALIDO", message: `${campo} inválido` }),
  );
}

export { FuncionarioId, idDoCampo, SolicitacaoTrocaTurnoId, SupervisorId, TurnoId };
