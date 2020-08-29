import { Action } from 'redux';

import { fetchJSONRequest } from '../../_utils';
import { runAndDispatch } from '../../_utils/loop';
import { AUTH_URL } from './index';

export interface UserDataResponse {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  username: string;
  name: string;
  lastname: string;
}

const userDataRequest = <A extends Action>(onResponse: (response: UserDataResponse) => A) => {
  return fetchJSONRequest<null, UserDataResponse>(AUTH_URL + 'login', null, true)
    .then(onResponse);
}

export const apiUserData = <A extends Action>(onResponse: (response: UserDataResponse) => A) => 
  runAndDispatch(() => userDataRequest(onResponse));