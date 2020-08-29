import { Action } from 'redux';

import { fetchJSONRequest } from '../../utils';
import { AUTH_URL } from './index';

export interface RegisterRequest {
  username: string;
  email: string
  password: string;
  name: string;
  lastname: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  username: string;
  name: string;
  lastname: string;
}

export const registerRequest = <A extends Action>(request: RegisterRequest, onResponse: (response: RegisterResponse) => A) => {
  fetchJSONRequest<RegisterRequest, RegisterResponse>(AUTH_URL + 'register', request, 'POST')
    .then(onResponse);
}