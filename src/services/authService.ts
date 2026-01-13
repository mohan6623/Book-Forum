import { API_BASE_URL } from '@/config/api';

export type JwtResponse = {
  token: string;
  user: {
    id?: number;
    username: string;
    name?: string;
    role?: string;
    email?: string;
    imagePublicId?: string; // Cloudinary public ID
    imageUrl?: string; // Cloudinary URL
    imageData?: string;
    oauthProviders?: string[]; // List of connected OAuth providers (GOOGLE, GITHUB)
    hasPassword?: boolean; // Whether user has a password set
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
  async register(user: { username: string; email?: string; mail?: string; password: string; role?: string }): Promise<void> {
    // Backend expects property name 'email'
    const roleNormalized = user.role
      ? (user.role.startsWith('ROLE_') ? user.role : `ROLE_${user.role}`)
      : undefined;
    const payload = {
      username: user.username,
      password: user.password,
      role: roleNormalized,
      email: user.mail ?? user.email,
    } as const;
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Registration failed');
  },

  async login(user: { username: string; password: string }): Promise<JwtResponse> {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      // Try to get the error message from the response body
      const errorText = await res.text();
      const error = new Error(errorText || 'Login failed');
      (error as any).status = res.status;
      throw error;
    }
    const data: JwtResponse = await res.json();
    if (data?.token) setToken(data.token);
    return data;
  },

  logout() {
    clearToken();
  },

  isAuthenticated(): boolean {
    return getToken() !== null;
  },
};

export default authService;
