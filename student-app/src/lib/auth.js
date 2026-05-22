export const getToken = () =>
  typeof window !== 'undefined' ? sessionStorage.getItem('studentToken') : null;

export const getStudent = () => {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('studentData');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};

export const saveAuth = (token, student) => {
  sessionStorage.setItem('studentToken', token);
  sessionStorage.setItem('studentData', JSON.stringify(student));
};

export const clearAuth = () => {
  sessionStorage.removeItem('studentToken');
  sessionStorage.removeItem('studentData');
};

export const isLoggedIn = () => !!getToken();
