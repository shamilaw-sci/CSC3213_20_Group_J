let credential = null;
export const sessionToken = () => credential;
export const setSessionToken = token => { credential = token || null; };
export function clearSession(expected = credential) {
  if (expected !== credential) return;
  if (localStorage.getItem('token') === expected) localStorage.removeItem('token');
  credential = null;
  sessionStorage.clear();
  window.dispatchEvent(new Event('session-expired'));
}
