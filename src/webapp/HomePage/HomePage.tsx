import React from 'react';
import { Loop, LoopReducer, EMPTY } from '../../utils/loop';

export interface State {
  type: "HomePageState";
}

export type Action = { type: "NullAction" };

export const reducer: LoopReducer<State, Action> = (state: State, action: Action) => 
  [state, EMPTY];

export const initialLoop: Loop<State, Action> = [{
    type: "HomePageState",
  }, EMPTY
];

export const render: React.FunctionComponent = () => {
  return <h1>Home Page</h1>;
}