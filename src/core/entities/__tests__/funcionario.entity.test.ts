import { describe, expect, it } from "bun:test";
import { funcionarioId } from "../../__tests__/fixtures.js";
import { EmailVO } from "../email.vo.js";
import { FuncionarioEntity } from "../funcionario.entity.js";
import { NameVO } from "../name.vo.js";
import { PessoaEntity } from "../pessoa.entity.js";

describe("FuncionarioEntity", () => {
  describe("reconstituir", () => {
    it("reidrata o funcionário com o id e os dados salvos", () => {
      const funcionario = FuncionarioEntity.reconstituir(
        {
          name: NameVO.create("João Silva").unwrap(),
          email: EmailVO.create("joao@exemplo.com").unwrap(),
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
