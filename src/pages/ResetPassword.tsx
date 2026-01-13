import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { emailService } from '@/services/emailService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookIcon, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  // Validate token on page load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidating(false);
        setTokenValid(false);
        return;
      }

      try {
        const isValid = await emailService.validateResetToken(token);
        setTokenValid(isValid);
      } catch {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Password strength validation
  const passwordStrength = useMemo(() => {
    const pw = password || '';
    const lengthOk = pw.length >= 8 && pw.length <= 60;
    const upperOk = /[A-Z]/.test(pw);
    const lowerOk = /[a-z]/.test(pw);
    const numberOk = /\d/.test(pw);
    const specialOk = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw);
    const score = [lengthOk, upperOk, lowerOk, numberOk, specialOk].filter(Boolean).length;

    let label = '';
    let color = 'text-muted-foreground';
    
    if (pw.length > 0) {
      if (score <= 2) {
        label = 'Weak';
        color = 'text-destructive';
      } else if (score === 3) {
        label = 'Medium';
        color = 'text-orange-600';
      } else if (score >= 4) {
        label = 'Strong';
        color = 'text-green-600';
      }
    }

    return { label, color, lengthOk, upperOk, lowerOk, numberOk, specialOk };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: 'Invalid Link',
        description: 'The reset link is invalid or has expired.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8 || password.length > 60) {
      toast({
        title: 'Invalid Password Length',
        description: 'Password must be between 8 and 60 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordStrength.upperOk || !passwordStrength.lowerOk || !passwordStrength.numberOk || !passwordStrength.specialOk) {
      toast({
        title: 'Password Requirements Not Met',
        description: 'Password must contain uppercase, lowercase, number, and special character.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await emailService.resetPassword({
        token,
        password: password,
      });
      
      setSuccess(true);
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now login.',
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      toast({
        title: 'Reset Failed',
        description: error.message || 'Failed to reset password. The link may have expired.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while validating token
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-2" />
            <CardTitle className="text-2xl">Validating Link</CardTitle>
            <CardDescription>
              Please wait while we verify your reset link...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <XCircle className="h-12 w-12 text-destructive mb-2" />
            <CardTitle className="text-2xl">Invalid Link</CardTitle>
            <CardDescription>
              The password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link to="/forgot-password">Request New Link</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
            <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been successfully reset. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <BookIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Book Forum</h1>
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
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
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Password Strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className={passwordStrength.lengthOk ? 'text-green-600' : 'text-muted-foreground'}>
                      {passwordStrength.lengthOk ? '✓' : '○'} 8-60 characters
                    </div>
                    <div className={passwordStrength.upperOk ? 'text-green-600' : 'text-muted-foreground'}>
                      {passwordStrength.upperOk ? '✓' : '○'} One uppercase letter
                    </div>
                    <div className={passwordStrength.lowerOk ? 'text-green-600' : 'text-muted-foreground'}>
                      {passwordStrength.lowerOk ? '✓' : '○'} One lowercase letter
                    </div>
                    <div className={passwordStrength.numberOk ? 'text-green-600' : 'text-muted-foreground'}>
                      {passwordStrength.numberOk ? '✓' : '○'} One number
                    </div>
                    <div className={passwordStrength.specialOk ? 'text-green-600' : 'text-muted-foreground'}>
                      {passwordStrength.specialOk ? '✓' : '○'} One special character
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Remember your password?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Back to Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
