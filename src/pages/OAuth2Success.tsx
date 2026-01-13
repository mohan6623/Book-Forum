import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const OAuth2Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuth2Login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // If opened in popup, send message to parent and close
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'oauth-success', token },
          window.location.origin
        );
        window.close();
        return;
      }

      // Otherwise, handle normally (fallback for non-popup flow)
      try {
        handleOAuth2Login(token);
        toast({
          title: 'Welcome!',
          description: 'You have successfully logged in with OAuth2.',
        });
        navigate('/', { replace: true });
      } catch (error) {
        toast({
          title: 'Login failed',
          description: 'Failed to process authentication token.',
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
      }
    } else {
      // If opened in popup, send error to parent and close
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'oauth-error', error: 'No token received' },
          window.location.origin
        );
        window.close();
        return;
      }
      
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, handleOAuth2Login, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuth2Success;
