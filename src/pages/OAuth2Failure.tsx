import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const OAuth2Failure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const error = searchParams.get('error');
    
    toast({
      title: 'Authentication failed',
      description: error || 'There was an error logging in with OAuth2. Please try again.',
      variant: 'destructive',
    });
  }, [searchParams, toast]);

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Authentication Failed</CardTitle>
          <CardDescription>
            We couldn't complete your OAuth2 login
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>
            {searchParams.get('error') || 'An unexpected error occurred during authentication.'}
          </p>
          <p className="mt-2">
            Please try again or use a different sign-in method.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleBackToLogin} className="w-full">
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OAuth2Failure;
