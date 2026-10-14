import { BaseUseCase, type NotFoundError, Result, type ValidationError } from "core-kernel";
import type { FuncionarioEntity } from "../entities/funcionario.entity";
import { FuncionarioId, idDoCampo } from "../entities/ids";
import { naoEncontrado } from "../erros";
import type { FuncionarioRepository } from "../ports/funcionario.repository";

interface AtualizarFuncionarioInput {
  id: string;
  name: string;
  email: string;
}

type Erro = ValidationError | NotFoundError;

class AtualizarFuncionarioUseCase extends BaseUseCase<
  AtualizarFuncionarioInput,
  FuncionarioEntity,
  Erro
> {
  constructor(
    private readonly funcionarioRepository: Pick<FuncionarioRepository, "findById" | "update">,
  ) {
    super();
  }

  protected async handle(
    input: AtualizarFuncionarioInput,
  ): Promise<Result<FuncionarioEntity, Erro>> {
    const id = idDoCampo(FuncionarioId.from(input.id), "id");
    if (id.isFail()) return id;

    const funcionario = await this.funcionarioRepository.findById(id.value);
    if (!funcionario) return Result.fail(naoEncontrado.funcionario());

    const atualizado = funcionario.atualizarDados({ name: input.name, email: input.email });
    if (atualizado.isFail()) return atualizado;

    await this.funcionarioRepository.update(funcionario);
    return Result.ok(funcionario);
  }
}

export { AtualizarFuncionarioUseCase };
