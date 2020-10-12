import {Action, AnyAction} from "redux";
import {from} from "rxjs";
import {groupBy, map, mergeMap, switchMap} from "rxjs/operators";
import {ofType, Effect, Epic} from "./Loop";

export const defaultTracker = Symbol("defaultTracker");

export class DeferAction<A extends Action> implements Effect<A> {
  readonly type = "DeferAction";

  constructor(readonly actionType: A["type"],
              readonly createAction: () => A,
              readonly tracker?: string) {
  }

  map<B extends Action>(mapper: (from: A) => B): DeferAction<B> {
    return new DeferAction(mapper(this.createAction()).type,
      () => mapper(this.createAction()));
  }
}

export function defer<A extends Action>(action: A): DeferAction<A> {
  return new DeferAction(action.type, () => action);
}

export const epic: Epic<Action, AnyAction> = (effect$) =>
effect$.pipe(
  ofType<DeferAction<Action>>("DeferAction"),
  groupBy(action => action.tracker || defaultTracker),
  mergeMap(group =>
    group.pipe(
      switchMap(action => {
        switch (action.type) {
          case "DeferAction":
            return from(new Promise<void>((resolve, _reject) => {
              setTimeout(resolve, 0);
            })).pipe(map(() => action.createAction()));
        }
      })
    )
  )
);
