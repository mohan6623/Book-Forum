import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { User, Loader2, AlertCircle, CheckCircle2, BookIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { oauthService } from '@/services/oauthService';
import { userService } from '@/services/userService';
import ThemeToggle from '@/components/ThemeToggle';

// Decode JWT payload (base64url encoded)
function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Base64url decode
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const OAuthCompleteRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleOAuth2Login } = useAuth();
  
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [provider, setProvider] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setPendingToken(token);
      
      // Decode token to extract OAuth data for pre-filling
      const payload = decodeJwtPayload(token);
      if (payload) {
        const name = payload.name || '';
        const suggestedUsername = payload.suggestedUsername || '';
        const providerName = payload.provider || 'OAuth';
        
        setDisplayName(name);
        setUsername(suggestedUsername);
        setProvider(providerName);
      }
    } else {
      toast({
        title: 'Error',
        description: 'No pending token found.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [searchParams, navigate, toast]);

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.trim().length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const ok = await userService.checkUsernameAvailable(username.trim());
        setUsernameAvailable(ok);
        
        if (!ok) {
          setUsernameError('This username is already taken');
        } else {
          setUsernameError('');
        }
      } catch (error) {
        console.error('Username availability check failed:', error);
        // On error, allow user to proceed (will be validated on server)
        setUsernameAvailable(null);
        setUsernameError('');
      } finally {
        setCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [username]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      username.trim().length >= 3 &&
      usernameAvailable === true &&
      !checkingUsername
    );
  }, [username, usernameAvailable, checkingUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (usernameAvailable === false) {
      setUsernameError('This username is already taken');
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
    setUsernameError('');

    try {
      const response = await oauthService.completeRegistration(
        pendingToken, 
        username.trim(), 
        displayName.trim() || undefined
      );
      
      // Use the handleOAuth2Login to set the token and user
      handleOAuth2Login(response.token);

      toast({
        title: 'Welcome!',
        description: 'Your account has been created successfully.',
      });

      // Redirect to home
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Failed to complete registration';
      
      if (errorMessage.includes('USERNAME_TAKEN') || errorMessage.includes('already taken')) {
        setUsernameError('This username is already taken');
      } else if (errorMessage.includes('ACCOUNT_EXISTS')) {
        toast({
          title: 'Account Exists',
          description: 'An account with this email already exists. Please login instead.',
          variant: 'destructive',
        });
        navigate('/login');
      } else {
        toast({
          title: 'Registration Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: 'oauth-cancel' },
        window.location.origin
      );
      window.close();
    } else {
      navigate('/login');
    }
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
          <CardTitle className="text-2xl">Complete Registration</CardTitle>
          <CardDescription>
            Choose your username and display name to complete your {provider} sign-up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  className="pl-9 pr-9"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    if (usernameError) setUsernameError('');
                  }}
                  disabled={submitting}
                />
                {checkingUsername && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!checkingUsername && usernameAvailable === true && username.length >= 3 && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
                {!checkingUsername && usernameAvailable === false && username.length >= 3 && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                )}
              </div>
              {usernameError && (
                <div className="flex items-center text-sm text-destructive mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {usernameError}
                </div>
              )}
              {!usernameError && username.length > 0 && username.length < 3 && (
                <p className="text-sm text-muted-foreground">Username must be at least 3 characters</p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (optional)</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="How you want to be called"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={submitting}
              />
              <p className="text-sm text-muted-foreground">
                This is the name others will see. Leave empty to use your username.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting || !isFormValid}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
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
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OAuthCompleteRegistration;
