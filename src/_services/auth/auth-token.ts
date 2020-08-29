export interface AuthToken {
  token: string;
  type: string;
}

export const setAuthToken = (token: string, type: string) => {
  localStorage.setItem('auth',
    JSON.stringify({
      token,
      type
    })
  );
}

export const getAuthToken = (): AuthToken | undefined => {
  const auth = localStorage.getItem('auth');

  return auth ? JSON.parse(auth) : undefined;
} 

export const removeAuthToken = () => {
  localStorage.removeItem('auth');
}

export const authHeader = (): {[key: string]: string} => {
  const auth = getAuthToken();

  if (auth && auth.token && auth.type === 'bearer') {
    return { 'Authorization': 'Bearer ' + auth.token };
  } else {
    return {};
  }
}

