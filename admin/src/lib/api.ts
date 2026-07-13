import axios from "axios";
import Cookies from "js-cookie";

/**
 * The admin panel keeps its own cookie namespace so an admin session and a
 * customer session can coexist in one browser without overwriting each other.
 */
export const TOKEN_COOKIE = "arvion_admin_token";
export const REFRESH_COOKIE = "arvion_admin_refresh";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_COOKIE);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function clearSession() {
  Cookies.remove(TOKEN_COOKIE);
  Cookies.remove(REFRESH_COOKIE);
}

function redirectToLogin() {
  clearSession();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = `/login?redirect=${encodeURIComponent(
      window.location.pathname
    )}`;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      const refreshToken = Cookies.get(REFRESH_COOKIE);
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );
          Cookies.set(TOKEN_COOKIE, res.data.accessToken, { expires: 7 });
          Cookies.set(REFRESH_COOKIE, res.data.refreshToken, { expires: 7 });
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          redirectToLogin();
          return Promise.reject(refreshError);
        }
      }
      redirectToLogin();
    }

    if (error.response?.status === 403) {
      // Authenticated, but not an admin.
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

/** Extracts a human-readable message out of an axios error. */
export function apiError(err: any, fallback = "Something went wrong") {
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message || err?.message || fallback;
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const res = await api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
}

export default api;
