import { Action } from 'redux';

import { fetchFormRequest } from '../../utils';
import { runAndDispatch } from '../../utils/loop';
import { AUTH_URL } from './index';

export interface LogInRequest {
  username: string;
  password: string;
}

export interface LogInErrorResponse {
  type: "LogInErrorResponse";
  detail: string;
}

export interface LogInSuccessResponse {
  type: "LogInSuccessResponse";
  access_token: string;
  token_type: string;
}

export interface LogInRequestResponse {
  access_token: string;
  token_type: string;
}

export type LogInResponse = LogInSuccessResponse | LogInErrorResponse;

const loginRequest = <A extends Action>(request: LogInRequest, onResponse: (response: LogInResponse) => A) => {
  return fetchFormRequest<LogInRequest, LogInRequestResponse>(AUTH_URL + 'login', request, 'POST')
    .then(response => typeof response === "string" 
    ? onResponse({ type: "LogInErrorResponse", detail: response }) 
    : onResponse({ ...response, type: "LogInSuccessResponse" }));
}

export const apiLogin = <A extends Action>(request: LogInRequest, onResponse: (response: LogInResponse) => A) => 
  runAndDispatch(() => loginRequest(request, onResponse));