import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { getAuthHeader } from '@/services/authService';

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  imageName?: string;
  imageData?: string;
}

export const userService = {
  async updateUser(userId: number, user: Partial<UserProfile>, imageFile?: File): Promise<void> {
    const form = new FormData();
    const payload = {
      id: userId,
      username: user.username ?? '',
      password: user.email ?? '', // Backend uses password field for updates
      imageName: imageFile?.name ?? user.imageName ?? '',
    };
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
