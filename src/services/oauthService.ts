import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { JwtResponse } from './authService';

export interface OAuthDto {
  provider: 'GOOGLE' | 'GITHUB';
  code: string;
  redirectUrl: string;
}

export interface OAuthErrorResponse {
  error: 'EMAIL_REQUIRED' | 'ACCOUNT_EXISTS';
  message: string;
  pendingToken?: string;
}

export const oauthService = {
  /**
   * Exchange OAuth authorization code for JWT token
   * This is the frontend-initiated OAuth flow where backend exchanges the code
   */
  async handleOAuthCallback(oauthDto: OAuthDto): Promise<JwtResponse> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OAUTH_CALLBACK}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(oauthDto),
    });

    if (!res.ok) {
      const errorData = await res.json();
      
      // Handle EMAIL_REQUIRED case
      if (errorData.error === 'EMAIL_REQUIRED') {
        throw {
          type: 'EMAIL_REQUIRED',
          message: errorData.message,
          pendingToken: errorData.pendingToken,
        };
      }
      
      // Handle ACCOUNT_EXISTS case
      if (errorData.error === 'ACCOUNT_EXISTS') {
        throw {
          type: 'ACCOUNT_EXISTS',
          message: errorData.message,
        };
      }
      
      throw new Error(errorData.message || 'OAuth authentication failed');
    }

    return res.json();
  },

  /**
   * Submit email for GitHub OAuth when email is required
   */
  async submitOAuthEmail(pendingToken: string, email: string, username?: string, name?: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/oauth/submit-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pendingToken, email, username, name }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Failed to submit email' }));
      throw new Error(errorData.message || 'Failed to submit email');
    }

    return res.json();
  },

  /**
   * Complete OAuth registration (for new users who need to set username/display name)
   */
  async completeRegistration(pendingToken: string, username: string, name?: string): Promise<{
    message: string;
    token: string;
    userId: number;
    username: string;
    email: string;
    name: string;
    imageUrl: string;
    role: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/oauth/complete-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pendingToken, username, name }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Failed to complete registration' }));
      throw errorData;
    }

    return res.json();
  },

  /**
   * Check OAuth service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OAUTH_HEALTH}`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
