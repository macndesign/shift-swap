import { Repository } from "../../shared/repository";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity";

abstract class SolicitacaoTrocaTurnoRepository extends Repository<SolicitacaoTrocaTurno> {
  /** "Em aberto" = ainda sem desfecho: `pendente` (aguarda o destinatário) ou `aguardando_aprovacao`. */
  abstract findEmAberto(): Promise<SolicitacaoTrocaTurno[]>;
  abstract findEmAbertoByTurnoId(turnoId: string): Promise<SolicitacaoTrocaTurno[]>;
  /** Solicitações `pendente` endereçadas ao funcionário, à espera da resposta dele. */
  abstract findPendentesByDestinatarioId(destinatarioId: string): Promise<SolicitacaoTrocaTurno[]>;
}

export { SolicitacaoTrocaTurnoRepository };
