abstract class ValueObject<T> {
  public readonly value: T;

  // Construtor apenas guarda o valor congelado. Validação não acontece aqui:
  // classes concretas devem expor um construtor privado + `static create(...): Result<T>`,
  // já que um construtor não pode retornar um Result em caso de falha.
  protected constructor(value: T) {
    this.value = Object.freeze(value);
  }

  equals(other?: ValueObject<T> | null): boolean {
    if (other == null) return false;
    if (!(other instanceof ValueObject)) return false;
    return ValueObject.isEqual(this.value, other.value);
  }

  isEmpty(): boolean {
    if (this.value == null) return true;
    if (typeof this.value === "string") return this.value.trim().length === 0;
    if (typeof this.value === "number") return Number.isNaN(this.value);
    if (Array.isArray(this.value)) return this.value.length === 0;
    return false;
  }

  toString(): string {
    return typeof this.value === "object" && this.value !== null
      ? JSON.stringify(this.value)
      : String(this.value);
  }

  private static isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
      return false;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      ValueObject.isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }
}

export { ValueObject };
