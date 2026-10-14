import { FixedClock } from "core-kernel/testing";
import { FuncionarioId, SolicitacaoTrocaTurnoId, SupervisorId, TurnoId } from "../entities/ids.js";

/** Atalhos para criar ids tipados nos testes. */
export const funcionarioId = (valor: string) => FuncionarioId.from(valor).unwrap();
export const supervisorId = (valor: string) => SupervisorId.from(valor).unwrap();
export const turnoId = (valor: string) => TurnoId.from(valor).unwrap();
export const solicitacaoId = (valor: string) => SolicitacaoTrocaTurnoId.from(valor).unwrap();

/** Instante fixo usado como "agora" nas transições e no Clock dos use cases. */
export const AGORA = new Date("2026-09-20T10:00:00.000Z");
export const relogio = () => new FixedClock(AGORA);
