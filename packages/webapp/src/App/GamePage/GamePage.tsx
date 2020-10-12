import React from "react";

import { Loop, LoopReducer, EMPTY } from "utils/Loop";

export interface State {
  type: "GamePageState";
  game_id: string;
}

export type Action = { type: "NullAction" };

export const reducer: LoopReducer<State, Action> = (state: State, action: Action) => 
  [state, EMPTY];

export const initialLoop = (game_id: string): Loop<State, Action> => [{
    type: "GamePageState",
    game_id
  }, EMPTY
];

export const render: React.FunctionComponent = () => {
  return <h1>Game Page</h1>;
}