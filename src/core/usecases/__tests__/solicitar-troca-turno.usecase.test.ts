import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { AGORA } from "../../__tests__/fixtures.js";
import { FuncionarioEntity } from "../../entities/funcionario.entity.js";
import { Turno } from "../../entities/turno.entity.js";
import { FuncionarioInMemoryRepository } from "../__mocks__/funcionario-in-memory.repository.js";
import { SolicitacaoTrocaTurnoInMemoryRepository } from "../__mocks__/solicitacao-troca-turno-in-memory.repository.js";
import { TurnoInMemoryRepository } from "../__mocks__/turno-in-memory.repository.js";
import { SolicitarTrocaTurnoUseCase } from "../solicitar-troca-turno.usecase.js";

function criarTurno(dono = "func-a") {
  return Turno.create({
    data: "2026-09-24",
    horaInicio: "08:00",
    horaFim: "12:00",
    funcionarioId: dono,
  }).unwrap();
}

function criarFuncionario(email = "destino@exemplo.com") {
  return FuncionarioEntity.create({ name: "Funcionário Teste", email }).unwrap();
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
    await turnoRepository.create(turno);
    const destinatario = criarFuncionario();
    await funcionarioRepository.create(destinatario);

    const result = await useCase.execute({
      turnoId: turno.id.value,
      solicitanteId: "func-a",
      destinatarioId: destinatario.id.value,
    });

    assertOk(result);
    const solicitacao = result.value;
    expect(solicitacao.status).toBe("pendente");
    expect(solicitacao.turno.id.equals(turno.id)).toBe(true);
    expect(solicitacao.destinatarioId.value).toBe(destinatario.id.value);
    expect(await solicitacaoRepository.findById(solicitacao.id)).toBe(solicitacao);
  });

  it("falha quando o turno não existe", async () => {
    const { funcionarioRepository, useCase } = criarSut();
    const destinatario = criarFuncionario();
    await funcionarioRepository.create(destinatario);

    const result = await useCase.execute({
      turnoId: "turno-inexistente",
      solicitanteId: "func-a",
      destinatarioId: destinatario.id.value,
    });

    assertFail(result, "TURNO_NAO_ENCONTRADO");
    expect(result.error.message).toBe("Turno não encontrado");
  });

  it("falha quando o destinatário não existe", async () => {
    const { turnoRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);

    const result = await useCase.execute({
      turnoId: turno.id.value,
      solicitanteId: "func-a",
      destinatarioId: "funcionario-inexistente",
    });

    assertFail(result, "FUNCIONARIO_NAO_ENCONTRADO");
    expect(result.error.message).toBe("Funcionário não encontrado");
  });

  it("falha quando já existe uma solicitação em aberto para o turno", async () => {
    const { turnoRepository, funcionarioRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const destinatario = criarFuncionario();
    await funcionarioRepository.create(destinatario);
    assertOk(
      await useCase.execute({
        turnoId: turno.id.value,
        solicitanteId: "func-a",
        destinatarioId: destinatario.id.value,
      }),
    );

    const result = await useCase.execute({
      turnoId: turno.id.value,
      solicitanteId: "func-a",
      destinatarioId: destinatario.id.value,
    });

    assertFail(result, "SOLICITACAO_EM_ABERTO_EXISTENTE");
    expect(result.error.message).toBe("Já existe uma solicitação em aberto para esse turno");
  });

  it("permite nova solicitação depois que a anterior foi recusada", async () => {
    const { turnoRepository, funcionarioRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const destinatario = criarFuncionario();
    await funcionarioRepository.create(destinatario);
    const primeira = await useCase.execute({
      turnoId: turno.id.value,
      solicitanteId: "func-a",
      destinatarioId: destinatario.id.value,
    });
    primeira.unwrap().recusar({ funcionarioId: destinatario.id, agora: AGORA }).unwrap();

    const result = await useCase.execute({
      turnoId: turno.id.value,
      solicitanteId: "func-a",
      destinatarioId: destinatario.id.value,
    });

    assertOk(result);
  });

  it("falha quando o solicitante não é o dono do turno", async () => {
    const { turnoRepository, funcionarioRepository, useCase } = criarSut();
    const turno = criarTurno("func-a");
    await turnoRepository.create(turno);
    const destinatario = criarFuncionario();
    await funcionarioRepository.create(destinatario);

    const result = await useCase.execute({
      turnoId: turno.id.value,
      solicitanteId: "func-b",
      destinatarioId: destinatario.id.value,
    });

    assertFail(result, "SOMENTE_DONO_DO_TURNO");
    expect(result.error.message).toBe("Somente o funcionário dono do turno pode solicitar a troca");
  });

  it("falha quando o destinatário é o próprio solicitante", async () => {
    const { turnoRepository, funcionarioRepository, useCase } = criarSut();
    const solicitante = criarFuncionario("solicitante@exemplo.com");
    await funcionarioRepository.create(solicitante);
    const turno = criarTurno(solicitante.id.value);
    await turnoRepository.create(turno);

    const result = await useCase.execute({
      turnoId: turno.id.value,
      solicitanteId: solicitante.id.value,
      destinatarioId: solicitante.id.value,
    });

    assertFail(result, "DESTINATARIO_IGUAL_SOLICITANTE");
    expect(result.error.message).toBe(
      "O solicitante não pode ser o destinatário da própria solicitação",
    );
  });
});
