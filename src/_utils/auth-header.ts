interface AuthToken {
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

export const getAuthToken = (): AuthToken => {
  return JSON.parse(
    localStorage.getItem('auth') || '{}'
  );
} 

export const removeAuthToken = () => {
  localStorage.removeItem('auth');
}

export const authHeader = () => {
  const auth = getAuthToken();

  if (auth && auth.token && auth.type === 'bearer') {
    return { 'Authorization': 'Bearer ' + auth.token };
  } else {
    return {};
  }
}