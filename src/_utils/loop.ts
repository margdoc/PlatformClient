import { Action } from 'redux';
import { Cmd, CmdType, Loop as ReduxLoop } from "redux-loop";

export const EmptyAction: Action = {
    type: "EmptyAction",
}

export interface Effect<A extends Action> {
    readonly type: string;
    readonly toCmd: () => CmdType;
    
    map: <B extends Action>(mapper: (action: A) => B) => Effect<B>;
}

class DispatchEffect<A extends Action> implements Effect<A> {
    constructor(readonly action: A) { }

    readonly type = "Effect/Dispatch";
    readonly toCmd = () => Cmd.action(this.action);

    map = <B extends Action>(mapper: (action: A) => B) => 
        new DispatchEffect(mapper(this.action));
}

export const defer = <A extends Action>(action: A) => new DispatchEffect(action);

class RunEffect<A extends Action, B> implements Effect<A> {
    constructor(
        readonly func: () => B, 
        readonly onSuccess: (value: any) => A,
        readonly onError: (err: Error) => A) { }

    readonly type = "Effect/Run/Effect";

    readonly toCmd = () => Cmd.run(this.func, {
        successActionCreator: this.onSuccess,
        failActionCreator: this.onError,
    });

    map = <C extends Action>(mapper: (action: A) => C) => 
        new RunEffect(
            this.func,
            (value: any) => mapper(this.onSuccess(value)),
            (err: Error) => mapper(this.onError(err)),
            );
}

// Run function as Effect and dispatch action 
class RunFunction<never> implements Effect<never> {
    constructor(
        readonly func: () => void) { }

    readonly type = "Effect/Run/Function";
    readonly toCmd = () => Cmd.run(this.func, {});

    map = () => this;
}

class RunAndDispatch<A extends Action> implements Effect<A> {
    constructor(
        readonly func: () => Promise<A>) { }

    readonly type = "Effect/Run/FunctionAndDispatch";
    readonly toCmd = () => Cmd.run(this.func, {
        successActionCreator: result => result,
    });

    map = <B extends Action>(mapper: (action: A) => B) => 
        new RunAndDispatch(() => this.func().then(mapper));
}

export const runEffect = <A extends Action>(
    onActivate: () => any, 
    onSuccess: (value: any) => A, 
    onError: (err: Error) => A
) => new RunEffect(onActivate, onSuccess, onError);

export const runFunction = (
    onActivate: () => void
) => new RunFunction(onActivate);

export const runAndDispatch = <A extends Action>(
    onActivate: () => Promise<A>
) => new RunAndDispatch(onActivate);

class EmptyEffect implements Effect<never> {
    readonly type = "Effect/Never";
    readonly toCmd = () => Cmd.none;

    map = () => this;
}

export const EMPTY = new EmptyEffect();

export const effectToCmd = <A extends Action>(effect: Effect<A>) => effect.toCmd();


export type Loop<S, A extends Action> = [S, Effect<A>];

export type LoopReducer<S, A extends Action> = (state: S, action: A) => Loop<S, A>;

export const getState = <S, A extends Action>(loop: Loop<S, A>): S => loop[0];

export const getEffect = <S, A extends Action>(loop: Loop<S, A>): Effect<A> => loop[1];


export const loopToReduxLoop = <S, A extends Action>(loop: Loop<S, A>): ReduxLoop<S> => 
    [getState(loop), effectToCmd(getEffect(loop))]; 


export const mapEffect = <S, A1 extends Action, A2 extends Action>(
    loop: Loop<S, A1>,
    mapper: (effect: A1) => A2
): Loop<S, A2> => [getState(loop), getEffect(loop).map(mapper)];


export const mapLoop = <S1, S2, A1 extends Action, A2 extends Action>(
    loop: Loop<S1, A1>, 
    stateMapper: (state: S1) => S2, 
    actionMapper: (effect: A1) => A2
): Loop<S2, A2> => [stateMapper(getState(loop)), getEffect(loop).map(actionMapper)];
