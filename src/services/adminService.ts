import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { getAuthHeader } from './authService';

export const adminService = {
  /**
   * Get rate limit status and cache statistics
   * Requires ROLE_ADMIN
   */
  async getRateLimitStatus(): Promise<string> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_RATE_LIMIT_STATUS}`, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch rate limit status');
    }

    return res.text();
  },
};
