export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('studentToken') : null;

export const getStudent = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('studentData');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};

export const saveAuth = (token, student) => {
  localStorage.setItem('studentToken', token);
  localStorage.setItem('studentData', JSON.stringify(student));
};

export const clearAuth = () => {
  localStorage.removeItem('studentToken');
  localStorage.removeItem('studentData');
};

export const isLoggedIn = () => !!getToken();
