import { BaseUseCase, Result, type ValidationError } from "core-kernel";
import { SupervisorEntity } from "../entities/supervisor.entity";
import type { SupervisorRepository } from "../ports/supervisor.repository";

interface CriarSupervisorInput {
  /** Id externo opcional (ex.: id do usuário no BetterAuth). */
  id?: string;
  name: string;
  email: string;
}

class CriarSupervisorUseCase extends BaseUseCase<
  CriarSupervisorInput,
  SupervisorEntity,
  ValidationError
> {
  constructor(private readonly supervisorRepository: Pick<SupervisorRepository, "create">) {
    super();
  }

  protected async handle(
    input: CriarSupervisorInput,
  ): Promise<Result<SupervisorEntity, ValidationError>> {
    const supervisor = SupervisorEntity.create(input, input.id);
    if (supervisor.isFail()) return supervisor;

    await this.supervisorRepository.create(supervisor.value);
    return Result.ok(supervisor.value);
  }
}

export { CriarSupervisorUseCase };
