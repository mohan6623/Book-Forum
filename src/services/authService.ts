import { API_BASE_URL } from '@/config/api';

type JwtResponse = {
  token: string;
  user: {
    id?: number;
    username: string;
    role?: string;
  };
};

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const authService = {
  async register(user: { username: string; password: string; role?: string }): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Registration failed');
  },

  async login(user: { username: string; password: string }): Promise<JwtResponse> {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Login failed');
    const data: JwtResponse = await res.json();
    if (data?.token) setToken(data.token);
    return data;
  },

  logout() {
    clearToken();
  },
};

export default authService;
