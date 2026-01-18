import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle2, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { oauthService } from '@/services/oauthService';
import { userService } from '@/services/userService';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

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

// Generate username from name/email
function generateUsername(name: string | null, email: string): string {
  const base = name && name.trim()
    ? name.toLowerCase().replace(/[^a-z0-9]/g, '')
    : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return base.length < 3 ? 'user' + base : base;
}

const OAuthEmailRequired = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Step management (1 = email, 2 = username/display name)
  const [step, setStep] = useState(1);
  
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [oauthName, setOauthName] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setPendingToken(token);
      
      // Decode token to extract OAuth name for pre-filling
      const payload = decodeJwtPayload(token);
      if (payload) {
        const name = payload.name || null;
        setOauthName(name);
        // Pre-fill display name from OAuth provider
        if (name) {
          setDisplayName(name);
        }
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
        
        // Backend returns 200 for available, 409 for taken (no JSON body)
        if (response.ok) {
          setEmailAvailable(true);
          setEmailError('');
        } else {
          // Non-200 response means email is taken or error
          setEmailAvailable(false);
          setEmailError('An account with this email already exists');
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

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Check if step 1 is valid (email)
  const isStep1Valid = useMemo(() => {
    return (
      validateEmail(email) &&
      emailAvailable === true &&
      !checkingEmail
    );
  }, [email, emailAvailable, checkingEmail]);

  // Check if step 2 is valid (username + display name)
  const isStep2Valid = useMemo(() => {
    return (
      username.trim().length >= 3 &&
      usernameAvailable === true &&
      !checkingUsername
    );
  }, [username, usernameAvailable, checkingUsername]);

  const handleNextStep = () => {
    if (isStep1Valid) {
      // Generate username suggestion when moving to step 2
      if (!username) {
        const suggestedUsername = generateUsername(oauthName, email);
        setUsername(suggestedUsername);
      }
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNextStep();
      return;
    }

    // Step 2 validation
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
    setEmailError('');
    setUsernameError('');

    try {
      await oauthService.submitOAuthEmail(pendingToken, email, username.trim(), displayName.trim() || undefined);
      
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
          <CardTitle>Complete Registration</CardTitle>
          <CardDescription>
            {step === 1 
              ? "Your GitHub account doesn't have a public email. Please provide one to continue."
              : "Choose your username and display name"
            }
          </CardDescription>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 2</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                {/* Step 1: Email */}
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
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!isStep1Valid || checkingEmail}
                >
                  <span>Continue</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {/* Step 2: Username and Display Name */}
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

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handlePreviousStep}
                    disabled={submitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={submitting || !isStep2Valid}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </Button>
                </div>
              </>
            )}
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
