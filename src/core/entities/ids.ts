import { type GuardOptions, UniqueId } from "core-kernel";
import { CODIGOS_ERRO } from "../erros";

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
 * Opções de `XxxId.from(raw, opcoes)` no padrão do shift-swap: código `ID_INVALIDO` e o campo
 * de origem (`turnoId`, `funcionarioId`...) em vez do padrão do core-kernel (`INVALID_ID`, `id`).
 */
function opcoesDeId(campo: string): GuardOptions {
  return { field: campo, code: CODIGOS_ERRO.ID_INVALIDO, message: `${campo} inválido` };
}

export { FuncionarioId, opcoesDeId, SolicitacaoTrocaTurnoId, SupervisorId, TurnoId };
