import { getToken, clearAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const token = getToken();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  if (!data.success && response.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') window.location.href = '/login';
  }

  return data;
};
