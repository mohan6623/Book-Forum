import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Mail, Loader2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { oauthService } from '@/services/oauthService';

interface ErrorDetails {
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'warning' | 'info';
  bgClass: string;
  textClass: string;
}

const OAuth2Failure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleOAuth2Login } = useAuth();
  
  const [emailRequired, setEmailRequired] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const getErrorDetails = (errorMsg: string | null): ErrorDetails => {
    const error = errorMsg?.toLowerCase() || '';
    
    if (error.includes('already exists') || error.includes('already registered')) {
      return {
        title: 'Account Already Exists',
        description: 'We found an existing account with this email.',
        icon: <AlertTriangle className="h-10 w-10 text-yellow-600" />,
        variant: 'warning',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-600'
      };
    }
    
    if (error.includes('not verified') || error.includes('verification')) {
      return {
        title: 'Email Not Verified',
        description: 'Your email address needs to be verified.',
        icon: <Info className="h-10 w-10 text-blue-600" />,
        variant: 'info',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-600'
      };
    }

    if (error.includes('expired') || error.includes('invalid token')) {
      return {
        title: 'Session Expired',
        description: 'Your login session has expired.',
        icon: <ShieldAlert className="h-10 w-10 text-orange-600" />,
        variant: 'warning',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-600'
      };
    }

    return {
      title: 'Authentication Failed',
      description: "We couldn't complete your OAuth2 login",
      icon: <XCircle className="h-10 w-10 text-destructive" />,
      variant: 'destructive',
      bgClass: 'bg-destructive/10',
      textClass: 'text-destructive'
    };
  };

  useEffect(() => {
    const error = searchParams.get('error');
    
    // Check if this is an EMAIL_REQUIRED error from GitHub OAuth
    if (error && error.startsWith('EMAIL_REQUIRED:')) {
      const token = error.substring('EMAIL_REQUIRED:'.length);
      setEmailRequired(true);
      setPendingToken(token);
    } else if (error) {
      // If opened in popup, send error to parent and close
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'oauth-error', error },
          window.location.origin
        );
        window.close();
        return;
      }
      
      const details = getErrorDetails(error);

      toast({
        title: details.title,
        description: error || 'There was an error logging in with OAuth2. Please try again.',
        variant: details.variant === 'destructive' ? 'destructive' : 'default',
      });
    }
  }, [searchParams, toast]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!pendingToken) {
      toast({
        title: 'Error',
        description: 'Missing authentication token. Please try logging in again.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    setEmailError('');

    try {
      await oauthService.submitOAuthEmail(pendingToken, email);
      
      setVerificationSent(true);
      
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox to complete registration.',
      });
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete authentication';
      
      if (message.includes('already exists') || message.includes('already registered')) {
        setEmailError('This email is already registered. Please use a different email or login with that account.');
      } else {
        toast({
          title: 'Authentication failed',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-center">
              We sent a verification link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>Click the link in the email to activate your account and log in.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleBackToLogin} className="w-full">
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show email input form for GitHub OAuth when email is required
  if (emailRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Email Required</CardTitle>
            <CardDescription className="text-center">
              Your GitHub account doesn't have a public email.
              Please provide your email address to complete registration.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleEmailSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  required
                  disabled={submitting}
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                This email will be used for your account and to receive notifications.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Sign Up...
                  </>
                ) : (
                  "Complete Sign Up"
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={handleBackToLogin}
                disabled={submitting}
              >
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  const error = searchParams.get('error');
  const details = getErrorDetails(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className={`flex items-center justify-center w-16 h-16 rounded-full ${details.bgClass} mb-4`}>
            {details.icon}
          </div>
          <CardTitle className="text-2xl">
            {details.title}
          </CardTitle>
          <CardDescription>
            {details.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>
            {error || 'An unexpected error occurred during authentication.'}
          </p>
          <p className="mt-2">
            {details.variant === 'warning' 
              ? 'Please log in using your original sign-in method.' 
              : 'Please try again or use a different sign-in method.'}
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
