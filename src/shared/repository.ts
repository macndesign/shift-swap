import { Entity } from "./entity";

abstract class Repository<T extends Entity<unknown>> {
  abstract save(entity: T): Promise<void>;
  abstract update(entity: T): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
}

export { Repository };
