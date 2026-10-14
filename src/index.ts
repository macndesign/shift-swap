// Blocos genéricos (Result, erros, Clock, ports base) vêm do core-kernel, peerDependency
// desta lib: importe-os direto de "core-kernel".

// Entities, value objects e ids
export { EmailVO } from "./core/entities/email.vo.js";
export { FuncionarioEntity } from "./core/entities/funcionario.entity.js";
export {
  FuncionarioId,
  SolicitacaoTrocaTurnoId,
  SupervisorId,
  TurnoId,
} from "./core/entities/ids.js";
export { NameVO } from "./core/entities/name.vo.js";
export type { CreatePessoaProps, PessoaProps } from "./core/entities/pessoa.entity.js";
export {
  type ReconstituirSolicitacaoTrocaTurnoProps,
  SolicitacaoTrocaTurno,
  type StatusSolicitacaoTrocaTurno,
} from "./core/entities/solicitacao-troca-turno.entity.js";
export { SupervisorEntity } from "./core/entities/supervisor.entity.js";
export {
  type CriarTurnoProps,
  type HorarioTurno,
  Turno,
  type TurnoProps,
} from "./core/entities/turno.entity.js";
// Erros
export { CODIGOS_ERRO, type CodigoErro } from "./core/erros.js";

// Ports (a API implementa esses contratos com um banco de verdade)
export type { FuncionarioRepository } from "./core/ports/funcionario.repository.js";
export type { SolicitacaoTrocaTurnoRepository } from "./core/ports/solicitacao-troca-turno.repository.js";
export type { SupervisorRepository } from "./core/ports/supervisor.repository.js";
export type { TurnoRepository } from "./core/ports/turno.repository.js";
// Use-cases: Troca de turno
export { AceitarTrocaTurnoUseCase } from "./core/usecases/aceitar-troca-turno.usecase.js";
export { AprovarTrocaTurnoUseCase } from "./core/usecases/aprovar-troca-turno.usecase.js";
// Use-cases: Funcionario
export { AtualizarFuncionarioUseCase } from "./core/usecases/atualizar-funcionario.usecase.js";
// Use-cases: Turno
export { AtualizarTurnoUseCase } from "./core/usecases/atualizar-turno.usecase.js";
export { BuscarFuncionarioPorIdUseCase } from "./core/usecases/buscar-funcionario-por-id.usecase.js";
export { BuscarSolicitacaoTrocaTurnoPorIdUseCase } from "./core/usecases/buscar-solicitacao-troca-turno-por-id.usecase.js";
export { BuscarTurnoPorIdUseCase } from "./core/usecases/buscar-turno-por-id.usecase.js";
export { CancelarTrocaTurnoUseCase } from "./core/usecases/cancelar-troca-turno.usecase.js";
export { CriarFuncionarioUseCase } from "./core/usecases/criar-funcionario.usecase.js";
// Use-cases: Supervisor
export { CriarSupervisorUseCase } from "./core/usecases/criar-supervisor.usecase.js";
export { CriarTurnoUseCase } from "./core/usecases/criar-turno.usecase.js";
export { ExpirarSolicitacoesTrocaTurnoUseCase } from "./core/usecases/expirar-solicitacoes-troca-turno.usecase.js";
export { ListarFuncionariosUseCase } from "./core/usecases/listar-funcionarios.usecase.js";
export { ListarSolicitacoesRecebidasTrocaTurnoUseCase } from "./core/usecases/listar-solicitacoes-recebidas-troca-turno.usecase.js";
export { ListarSolicitacoesTrocaTurnoUseCase } from "./core/usecases/listar-solicitacoes-troca-turno.usecase.js";
export { ListarTurnosUseCase } from "./core/usecases/listar-turnos.usecase.js";
export { ListarTurnosPorFuncionarioEDataUseCase } from "./core/usecases/listar-turnos-por-funcionario-e-data.usecase.js";
export { RecusarTrocaTurnoUseCase } from "./core/usecases/recusar-troca-turno.usecase.js";
export { RejeitarTrocaTurnoUseCase } from "./core/usecases/rejeitar-troca-turno.usecase.js";
export { RemoverFuncionarioUseCase } from "./core/usecases/remover-funcionario.usecase.js";
export { RemoverTurnoUseCase } from "./core/usecases/remover-turno.usecase.js";
export { SolicitarTrocaTurnoUseCase } from "./core/usecases/solicitar-troca-turno.usecase.js";
