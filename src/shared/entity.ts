abstract class Entity<T> {
  private readonly _id: string;
  protected props: T;

  protected constructor(props: T, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(other?: Entity<T> | null): boolean {
    if (other == null) return false;
    if (this === other) return true;
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }

  toString(): string {
    return `${this.constructor.name}(${this._id})`;
  }
}

export { Entity };
