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
  async updateUser(userId: number, user: Partial<UserProfile> & { password?: string }, imageFile?: File): Promise<void> {
    const form = new FormData();

    // Build payload only with fields that are explicitly provided to avoid
    // overwriting existing backend values with empty strings.
    const payload: Record<string, any> = {};
    // id is not strictly required in body (path param is used), but keep it for parity
    payload.id = userId;

    if (user.username) payload.username = user.username;
    // Backend expects 'mail' field for email
    if ((user as any).email) payload.mail = (user as any).email;
    // Only include password if provided (user wants to change it)
    if ((user as any).password) payload.password = (user as any).password;

    if (imageFile) payload.imageName = imageFile.name;

    form.append('user', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (imageFile) form.append('imageFile', imageFile);

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_USER(userId)}`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
      body: form,
    });
    if (!res.ok) throw new Error('Failed to update user profile');
  },
};
