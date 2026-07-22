import axios from "axios";

// withCredentials lets the browser send/receive the httpOnly refresh-token
// cookie (set with path=/api/auth by the server) alongside requests.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

/**
 * Access tokens are short-lived (15 minutes) by design. Rather than
 * forcing a re-login every 15 minutes, a single 401 triggers one silent
 * call to /auth/refresh (which reads the httpOnly refresh cookie the
 * browser already has). If that succeeds we store the new access token
 * and retry the original request transparently; if it fails, the session
 * really is over and we fall through to a normal logout.
 */
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/register") || originalRequest?.url?.includes("/auth/refresh");

    if (err.response?.status === 401 && !originalRequest?._retried && !isAuthEndpoint) {
      originalRequest._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios.post("/api/auth/refresh", {}, { withCredentials: true }).finally(() => {
            refreshPromise = null;
          });
        }
        const refreshRes = await refreshPromise;
        localStorage.setItem("tf_token", refreshRes.data.token);
        localStorage.setItem("tf_user", JSON.stringify(refreshRes.data.user));
        originalRequest.headers.Authorization = `Bearer ${refreshRes.data.token}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem("tf_token");
        localStorage.removeItem("tf_user");
        return Promise.reject(err);
      }
    }

    if (err.response?.status === 401) {
      localStorage.removeItem("tf_token");
      localStorage.removeItem("tf_user");
    }
    return Promise.reject(err);
  }
);

export default api;
