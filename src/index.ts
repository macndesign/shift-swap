// Blocos genéricos (Result, erros, Clock, ports base) vêm do core-kernel, peerDependency
// desta lib: importe-os direto de "core-kernel".

// Entities, value objects e ids
export { EmailVO } from "./core/entities/email.vo";
export { FuncionarioEntity } from "./core/entities/funcionario.entity";
export { FuncionarioId, SolicitacaoTrocaTurnoId, SupervisorId, TurnoId } from "./core/entities/ids";
export { NameVO } from "./core/entities/name.vo";
export type { CreatePessoaProps, PessoaProps } from "./core/entities/pessoa.entity";
export {
  type ReconstituirSolicitacaoTrocaTurnoProps,
  SolicitacaoTrocaTurno,
  type StatusSolicitacaoTrocaTurno,
} from "./core/entities/solicitacao-troca-turno.entity";
export { SupervisorEntity } from "./core/entities/supervisor.entity";
export {
  type CriarTurnoProps,
  type HorarioTurno,
  Turno,
  type TurnoProps,
} from "./core/entities/turno.entity";
// Erros
export { CODIGOS_ERRO, type CodigoErro } from "./core/erros";

// Ports (a API implementa esses contratos com um banco de verdade)
export type { FuncionarioRepository } from "./core/ports/funcionario.repository";
export type { SolicitacaoTrocaTurnoRepository } from "./core/ports/solicitacao-troca-turno.repository";
export type { SupervisorRepository } from "./core/ports/supervisor.repository";
export type { TurnoRepository } from "./core/ports/turno.repository";
// Use-cases: Troca de turno
export { AceitarTrocaTurnoUseCase } from "./core/usecases/aceitar-troca-turno.usecase";
export { AprovarTrocaTurnoUseCase } from "./core/usecases/aprovar-troca-turno.usecase";
// Use-cases: Funcionario
export { AtualizarFuncionarioUseCase } from "./core/usecases/atualizar-funcionario.usecase";
// Use-cases: Turno
export { AtualizarTurnoUseCase } from "./core/usecases/atualizar-turno.usecase";
export { BuscarFuncionarioPorIdUseCase } from "./core/usecases/buscar-funcionario-por-id.usecase";
export { BuscarSolicitacaoTrocaTurnoPorIdUseCase } from "./core/usecases/buscar-solicitacao-troca-turno-por-id.usecase";
export { BuscarTurnoPorIdUseCase } from "./core/usecases/buscar-turno-por-id.usecase";
export { CancelarTrocaTurnoUseCase } from "./core/usecases/cancelar-troca-turno.usecase";
export { CriarFuncionarioUseCase } from "./core/usecases/criar-funcionario.usecase";
// Use-cases: Supervisor
export { CriarSupervisorUseCase } from "./core/usecases/criar-supervisor.usecase";
export { CriarTurnoUseCase } from "./core/usecases/criar-turno.usecase";
export { ExpirarSolicitacoesTrocaTurnoUseCase } from "./core/usecases/expirar-solicitacoes-troca-turno.usecase";
export { ListarFuncionariosUseCase } from "./core/usecases/listar-funcionarios.usecase";
export { ListarSolicitacoesRecebidasTrocaTurnoUseCase } from "./core/usecases/listar-solicitacoes-recebidas-troca-turno.usecase";
export { ListarSolicitacoesTrocaTurnoUseCase } from "./core/usecases/listar-solicitacoes-troca-turno.usecase";
export { ListarTurnosUseCase } from "./core/usecases/listar-turnos.usecase";
export { ListarTurnosPorFuncionarioEDataUseCase } from "./core/usecases/listar-turnos-por-funcionario-e-data.usecase";
export { RecusarTrocaTurnoUseCase } from "./core/usecases/recusar-troca-turno.usecase";
export { RejeitarTrocaTurnoUseCase } from "./core/usecases/rejeitar-troca-turno.usecase";
export { RemoverFuncionarioUseCase } from "./core/usecases/remover-funcionario.usecase";
export { RemoverTurnoUseCase } from "./core/usecases/remover-turno.usecase";
export { SolicitarTrocaTurnoUseCase } from "./core/usecases/solicitar-troca-turno.usecase";
