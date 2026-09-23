import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { SolicitacaoTrocaTurnoRepository } from "../../ports/solicitacao-troca-turno.repository";

class SolicitacaoTrocaTurnoInMemoryRepository extends SolicitacaoTrocaTurnoRepository {
  private readonly items = new Map<string, SolicitacaoTrocaTurno>();

  async save(entity: SolicitacaoTrocaTurno): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async update(entity: SolicitacaoTrocaTurno): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async findById(id: string): Promise<SolicitacaoTrocaTurno | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(): Promise<SolicitacaoTrocaTurno[]> {
    return Array.from(this.items.values());
  }

  async findPendentesByTurnoId(turnoId: string): Promise<SolicitacaoTrocaTurno[]> {
    return Array.from(this.items.values()).filter(
      (solicitacao) => solicitacao.turno.id === turnoId && solicitacao.status === "pendente"
    );
  }

  async findPendentesExcetoSolicitante(solicitanteId: string): Promise<SolicitacaoTrocaTurno[]> {
    return Array.from(this.items.values()).filter(
      (solicitacao) => solicitacao.status === "pendente" && solicitacao.solicitanteId !== solicitanteId
    );
  }
}

export { SolicitacaoTrocaTurnoInMemoryRepository };
