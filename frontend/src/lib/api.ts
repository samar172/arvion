import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('arvion_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function redirectToLogin() {
  Cookies.remove('arvion_token');
  Cookies.remove('arvion_refresh');
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = `/login/customer?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      const refreshToken = Cookies.get('arvion_refresh');
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );
          Cookies.set('arvion_token', res.data.accessToken, { expires: 7 });
          Cookies.set('arvion_refresh', res.data.refreshToken, { expires: 7 });
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          redirectToLogin();
          return Promise.reject(refreshError);
        }
      }
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;
