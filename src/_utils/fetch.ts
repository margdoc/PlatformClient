import fetch, { RequestInit } from 'node-fetch';

export const fetchFormRequest = <Rq, Rs>(url: string, request: Rq): Promise<Rs> => {
  const params = new URLSearchParams();
  Object.entries(request).forEach(([key, value]) => {
    params.append(key, value);
  });

  const requestOptions: RequestInit = {
    method: 'POST',
    body: params.toString(),
    headers: { 
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

export const fetchJSONRequest = <Rq, Rs>(url: string, request: Rq): Promise<Rs> => {
  const requestOptions: RequestInit = {
    method: 'POST',
    body: JSON.stringify(request),
    headers: { 
      'Content-Type': 'application/json'
    },
  };
  
  return fetch(url, requestOptions)
    .then(response => {
      if (!response.ok) {
        response.json().then(res => console.log(`Detail: ${res.detail}`));
        throw new Error(url + "\n" +
          response.status + " " + response.statusText);
      }
      return response.json() as Promise<Rs>;
    });
}