import { Result } from "../../shared/result";
import { UseCase } from "../../shared/use-case";
import { SupervisorEntity } from "../entities/supervisor.entity";
import { SupervisorRepository } from "../ports/supervisor.repository";

interface CriarSupervisorInput {
  id?: string;
  name: string;
  email: string;
}

class CriarSupervisorUseCase extends UseCase<CriarSupervisorInput, SupervisorEntity> {
  constructor(private readonly supervisorRepository: SupervisorRepository) {
    super();
  }

  async execute(input: CriarSupervisorInput): Promise<Result<SupervisorEntity>> {
    const supervisorOrError = SupervisorEntity.create(input, input.id);
    if (supervisorOrError.isFailure) {
      return Result.fail<SupervisorEntity>(supervisorOrError.error as string | Error);
    }

    const supervisor = supervisorOrError.getValue();
    await this.supervisorRepository.save(supervisor);

    return Result.ok<SupervisorEntity>(supervisor);
  }
}

export { CriarSupervisorUseCase };
