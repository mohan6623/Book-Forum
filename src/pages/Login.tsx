import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookIcon, Loader2, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { API_BASE_URL } from '@/config/api';
import { Separator } from '@/components/ui/separator';
import { emailService } from '@/services/emailService';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, handleOAuth2Login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = (location.state as any)?.from || '/';

  // Email verification state
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // OAuth popup state
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailNotVerified(false);
    setShowResendForm(false);
    setResendSuccess(false);

    try {
      await login(username, password);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      const errorMessage = error?.message || '';
      
      // Check if it's an email not verified error
      if (errorMessage.toLowerCase().includes('email not verified') || 
          errorMessage.toLowerCase().includes('not verified')) {
        setEmailNotVerified(true);
        toast({
          title: 'Email not verified',
          description: 'Please verify your email before logging in.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login failed',
          description: 'Invalid username or password. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

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

  const startOAuthLogin = (provider: 'google' | 'github') => {
    setOauthLoading(true);
    const oauthUrl = `${API_BASE_URL}/oauth2/authorization/${provider}`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity cursor-pointer">
            <BookIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Book Forum</h1>
          </Link>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
            
            <div className="relative w-full">
              <Separator className="my-4" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => startOAuthLogin('google')}
                disabled={loading || oauthLoading}
                className="w-full"
              >
                {oauthLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => startOAuthLogin('github')}
                disabled={loading || oauthLoading}
                className="w-full"
              >
                {oauthLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Forgot your password?{' '}
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                Reset it here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Email Verification Dialog */}
      <Dialog open={emailNotVerified} onOpenChange={setEmailNotVerified}>
        <DialogContent className="sm:max-w-md">
          {!showResendForm && !resendSuccess ? (
            <>
              <DialogHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mx-auto mb-4">
                  <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <DialogTitle className="text-center">Email Not Verified</DialogTitle>
                <DialogDescription className="text-center">
                  Your email address has not been verified yet. Please check your inbox for the verification link.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={() => setShowResendForm(true)}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailNotVerified(false);
                    setShowResendForm(false);
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </>
          ) : showResendForm && !resendSuccess ? (
            <>
              <DialogHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-center">Resend Verification Email</DialogTitle>
                <DialogDescription className="text-center">
                  Enter your email address to receive a new verification link.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleResendVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verifyEmail">Email Address</Label>
                  <Input
                    id="verifyEmail"
                    type="email"
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    disabled={resending}
                    required
                  />
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowResendForm(false);
                      setResendEmail('');
                    }}
                    disabled={resending}
                    className="w-full sm:w-auto"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={resending || !resendEmail.trim()} className="w-full sm:w-auto">
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Link'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mx-auto mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <DialogTitle className="text-center">Verification Email Sent!</DialogTitle>
                <DialogDescription className="text-center">
                  Check your inbox for the verification link. Once verified, come back and log in.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setEmailNotVerified(false);
                    setResendSuccess(false);
                    setShowResendForm(false);
                    setResendEmail('');
                  }}
                  className="w-full"
                >
                  Got it
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
