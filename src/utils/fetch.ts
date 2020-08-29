import fetch, { RequestInit } from 'node-fetch';
import { getAuthToken, authHeader } from './auth-token';

export const fetchFormRequest = <Rq, Rs>(url: string, request: Rq, method: string, auth: boolean = false): Promise<Rs> => {
  if (auth && getAuthToken() === undefined)
    throw new Error("You aren't logged in!");

  const params = new URLSearchParams();
  Object.entries(request).forEach(([key, value]) => {
    params.append(key, value);
  });

  const requestOptions: RequestInit = {
    method,
    body: params.toString(),
    headers: {
      ...(auth ? authHeader() : {}),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  };
  
  return fetch(url, requestOptions)
    .then(response => {
      if (!response.ok) {
        response.json().then(res => console.log(`Detail: ${res.detail}`));
        throw new Error(url + "\n" +
          response.status + " " + response.statusText)
      }
      return response.json() as Promise<Rs>;
    });
}

export const fetchJSONRequest = <Rq, Rs>(url: string, request: Rq, method: string, auth: boolean = false): Promise<Rs> => {
  if (auth && getAuthToken() === undefined)
    throw new Error("You aren't logged in!");

  const requestOptions: RequestInit = {
    method,
    ...(request ? {body: JSON.stringify(request)} : { }),
    headers: {
      ...(auth ? authHeader() : {}),
      'Content-Type': 'application/json',
    }
  };
  
  return fetch(url, requestOptions)
    .then(response => {
      if (!response.ok) {
        return response.json().then(res => res.detail);
      }
      return response.json() as Promise<Rs>;
    });
}