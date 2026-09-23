class Left<L, R> {
  readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }
}

class Right<L, R> {
  readonly value: R;

  constructor(value: R) {
    this.value = value;
  }

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }
}

type Either<L, R> = Left<L, R> | Right<L, R>;

const left = <L, R>(value: L): Either<L, R> => new Left<L, R>(value);
const right = <L, R>(value: R): Either<L, R> => new Right<L, R>(value);

export { Either, Left, Right, left, right };
