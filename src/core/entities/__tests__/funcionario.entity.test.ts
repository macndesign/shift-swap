import { describe, expect, it } from "bun:test";
import { Email, Text } from "core-kernel/vo";
import { funcionarioId } from "../../__tests__/fixtures.js";
import { FuncionarioEntity } from "../funcionario.entity.js";
import { PessoaEntity } from "../pessoa.entity.js";

describe("FuncionarioEntity", () => {
  describe("reconstituir", () => {
    it("reidrata o funcionário com o id e os dados salvos", () => {
      const funcionario = FuncionarioEntity.reconstituir(
        {
          name: Text.create("João Silva").unwrap(),
          email: Email.create("joao@exemplo.com").unwrap(),
        },
        funcionarioId("func-salvo"),
      );

      expect(funcionario).toBeInstanceOf(FuncionarioEntity);
      expect(funcionario).toBeInstanceOf(PessoaEntity);
      expect(funcionario.id.value).toBe("func-salvo");
      expect(funcionario.name.value).toBe("João Silva");
      expect(funcionario.email.value).toBe("joao@exemplo.com");
    });
  });
});
