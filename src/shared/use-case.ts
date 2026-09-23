import { Result } from "./result";

abstract class UseCase<Input, Output> {
  abstract execute(input: Input): Promise<Result<Output>> | Result<Output>;
}

export { UseCase };
