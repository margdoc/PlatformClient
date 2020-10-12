export const LocalStorageKey = "auth-token";

export const getAuthToken = () =>
  localStorage.getItem(LocalStorageKey);
