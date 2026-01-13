import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { oauthService } from '@/services/oauthService';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

const OAuthEmailRequired = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setPendingToken(token);
    } else {
      toast({
        title: 'Error',
        description: 'No pending token found.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [searchParams, navigate, toast]);

  // Debounced email availability check
  useEffect(() => {
    if (!email || !validateEmail(email)) {
      setEmailAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AVAILABLE_MAIL(email)}`);
        const data = await response.json();
        setEmailAvailable(data.available);
        
        if (!data.available) {
          setEmailError('An account with this email already exists');
        } else {
          setEmailError('');
        }
      } catch (error) {
        console.error('Email availability check failed:', error);
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [email]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check email availability before submitting
    if (emailAvailable === false) {
      setEmailError('An account with this email already exists. Please use a different email.');
      return;
    }

    if (!pendingToken) {
      toast({
        title: 'Error',
        description: 'Session expired. Please try logging in again.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setEmailError('');

    try {
      await oauthService.submitOAuthEmail(pendingToken, email);
      
      // If opened in popup, send message to parent and close
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'oauth-verification-sent', email },
          window.location.origin
        );
        window.close();
        return;
      }

      setSuccess(true);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox to verify your email and complete registration.',
      });
    } catch (error: any) {
      console.error('Email submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit email';
      
      if (errorMessage.includes('ACCOUNT_EXISTS')) {
        setEmailError('An account with this email already exists. Please login with that account.');
      } else {
        setEmailError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{email}</strong>.
              <br />
              Please click the link to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Required</CardTitle>
          <CardDescription>
            Your GitHub account doesn't have a public email. Please provide one to complete registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-9 pr-9"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  disabled={submitting}
                />
                {checkingEmail && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!checkingEmail && emailAvailable === true && validateEmail(email) && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
                {!checkingEmail && emailAvailable === false && validateEmail(email) && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                )}
              </div>
              {emailError && (
                <div className="flex items-center text-sm text-destructive mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {emailError}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting || emailAvailable === false || checkingEmail}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="link" 
            onClick={() => {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage(
                  { type: 'oauth-cancel' },
                  window.location.origin
                );
                window.close();
              } else {
                navigate('/login');
              }
            }} 
            disabled={submitting}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OAuthEmailRequired;
