import type { CreateRepository, FindByIdRepository, UpdateRepository } from "core-kernel";
import type { FuncionarioId, TurnoId } from "../entities/ids.js";
import type { SolicitacaoTrocaTurno } from "../entities/solicitacao-troca-turno.entity.js";

/** Sem delete: solicitações são encerradas por transição, para manter o histórico. */
interface SolicitacaoTrocaTurnoRepository
  extends CreateRepository<SolicitacaoTrocaTurno>,
    UpdateRepository<SolicitacaoTrocaTurno>,
    FindByIdRepository<SolicitacaoTrocaTurno> {
  findAll(): Promise<SolicitacaoTrocaTurno[]>;
  /** "Em aberto" = ainda sem desfecho: `pendente` (aguarda o destinatário) ou `aguardando_aprovacao`. */
  findEmAberto(): Promise<SolicitacaoTrocaTurno[]>;
  findEmAbertoByTurnoId(turnoId: TurnoId): Promise<SolicitacaoTrocaTurno[]>;
  /** Solicitações `pendente` endereçadas ao funcionário, à espera da resposta dele. */
  findPendentesByDestinatarioId(destinatarioId: FuncionarioId): Promise<SolicitacaoTrocaTurno[]>;
}

export type { SolicitacaoTrocaTurnoRepository };
