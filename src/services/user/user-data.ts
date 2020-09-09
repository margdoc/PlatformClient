import { Action } from 'redux';

import { fetchJSONRequest } from '../../utils';
import { runAndDispatch } from '../../utils/loop';
import { USERS_URL } from './index';

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
  return fetchJSONRequest<null, UserDataResponse, null>(USERS_URL + 'me', null, 'GET', true)
    .then(response => {
      if (response.type === "Error")
        throw new Error("User data request failed");
      
      return onResponse(response.response);
    });
}

export const apiUserData = <A extends Action>(onResponse: (response: UserDataResponse) => A) => 
  runAndDispatch(() => userDataRequest(onResponse));