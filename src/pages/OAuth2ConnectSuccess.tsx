import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { Loader2 } from 'lucide-react';

export default function OAuth2ConnectSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUserData } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting your account...');

  useEffect(() => {
    const handleConnection = async () => {
      const provider = searchParams.get('provider');
      const providerId = searchParams.get('providerId');
      const oauthEmail = searchParams.get('oauthEmail');
      const stateToken = searchParams.get('stateToken'); // STATELESS: from database, not session
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(error);
        setTimeout(() => navigate('/profile'), 3000);
        return;
      }

      if (!provider || !providerId || !stateToken) {
        setStatus('error');
        setMessage('Invalid connection parameters (missing state token)');
        setTimeout(() => navigate('/profile'), 3000);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setStatus('error');
          setMessage('Authentication required. Please log in again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Call the link endpoint with state token for validation
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OAUTH_LINK}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ provider, providerId, oauthEmail, stateToken }),
        });

        const data = await response.json();

        if (response.ok) {
          const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
          
          // Check for email mismatch warning
          if (data.emailMismatch) {
            setStatus('success');
            setMessage(`${providerName} account connected successfully! Note: The OAuth account email (${data.oauthEmail}) differs from your account email (${data.accountEmail}).`);
          } else if (data.code === 'ALREADY_LINKED') {
            setStatus('success');
            setMessage(`${providerName} account is already linked to your profile.`);
          } else {
            setStatus('success');
            setMessage(`${providerName} account connected successfully!`);
          }

          // Update user context with new OAuth provider
          if (user && data.code !== 'ALREADY_LINKED') {
            const updatedUser = {
              ...user,
              oauthProviders: [...(user.oauthProviders || []), provider.toUpperCase()],
            };
            updateUserData(updatedUser);
          }

          setTimeout(() => navigate('/profile'), data.emailMismatch ? 4000 : 2000);
        } else {
          setStatus('error');
          // Provide more specific error messages based on error code
          if (data.code === 'ALREADY_LINKED_ELSEWHERE') {
            setMessage('This OAuth account is already linked to another user. Please use a different account.');
          } else if (data.code === 'PROVIDER_ALREADY_LINKED') {
            setMessage(data.error || 'You already have this provider linked. Disconnect it first to link a different account.');
          } else {
            setMessage(data.error || 'Failed to connect account');
          }
          setTimeout(() => navigate('/profile'), 4000);
        }
      } catch (error) {
        console.error('Error linking OAuth account:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        setTimeout(() => navigate('/profile'), 3000);
      }
    };

    handleConnection();
  }, [searchParams, navigate, user, updateUserData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Connecting Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Redirecting to your profile...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Redirecting to your profile...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
