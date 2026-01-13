import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { JwtResponse, setToken } from './authService';

export interface PasswordResetDto {
  token: string;
  password: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  jwtResponse?: JwtResponse;
}

export const emailService = {
  /**
   * Verify email with token from email link
   * Returns JwtResponse on success (user is auto-logged in)
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.VERIFY_EMAIL}?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
      }
    );
    
    if (!res.ok) {
      return { success: false };
    }
    
    const jwtResponse: JwtResponse = await res.json();
    if (jwtResponse?.token) {
      setToken(jwtResponse.token);
    }
    return { success: true, jwtResponse };
  },

  /**
   * Resend email verification link
   */
  async resendVerification(email: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RESEND_VERIFICATION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Failed to resend verification email');
    }
  },

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FORGOT_PASSWORD}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Failed to send password reset email');
    }
  },

  /**
   * Validate password reset token (GET request)
   */
  async validateResetToken(token: string): Promise<boolean> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.VALIDATE_FORGOT_PASSWORD}?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
      }
    );
    return res.ok;
  },

  /**
   * Reset password with token (PUT request)
   */
  async resetPassword(passwordResetDto: PasswordResetDto): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.VALIDATE_FORGOT_PASSWORD}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordResetDto),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Failed to reset password');
    }
  },
};
