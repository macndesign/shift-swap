import { Repository } from "../../shared/repository";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";

abstract class SolicitacaoTrocaTurnoRepository extends Repository<SolicitacaoTrocaTurno> {
  abstract findPendentesByTurnoId(turnoId: string): Promise<SolicitacaoTrocaTurno[]>;
  abstract findPendentesExcetoSolicitante(solicitanteId: string): Promise<SolicitacaoTrocaTurno[]>;
}

export { SolicitacaoTrocaTurnoRepository };
