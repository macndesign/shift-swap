import type { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { SolicitacaoTrocaTurnoRepository } from "../../ports/solicitacao-troca-turno.repository";

function emAberto(solicitacao: SolicitacaoTrocaTurno): boolean {
  return solicitacao.status === "pendente" || solicitacao.status === "aguardando_aprovacao";
}

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

  async findEmAberto(): Promise<SolicitacaoTrocaTurno[]> {
    return Array.from(this.items.values()).filter(emAberto);
  }

  async findEmAbertoByTurnoId(turnoId: string): Promise<SolicitacaoTrocaTurno[]> {
    return Array.from(this.items.values()).filter(
      (solicitacao) => solicitacao.turno.id === turnoId && emAberto(solicitacao),
    );
  }

  async findPendentesByDestinatarioId(destinatarioId: string): Promise<SolicitacaoTrocaTurno[]> {
    return Array.from(this.items.values()).filter(
      (solicitacao) =>
        solicitacao.status === "pendente" && solicitacao.destinatarioId === destinatarioId,
    );
  }
}

export { SolicitacaoTrocaTurnoInMemoryRepository };
