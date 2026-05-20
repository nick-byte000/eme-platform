const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!data.success && response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        window.location.href = '/';
      }
    }

    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
};