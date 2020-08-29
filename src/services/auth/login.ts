import { Action } from 'redux';

import { fetchFormRequest } from '../../utils';
import { runAndDispatch } from '../../utils/loop';
import { AUTH_URL } from './index';

export interface LogInRequest {
  username: string;
  password: string;
}

export interface LogInResponse {
  access_token: string;
  token_type: string;
}

const loginRequest = <A extends Action>(request: LogInRequest, onResponse: (response: LogInResponse) => A) => {
  return fetchFormRequest<LogInRequest, LogInResponse>(AUTH_URL + 'login', request)
    .then(onResponse);
}

export const apiLogin = <A extends Action>(request: LogInRequest, onResponse: (response: LogInResponse) => A) => 
  runAndDispatch(() => loginRequest(request, onResponse));