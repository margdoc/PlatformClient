import { Action, AnyAction } from "redux";
import { ignoreElements, map, tap } from "rxjs/operators";
import { combineEpics, ofType, Effect, Epic, SilentEff } from "./Loop";

// EFFECTS

export class GetItem<A extends Action> implements Effect<A> {
  readonly type = "LocalStorage/GetItem";

  constructor(
    readonly key: string,
    readonly onReturn: (value: string | null) => A
  ) {}

  map<B extends Action>(mapper: (from: A) => B): GetItem<B> {
    return new GetItem(this.key, p => mapper(this.onReturn(p)));
  }
}

export class SetItem<A extends Action> implements Effect<A> {
  readonly type = "LocalStorage/SetItem";

  constructor(
    readonly key: string,
    readonly value: string,
    readonly onReturn: () => A
  ) {}

  map<B extends Action>(mapper: (from: A) => B): SetItem<B> {
    return new SetItem(this.key, this.value, () => mapper(this.onReturn()));
  }
}

export class RemoveItem extends SilentEff {
  readonly type = "LocalStorage/RemoveItem";

  constructor(readonly key: string) {
    super();
  }
}

// EPIC

const getItemEpic: Epic<Action, AnyAction> = effect$ =>
  effect$.pipe(
    ofType<GetItem<Action>>("LocalStorage/GetItem"),
    map(({ key, onReturn }) => {
      const value = localStorage.getItem(key);

      return onReturn(value);
    })
  );

const setItemEpic: Epic<Action, AnyAction> = effect$ =>
  effect$.pipe(
    ofType<SetItem<Action>>("LocalStorage/SetItem"),
    tap(({ key, value, onReturn }) => {
      localStorage.setItem(key, value);

      return onReturn();
    }),
  );

const removeItemEpic: Epic<Action, never> = effect$ =>
  effect$.pipe(
    ofType<RemoveItem>("LocalStorage/RemoveItem"),
    tap(({ key }) => {
      localStorage.removeItem(key);
    }),
    ignoreElements()
  );

export const epic = combineEpics(getItemEpic, setItemEpic, removeItemEpic);
