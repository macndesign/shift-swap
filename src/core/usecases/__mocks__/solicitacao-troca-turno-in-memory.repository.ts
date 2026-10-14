import { InMemoryRepository } from "core-kernel/testing";
import type { FuncionarioId, TurnoId } from "../../entities/ids";
import type { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import type { SolicitacaoTrocaTurnoRepository } from "../../ports/solicitacao-troca-turno.repository";

const emAberto = (solicitacao: SolicitacaoTrocaTurno) =>
  solicitacao.status === "pendente" || solicitacao.status === "aguardando_aprovacao";

class SolicitacaoTrocaTurnoInMemoryRepository
  extends InMemoryRepository<SolicitacaoTrocaTurno>
  implements SolicitacaoTrocaTurnoRepository
{
  async findAll(): Promise<SolicitacaoTrocaTurno[]> {
    return this.filter(() => true);
  }

  async findEmAberto(): Promise<SolicitacaoTrocaTurno[]> {
    return this.filter(emAberto);
  }

  async findEmAbertoByTurnoId(turnoId: TurnoId): Promise<SolicitacaoTrocaTurno[]> {
    return this.filter(
      (solicitacao) => emAberto(solicitacao) && solicitacao.turno.id.equals(turnoId),
    );
  }

  async findPendentesByDestinatarioId(
    destinatarioId: FuncionarioId,
  ): Promise<SolicitacaoTrocaTurno[]> {
    return this.filter(
      (solicitacao) =>
        solicitacao.status === "pendente" && solicitacao.destinatarioId.equals(destinatarioId),
    );
  }
}

export { SolicitacaoTrocaTurnoInMemoryRepository };
