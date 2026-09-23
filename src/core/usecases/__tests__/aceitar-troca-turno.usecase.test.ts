import { describe, expect, it } from "bun:test";
import { FuncionarioEntity } from "../../entities/funcionario.entity";
import { SolicitacaoTrocaTurno } from "../../entities/solicitacao-troca-turno.entity";
import { Turno } from "../../entities/turno.entity";
import { AceitarTrocaTurnoUseCase } from "../aceitar-troca-turno.usecase";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";

function criarTurno(funcionarioId: string, horaInicio = "08:00", horaFim = "12:00") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio,
    horaFim,
    funcionarioId,
  }).getValue();
}

function criarFuncionario(email: string) {
  return FuncionarioEntity.create({ name: "Funcionário Teste", email }).getValue();
}

function criarSut() {
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const turnoRepository = new TurnoInMemoryRepository();
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new AceitarTrocaTurnoUseCase(
    funcionarioRepository,
    turnoRepository,
    solicitacaoRepository
  );

  return { funcionarioRepository, turnoRepository, solicitacaoRepository, useCase };
}

describe("AceitarTrocaTurnoUseCase", () => {
  it("aceita a solicitação e transfere o turno quando não há conflito de horário", async () => {
    const { funcionarioRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const funcionario = criarFuncionario("destino@exemplo.com");
    await funcionarioRepository.save(funcionario);

    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: funcionario.id,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe("aceita");
    expect(result.getValue().destinatarioId).toBe(funcionario.id);
    expect(turno.funcionarioId).toBe(funcionario.id);
  });

  it("falha quando a solicitação não existe", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const funcionario = criarFuncionario("destino@exemplo.com");
    await funcionarioRepository.save(funcionario);

    const result = await useCase.execute({
      solicitacaoId: "solicitacao-inexistente",
      funcionarioId: funcionario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação não encontrada");
  });

  it("falha quando o funcionário que está aceitando não existe", async () => {
    const { turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: "funcionario-inexistente",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário não encontrado");
  });

  it("falha quando o funcionário já possui um turno no mesmo horário", async () => {
    const { funcionarioRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const funcionario = criarFuncionario("destino@exemplo.com");
    await funcionarioRepository.save(funcionario);

    const turno = criarTurno("func-a", "08:00", "12:00");
    await turnoRepository.save(turno);
    const turnoConflitante = criarTurno(funcionario.id, "10:00", "14:00");
    await turnoRepository.save(turnoConflitante);

    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    await solicitacaoRepository.save(solicitacao);

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: funcionario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário já possui um turno nesse horário");
  });

  it("falha quando a solicitação já não está mais pendente", async () => {
    const { funcionarioRepository, turnoRepository, solicitacaoRepository, useCase } = criarSut();
    const funcionario = criarFuncionario("destino@exemplo.com");
    await funcionarioRepository.save(funcionario);
    const outroFuncionario = criarFuncionario("outro@exemplo.com");
    await funcionarioRepository.save(outroFuncionario);

    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const solicitacao = SolicitacaoTrocaTurno.create({ turno, solicitanteId: "func-a" }).getValue();
    await solicitacaoRepository.save(solicitacao);
    solicitacao.cancelar();

    const result = await useCase.execute({
      solicitacaoId: solicitacao.id,
      funcionarioId: funcionario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Solicitação de troca não está mais pendente");
  });
});
