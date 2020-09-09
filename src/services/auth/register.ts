import { Action } from 'redux';

import { fetchJSONRequest } from '../../utils';
import { runAndDispatch } from '../../utils/loop';
import { AUTH_URL } from './index';

export interface RegisterRequest {
  username: string;
  email: string
  password: string;
  name: string;
  lastname: string;
}

interface RegisterErrorResponse {
  type: "RegisterErrorResponse"
  detail: Array<{
    loc: Array<string>;
    msg: string;
    type: string;
  }>;
}

interface RegisterSuccessResponse {
  type: "RegisterSuccessResponse";
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  username: string;
  name: string;
  lastname: string;
}


export type RegisterResponse = 
  | {type: "RegisterSuccessResponse", response: RegisterSuccessResponse }
  | {type: "RegisterErrorResponse", response: RegisterErrorResponse | { detail: string } };

const registerRequest = <A extends Action>(request: RegisterRequest, onResponse: (response: RegisterResponse) => A) => {
  return fetchJSONRequest<RegisterRequest, RegisterSuccessResponse, RegisterErrorResponse>(AUTH_URL + 'register', request, 'POST')
    .then(response => onResponse(response.type === "Error" 
    ? {
      type: "RegisterErrorResponse",
      response: response.response,
    }
    : {
      type: "RegisterSuccessResponse",
      response: response.response,
    }));
}

export const apiRegister = <A extends Action>(request: RegisterRequest, onResponse: (response: RegisterResponse) => A) => 
  runAndDispatch(() => registerRequest(request, onResponse));