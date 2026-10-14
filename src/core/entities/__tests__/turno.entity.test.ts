import { describe, expect, it } from "bun:test";
import { assertFail, assertOk } from "core-kernel/testing";
import { funcionarioId } from "../../__tests__/fixtures";
import { Turno } from "../turno.entity";

describe("Turno", () => {
  it("cria um Turno válido", () => {
    const result = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    });

    assertOk(result);
    const turno = result.value;
    expect(turno.data).toBe("2026-09-24");
    expect(turno.horaInicio).toBe("08:00");
    expect(turno.horaFim).toBe("12:00");
    expect(turno.funcionarioId.value).toBe("func-a");
  });

  it("falha quando a data tem formato inválido", () => {
    const result = Turno.create({
      data: "24-09-2026",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    });

    assertFail(result, "DATA_INVALIDA");
    expect(result.error.message).toBe("Data inválida: 24-09-2026");
  });

  it("falha quando a hora de início tem formato inválido", () => {
    const result = Turno.create({
      data: "2026-09-24",
      horaInicio: "8h",
      horaFim: "12:00",
      funcionarioId: "func-a",
    });

    assertFail(result, "HORA_INICIO_INVALIDA");
    expect(result.error.message).toBe("Hora de início inválida: 8h");
  });

  it("falha quando a hora de fim tem formato inválido", () => {
    const result = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "meio-dia",
      funcionarioId: "func-a",
    });

    assertFail(result, "HORA_FIM_INVALIDA");
    expect(result.error.message).toBe("Hora de fim inválida: meio-dia");
  });

  it("falha quando a hora de fim não é depois da hora de início", () => {
    const result = Turno.create({
      data: "2026-09-24",
      horaInicio: "12:00",
      horaFim: "08:00",
      funcionarioId: "func-a",
    });

    assertFail(result, "HORARIO_INVALIDO");
    expect(result.error.message).toBe("Hora de fim deve ser depois da hora de início");
  });

  it("falha quando o id do funcionário é vazio", () => {
    const result = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "",
    });

    assertFail(result, "ID_INVALIDO");
    expect(result.error.message).toBe("funcionarioId inválido");
  });

  it("reatribui o turno para outro funcionário", () => {
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).unwrap();

    const result = turno.reatribuir(funcionarioId("func-b"));

    assertOk(result);
    expect(turno.funcionarioId.value).toBe("func-b");
  });

  it("falha ao reatribuir para o mesmo funcionário que já é dono", () => {
    const turno = Turno.create({
      data: "2026-09-24",
      horaInicio: "08:00",
      horaFim: "12:00",
      funcionarioId: "func-a",
    }).unwrap();

    const result = turno.reatribuir(funcionarioId("func-a"));

    assertFail(result, "TURNO_JA_PERTENCE_AO_FUNCIONARIO");
    expect(result.error.message).toBe("O turno já pertence a esse funcionário");
  });
});
