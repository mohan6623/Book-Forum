import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { getAuthHeader, setToken, setRefreshToken, JwtResponse } from '@/services/authService';

export interface UserProfile {
  id: number;
  username: string;
  name?: string;
  email?: string;
  imagePublicId?: string; // Cloudinary public ID
  imageUrl?: string; // Cloudinary URL
  imageData?: string; // Resolved URL for UI (same as imageUrl)
}

export interface UserDto {
  id?: number;
  username?: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  imagePublicId?: string;
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

  /**
   * Update username (uses JWT for authentication, no userId in URL)
   * Returns JwtResponse with new token - caller should update token in storage
   */
  async updateUsername(username: string): Promise<JwtResponse> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_USERNAME}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader() 
      },
      body: JSON.stringify({ username: username.trim() }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to update username: ${res.status} ${text}`);
    }
    const jwtResponse: JwtResponse = await res.json();
    // Update tokens in storage
    if (jwtResponse.token) {
      setToken(jwtResponse.token);
    }
    if (jwtResponse.refreshToken) {
      setRefreshToken(jwtResponse.refreshToken);
    }
    return jwtResponse;
  },

  /**
   * Update display name (uses JWT for authentication, no userId in URL)
   */
  async updateName(name: string): Promise<UserDto> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_NAME}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader() 
      },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to update name: ${res.status} ${text}`);
    }
    return res.json();
  },

  /**
   * Update profile picture (uses JWT for authentication, no userId in URL)
   */
  async updateProfilePic(imageFile: File): Promise<UserDto> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_PROFILE_PIC}`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to update profile picture: ${res.status} ${text}`);
    }
    return res.json();
  },

  /**
   * @deprecated Use individual update methods: updateUsername, updateName, updateProfilePic
   */
  async updateUser(userId: number, user: Partial<UserProfile> & { password?: string }, imageFile?: File): Promise<UserProfile> {
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

    // No imageName needed - backend handles Cloudinary upload

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
    
    // Parse and return the updated user data
    const data = await res.json();
    return {
      id: data.id,
      username: data.name, // Backend sends 'name' field
      email: data.email,
      imageUrl: data.imageUrl, // Cloudinary URL
      imagePublicId: data.imagePublicId, // Cloudinary public ID
      imageData: data.imageUrl, // Use Cloudinary URL directly for UI
    };
  },
};
