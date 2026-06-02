// Central axios client for the InternConnect API.
// All frontend API modules (src/api/*) build on this. Stable contract — touch deliberately.
import axios from 'axios';

const TOKEN_KEY = 'ic_token';

// JWT access-token storage. (Refresh token is an httpOnly cookie set by the backend.)
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// baseURL '/api' is proxied to the Express backend by Vite (see vite.config.js).
const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach the JWT access token to every request.
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, drop the stale token and bounce to login (unless already on a public page).
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
      const publicPaths = ['/', '/login', '/register'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export default client;
