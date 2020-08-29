import React from 'react';
import { AuthClient } from '../../services'; 
import { Loop, LoopReducer, EMPTY } from '../../utils/loop';

export interface State {
  type: "LoginPageState";
  response?: string;
}

interface LoginRequest {
  type: "LoginRequest";
  request: AuthClient.LogInRequest;
}

interface LoginWarningResponse {
  type: "LoginWarningResponse";
  response: string;
}

interface LoginSuccessResponse {
  type: "LoginSuccessResponse";
  response: AuthClient.LogInResponse
}

export type Action = LoginRequest | LoginWarningResponse | LoginSuccessResponse;

export const reducer: LoopReducer<State, Action> = (state: State, action: Action) => {
  return [state, EMPTY];
}

export const initialLoop: Loop<State, Action> = [{
    type: "LoginPageState",
  }, EMPTY
];

export const render: React.FunctionComponent = () => {
  return <h1>Login Page</h1>;
}