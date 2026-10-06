import { describe, expect, it } from "bun:test";
import { FuncionarioEntity } from "../../entities/funcionario.entity";
import { Turno } from "../../entities/turno.entity";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository";
import { SolicitarTrocaTurnoUseCase } from "../solicitar-troca-turno.usecase";

function criarTurno(funcionarioId = "func-a") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId,
  }).getValue();
}

function criarFuncionario(email = "destino@exemplo.com") {
  return FuncionarioEntity.create({ name: "Funcionário Teste", email }).getValue();
}

function criarSut() {
  const turnoRepository = new TurnoInMemoryRepository();
  const funcionarioRepository = new FuncionarioInMemoryRepository();
  const solicitacaoRepository = new SolicitacaoTrocaTurnoInMemoryRepository();
  const useCase = new SolicitarTrocaTurnoUseCase(
    turnoRepository,
    funcionarioRepository,
    solicitacaoRepository,
  );

  return { turnoRepository, funcionarioRepository, solicitacaoRepository, useCase };
}

describe("SolicitarTrocaTurnoUseCase", () => {
  it("cria e persiste uma solicitação pendente direcionada ao destinatário", async () => {
    const { turnoRepository, funcionarioRepository, solicitacaoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const destinatario = criarFuncionario();
    await funcionarioRepository.save(destinatario);

    const result = await useCase.execute({
      turnoId: turno.id,
      solicitanteId: "func-a",
      destinatarioId: destinatario.id,
    });

    expect(result.isSuccess).toBe(true);
    const solicitacao = result.getValue();
    expect(solicitacao.status).toBe("pendente");
    expect(solicitacao.turno.id).toBe(turno.id);
    expect(solicitacao.destinatarioId).toBe(destinatario.id);
    expect(await solicitacaoRepository.findById(solicitacao.id)).toBe(solicitacao);
  });

  it("falha quando o turno não existe", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const destinatario = criarFuncionario();
    await funcionarioRepository.save(destinatario);

    const result = await useCase.execute({
      turnoId: "turno-inexistente",
      solicitanteId: "func-a",
      destinatarioId: destinatario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Turno não encontrado");
  });

  it("falha quando o destinatário não existe", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);

    const result = await useCase.execute({
      turnoId: turno.id,
      solicitanteId: "func-a",
      destinatarioId: "funcionario-inexistente",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Funcionário não encontrado");
  });

  it("falha quando já existe uma solicitação em aberto para o turno", async () => {
    const { turnoRepository, funcionarioRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const destinatario = criarFuncionario();
    await funcionarioRepository.save(destinatario);
    await useCase.execute({
      turnoId: turno.id,
      solicitanteId: "func-a",
      destinatarioId: destinatario.id,
    });

    const result = await useCase.execute({
      turnoId: turno.id,
      solicitanteId: "func-a",
      destinatarioId: destinatario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Já existe uma solicitação em aberto para esse turno");
  });

  it("permite nova solicitação depois que a anterior foi recusada", async () => {
    const { turnoRepository, funcionarioRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const destinatario = criarFuncionario();
    await funcionarioRepository.save(destinatario);
    const primeira = await useCase.execute({
      turnoId: turno.id,
      solicitanteId: "func-a",
      destinatarioId: destinatario.id,
    });
    primeira.getValue().recusar({ funcionarioId: destinatario.id });

    const result = await useCase.execute({
      turnoId: turno.id,
      solicitanteId: "func-a",
      destinatarioId: destinatario.id,
    });

    expect(result.isSuccess).toBe(true);
  });

  it("falha quando o solicitante não é o dono do turno", async () => {
    const { turnoRepository, funcionarioRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.save(turno);
    const destinatario = criarFuncionario();
    await funcionarioRepository.save(destinatario);

    const result = await useCase.execute({
      turnoId: turno.id,
      solicitanteId: "func-b",
      destinatarioId: destinatario.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Somente o funcionário dono do turno pode solicitar a troca");
  });

  it("falha quando o destinatário é o próprio solicitante", async () => {
    const { turnoRepository, funcionarioRepository, useCase } = criarSut();
    const solicitante = criarFuncionario("solicitante@exemplo.com");
    await funcionarioRepository.save(solicitante);
    const turno = criarTurno(solicitante.id);
    await turnoRepository.save(turno);

    const result = await useCase.execute({
      turnoId: turno.id,
      solicitanteId: solicitante.id,
      destinatarioId: solicitante.id,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("O solicitante não pode ser o destinatário da própria solicitação");
  });
});
