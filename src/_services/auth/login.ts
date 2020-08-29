import { Action } from 'redux';

import { fetchFormRequest } from '../../_utils';
import { runAndDispatch } from '../../_utils/loop';
import { AUTH_URL } from './index';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

const loginRequest = <A extends Action>(request: LoginRequest, onResponse: (response: LoginResponse) => A) => {
  return fetchFormRequest<LoginRequest, LoginResponse>(AUTH_URL + 'login', request)
    .then(onResponse);
}

export const apiLogin = <A extends Action>(request: LoginRequest, onResponse: (response: LoginResponse) => A) => 
  runAndDispatch(() => loginRequest(request, onResponse));