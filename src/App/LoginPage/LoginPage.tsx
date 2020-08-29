import React from 'react';
import { AuthClient } from '../../_services/'; 
import { LoopReducer, EMPTY } from '../../_utils/loop';

export interface State {
    type: "LoginPageState";
    response?: string;
}

interface LoginRequest {
    type: "LoginRequest";
    request: AuthClient.LoginRequest;
}

interface LoginWarningResponse {
    type: "LoginWarningResponse";
    response: string;
}

interface LoginSuccessResponse {
    type: "LoginSuccessResponse";
    response: AuthClient.LoginResponse
}

export type Action = LoginRequest | LoginWarningResponse | LoginSuccessResponse;

export const reducer: LoopReducer<State, Action> = (state: State, action: Action) => {
    return [state, EMPTY];
}

export const initialState = {
    type: "LoginPageState",
}

export const render: React.FunctionComponent = () => {
    return <h1>Login Page</h1>;
}