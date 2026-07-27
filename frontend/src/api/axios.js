import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // sends httpOnly auth cookies automatically
});

// If a request fails with 401, try refreshing the access token once, then retry.
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => queue.push(() => resolve(api(original))));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await api.post("/auth/refresh");
        queue.forEach((cb) => cb());
        queue = [];
        return api(original);
      } catch (refreshErr) {
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
