import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { getAuthHeader } from '@/services/authService';

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  imageName?: string;
  imageData?: string;
  imageType?: string;
}

export const userService = {
  async checkUsernameAvailable(username: string): Promise<boolean> {
    if (!username || username.trim().length < 3) return false;
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AVAILABLE_USERNAME(username)}`);
  if (res.status === 200) return true;
  if (res.status === 409) return false;
  // Treat other statuses as unavailable, no console output
  return false;
  },

  async checkEmailAvailable(mail: string): Promise<boolean> {
    if (!mail) return false;
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AVAILABLE_MAIL(mail)}`);
  if (res.status === 200) return true;
  if (res.status === 409) return false;
  return false;
  },

  async updateUser(userId: number, user: Partial<UserProfile> & { password?: string }, imageFile?: File): Promise<void> {
    const form = new FormData();

    // Build payload only with fields that are explicitly provided to avoid
    // overwriting existing backend values with empty strings.
    const payload: Record<string, any> = {};
    // id is not strictly required in body (path param is used), but keep it for parity
    payload.id = userId;

    if (user.username && user.username.trim().length > 0) payload.username = user.username.trim();
    // Backend expects 'mail' field for email
    if ((user as any).email && String((user as any).email).trim().length > 0) payload.mail = String((user as any).email).trim();
    // Only include password if provided (user wants to change it)
    if ((user as any).password && String((user as any).password).length > 0) payload.password = (user as any).password;

    if (imageFile) payload.imageName = imageFile.name;

    form.append('user', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (imageFile) form.append('imageFile', imageFile);

    // No console logging in production

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_USER(userId)}`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
      body: form,
    });
    if (!res.ok) {
      let msg = 'Failed to update user profile';
      try {
        const text = await res.text();
        msg = `${msg}: ${res.status} ${text}`;
      } catch {}
      throw new Error(msg);
    }
  },
};
