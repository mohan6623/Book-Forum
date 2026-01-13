import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { emailService } from '@/services/emailService';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookIcon, CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshAuth } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  
  // Resend verification state
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    // Prevent double execution in React Strict Mode
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verifyEmail = async () => {
      try {
        const result = await emailService.verifyEmail(token);
        
        if (result.success) {
          setStatus('success');
          setUsername(result.jwtResponse?.user?.username || null);
          setMessage('Your email has been successfully verified! You are now logged in.');
          
          // Refresh auth context to pick up the new token
          if (result.jwtResponse?.token) {
            refreshAuth();
          }
          
          toast({
            title: 'Email Verified',
            description: 'Welcome! Your account is now active.',
          });
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Verification failed. The link may have expired or is invalid.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
        toast({
          title: 'Verification Failed',
          description: 'Please try again or contact support.',
          variant: 'destructive',
        });
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast, refreshAuth]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setResending(true);
    try {
      await emailService.resendVerification(resendEmail.trim());
      setResendSuccess(true);
      toast({
        title: 'Email sent!',
        description: 'A new verification link has been sent to your email.',
      });
    } catch (error) {
      toast({
        title: 'Failed to send',
        description: 'Could not send verification email. Please check your email address.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <BookIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Book Forum</h1>
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your email address...'}
            {status === 'success' && 'Verification successful!'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 py-8">
          {status === 'loading' && (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="h-16 w-16 text-destructive" />
          )}
          <p className="text-center text-muted-foreground">{message}</p>
          {status === 'success' && username && (
            <p className="text-center font-medium">Welcome, {username}!</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {status === 'success' && (
            <Button asChild className="w-full">
              <Link to="/">Go to Home</Link>
            </Button>
          )}
          {status === 'error' && !resendSuccess && (
            <div className="w-full space-y-4">
              {!showResendForm ? (
                <>
                  <Button 
                    onClick={() => setShowResendForm(true)} 
                    className="w-full"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </Button>
                  <div className="flex gap-2 w-full">
                    <Button asChild variant="outline" className="flex-1">
                      <Link to="/register">Register</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link to="/login">Login</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleResendVerification} className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resendEmail">Email Address</Label>
                    <Input
                      id="resendEmail"
                      type="email"
                      placeholder="Enter your registered email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      disabled={resending}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowResendForm(false)}
                      disabled={resending}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={resending} className="flex-1">
                      {resending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Link'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
          {status === 'error' && resendSuccess && (
            <div className="w-full space-y-4 text-center">
              <div className="flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mr-2" />
                <span className="text-green-600 font-medium">Email sent!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Check your inbox for the new verification link.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail;
