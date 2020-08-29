import React from 'react';
import { LoopReducer, EMPTY } from '../../_utils/loop';

export interface State {
    type: "HomePageState";
}

export type Action = { type: "NullAction" };

export const reducer: LoopReducer<State, Action> = (state: State, action: Action) => 
    [state, EMPTY];

export const initialState = {
    type: "HomePageState",
}

export const render: React.FunctionComponent = () => {
    return <h1>Home Page</h1>;
}