// Shared
export { Result } from "./shared/result";

// Entities
export { FuncionarioEntity } from "./core/entities/funcionario.entity";
export { SupervisorEntity } from "./core/entities/supervisor.entity";
export { Turno } from "./core/entities/turno.entity";
export { SolicitacaoTrocaTurno, StatusSolicitacaoTrocaTurno } from "./core/entities/solicitacao-troca-turno.entity";
export { NameVO } from "./core/entities/name.vo";
export { EmailVO } from "./core/entities/email.vo";

// Ports (a API implementa esses contratos com um banco de verdade)
export { FuncionarioRepository } from "./core/ports/funcionario.repository";
export { SupervisorRepository } from "./core/ports/supervisor.repository";
export { TurnoRepository } from "./core/ports/turno.repository";
export { SolicitacaoTrocaTurnoRepository } from "./core/ports/solicitacao-troca-turno.repository";

// Use-cases: Funcionario
export { CriarFuncionarioUseCase } from "./core/usecases/criar-funcionario.usecase";
export { BuscarFuncionarioPorIdUseCase } from "./core/usecases/buscar-funcionario-por-id.usecase";
export { ListarFuncionariosUseCase } from "./core/usecases/listar-funcionarios.usecase";
export { AtualizarFuncionarioUseCase } from "./core/usecases/atualizar-funcionario.usecase";
export { RemoverFuncionarioUseCase } from "./core/usecases/remover-funcionario.usecase";

// Use-cases: Supervisor
export { CriarSupervisorUseCase } from "./core/usecases/criar-supervisor.usecase";

// Use-cases: Turno
export { CriarTurnoUseCase } from "./core/usecases/criar-turno.usecase";
export { BuscarTurnoPorIdUseCase } from "./core/usecases/buscar-turno-por-id.usecase";
export { ListarTurnosUseCase } from "./core/usecases/listar-turnos.usecase";
export { AtualizarTurnoUseCase } from "./core/usecases/atualizar-turno.usecase";
export { RemoverTurnoUseCase } from "./core/usecases/remover-turno.usecase";
export { ListarTurnosPorFuncionarioEDataUseCase } from "./core/usecases/listar-turnos-por-funcionario-e-data.usecase";

// Use-cases: Troca de turno
export { SolicitarTrocaTurnoUseCase } from "./core/usecases/solicitar-troca-turno.usecase";
export { AceitarTrocaTurnoUseCase } from "./core/usecases/aceitar-troca-turno.usecase";
export { CancelarTrocaTurnoUseCase } from "./core/usecases/cancelar-troca-turno.usecase";
export { BuscarSolicitacaoTrocaTurnoPorIdUseCase } from "./core/usecases/buscar-solicitacao-troca-turno-por-id.usecase";
export { ListarSolicitacoesTrocaTurnoUseCase } from "./core/usecases/listar-solicitacoes-troca-turno.usecase";
export { ListarTurnosDisponiveisParaTrocaUseCase } from "./core/usecases/listar-turnos-disponiveis-para-troca.usecase";
