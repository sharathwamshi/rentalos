import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && localStorage.getItem("refresh_token")) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject, original }));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const { data } = await axios.post("/api/auth/refresh", {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        localStorage.setItem("access_token", data.access_token);
        queue.forEach(({ resolve, original: o }) => {
          o.headers.Authorization = `Bearer ${data.access_token}`;
          resolve(api(o));
        });
        queue = [];
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (e) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
