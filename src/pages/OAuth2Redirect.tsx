import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const OAuth2Redirect = () => {
  const [searchParams] = useSearchParams();
  const { handleOAuth2Login } = useAuth();
  const { toast } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (processedRef.current) return;
    
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      processedRef.current = true;
      toast({
        title: 'Authentication failed',
        description: 'There was an error logging in with OAuth2. Please try again.',
        variant: 'destructive',
      });
      window.location.href = '/login';
      return;
    }

    if (token) {
      processedRef.current = true;
      
      try {
        handleOAuth2Login(token);
        
        toast({
          title: 'Welcome!',
          description: 'You have successfully logged in.',
        });
        
        // Use window.location for reliable redirect
        window.location.href = '/';
      } catch (error) {
        toast({
          title: 'Login failed',
          description: 'Failed to process authentication token.',
          variant: 'destructive',
        });
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, [searchParams, handleOAuth2Login, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuth2Redirect;
