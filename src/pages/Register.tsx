import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookIcon, CheckCircle2, Loader2, XCircle, Eye, EyeOff, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/userService';
import ThemeToggle from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { API_BASE_URL } from '@/config/api';
import { emailService } from '@/services/emailService';

const Register = () => {
  // Step management (1 = email/password, 2 = username/display name)
  const [step, setStep] = useState(1);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Derived validation states
  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordTooLong = password.length > 60;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0, arrowOffset: 0 });
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Password strength and criteria (8-60 chars, at least one uppercase, one lowercase, one number, one special character)
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
    let barCount = 0; // How many bars to light up
    let barColor = ''; // Color for the lit bars
    
    if (pw.length > 0) {
      if (score <= 2) {
        label = 'Weak';
        color = 'text-destructive';
        barCount = 1;
        barColor = 'bg-red-500';
      } else if (score === 3) {
        label = 'Medium';
        color = 'text-orange-600';
        barCount = 2;
        barColor = 'bg-orange-500';
      } else if (score === 4) {
        label = 'Good';
        color = 'text-green-600';
        barCount = 3;
        barColor = 'bg-green-500';
      } else if (score === 5) {
        label = 'Strong';
        color = 'text-green-600';
        barCount = 4;
        barColor = 'bg-green-500';
      }
    }

    return { label, color, lengthOk, upperOk, lowerOk, numberOk, specialOk, barCount, barColor } as const;
  }, [password]);

  const [pwPopoverOpen, setPwPopoverOpen] = useState(false);
  const pwWrapperRef = useRef<HTMLDivElement | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to update popover position based on cursor location
  const updatePopoverPosition = useCallback(() => {
    const input = passwordInputRef.current;
    const card = cardRef.current;
    if (!input || !card) return;

    const inputRect = input.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cursorPosition = input.selectionStart || 0;
    
    // Use a more accurate method to measure cursor position
    // Create a hidden div that mimics the input styling
    const mirror = document.createElement('div');
    const computedStyle = window.getComputedStyle(input);
    
    // Copy all relevant styles
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre';
    mirror.style.font = computedStyle.font;
    mirror.style.fontSize = computedStyle.fontSize;
    mirror.style.fontFamily = computedStyle.fontFamily;
    mirror.style.fontWeight = computedStyle.fontWeight;
    mirror.style.letterSpacing = computedStyle.letterSpacing;
    mirror.style.padding = '0';
    mirror.style.border = 'none';
    
    // For password input, use bullets if showing dots
    const displayValue = input.type === 'password' 
      ? '•'.repeat(cursorPosition) 
      : input.value.substring(0, cursorPosition);
    
    mirror.textContent = displayValue || '';
    document.body.appendChild(mirror);
    
    const textWidth = mirror.getBoundingClientRect().width;
    document.body.removeChild(mirror);
    
    // Calculate cursor position (account for padding and scroll)
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const scrollLeft = input.scrollLeft || 0;
    const cursorX = inputRect.left + paddingLeft + textWidth - scrollLeft;
    
    // Popover dimensions
    const popoverWidth = 256; // w-64 = 16rem = 256px
    const popoverPadding = 16; // padding from card edges
    
    // Calculate ideal popover left position (centered on cursor)
    let popoverLeft = cursorX - (popoverWidth / 2);
    
    // Constrain within card boundaries
    const minLeft = cardRect.left + popoverPadding;
    const maxLeft = cardRect.right - popoverWidth - popoverPadding;
    
    // Clamp the position
    popoverLeft = Math.max(minLeft, Math.min(popoverLeft, maxLeft));
    
    // Calculate arrow offset from center (how far the arrow needs to move)
    const popoverCenter = popoverLeft + (popoverWidth / 2);
    let arrowOffset = cursorX - popoverCenter;
    
    // Constrain arrow within popover bounds (leave some margin for the arrow width)
    const arrowMargin = 12; // Distance from popover edge
    const maxArrowOffset = (popoverWidth / 2) - arrowMargin;
    arrowOffset = Math.max(-maxArrowOffset, Math.min(arrowOffset, maxArrowOffset));
    
    const y = inputRect.top;
    
    setPopoverPosition({ x: popoverLeft, y, arrowOffset });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8 || password.length > 60) {
      toast({
        title: 'Invalid password length',
        description: 'Password must be between 8 and 60 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordStrength.upperOk || !passwordStrength.lowerOk || !passwordStrength.numberOk || !passwordStrength.specialOk) {
      toast({
        title: 'Password requirements not met',
        description: 'Password must contain uppercase, lowercase, number, and special character.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await register(username.trim(), email.trim(), password, displayName.trim() || undefined);
      setRegisteredEmail(email.trim());
      setRegistrationSuccess(true);
      toast({
        title: 'Registration successful!',
        description: 'Please check your email to verify your account.',
      });
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: 'Username or email might already exist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    
    setResendingEmail(true);
    try {
      await emailService.resendVerification(registeredEmail);
      toast({
        title: 'Email Sent',
        description: 'Verification email has been resent to your inbox.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resend',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setResendingEmail(false);
    }
  };

  // Simple debounce utility with cleanup
  const debounce = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    return () => clearTimeout(id);
  };

  // Update popover position on scroll or resize
  useEffect(() => {
    if (pwPopoverOpen) {
      const handleUpdate = () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
          updatePopoverPosition();
        }, 10);
      };
      
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
      };
    }
  }, [pwPopoverOpen, updatePopoverPosition]);

  // Validate username availability (debounced)
  useEffect(() => {
    setUsernameAvailable(null);
    if (!username || username.trim().length < 3) {
      setCheckingUsername(false);
      return;
    }
    setCheckingUsername(true);
    return debounce(async () => {
      const ok = await userService.checkUsernameAvailable(username.trim());
      setUsernameAvailable(ok);
      setCheckingUsername(false);
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Basic email regex for format check
  const emailValid = useMemo(() => {
    const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    return re.test(email.trim());
  }, [email]);

  // Validate email availability (debounced)
  useEffect(() => {
    setEmailAvailable(null);
    if (!email || !emailValid) {
      setCheckingEmail(false);
      return;
    }
    setCheckingEmail(true);
    return debounce(async () => {
      const ok = await userService.checkEmailAvailable(email.trim());
      setEmailAvailable(ok);
      setCheckingEmail(false);
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, emailValid]);

  const canSubmit =
    !loading &&
    username.trim().length >= 3 &&
    emailValid &&
    password.length >= 8 &&
    password.length <= 60 &&
    passwordStrength.upperOk &&
    passwordStrength.lowerOk &&
    passwordStrength.numberOk &&
    passwordStrength.specialOk &&
    password === confirmPassword &&
    usernameAvailable === true &&
    emailAvailable === true &&
    !checkingUsername &&
    !checkingEmail;

  // Check if step 1 is valid (email + password)
  const isStep1Valid = useMemo(() => {
    return (
      emailValid &&
      emailAvailable === true &&
      !checkingEmail &&
      password.length >= 8 &&
      password.length <= 60 &&
      passwordStrength.upperOk &&
      passwordStrength.lowerOk &&
      passwordStrength.numberOk &&
      passwordStrength.specialOk &&
      password === confirmPassword
    );
  }, [emailValid, emailAvailable, checkingEmail, password, confirmPassword, passwordStrength]);

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
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  // Show success screen after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to
            </CardDescription>
            <p className="font-medium text-primary">{registeredEmail}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in your email to verify your account and get started.
              The link will expire in 24 hours.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="w-full"
              >
                {resendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
              <Link to="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Didn't receive the email? Check your spam folder or try resending.
            </p>
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
      <Card ref={cardRef} className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity cursor-pointer">
            <BookIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Book Forum</h1>
          </Link>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            {step === 1 ? 'Enter your email and create a password' : 'Choose your username and display name'}
          </CardDescription>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 2</p>
        </CardHeader>
        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
          <CardContent className="space-y-4">
            {step === 1 ? (
              <>
                {/* Step 1: Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                  {email && (
                    <div className="h-5 text-xs flex items-center gap-1">
                      {!emailValid ? (
                        <span className="text-destructive">Invalid email format</span>
                      ) : checkingEmail ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-muted-foreground">Checking availability…</span>
                        </>
                      ) : emailAvailable === true ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">Email available</span>
                        </>
                      ) : emailAvailable === false ? (
                        <>
                          <XCircle className="h-3 w-3 text-destructive" />
                          <span className="text-destructive">Email already in use</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  ref={passwordInputRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Choose a password"
                  className="pr-10"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Debounce the position update to prevent flickering
                    if (updateTimeoutRef.current) {
                      clearTimeout(updateTimeoutRef.current);
                    }
                    updateTimeoutRef.current = setTimeout(() => {
                      updatePopoverPosition();
                    }, 10);
                  }}
                  onFocus={(e) => {
                    setPwPopoverOpen(true);
                    setTimeout(() => updatePopoverPosition(), 0);
                  }}
                  onBlur={() => setPwPopoverOpen(false)}
                  onKeyUp={() => {
                    // Debounce keyup updates
                    if (updateTimeoutRef.current) {
                      clearTimeout(updateTimeoutRef.current);
                    }
                    updateTimeoutRef.current = setTimeout(() => {
                      updatePopoverPosition();
                    }, 10);
                  }}
                  onClick={() => {
                    setTimeout(() => updatePopoverPosition(), 0);
                  }}
                  required
                  disabled={loading}
                  minLength={8}
                  maxLength={60}
                />
                {/* Custom positioned popover */}
                {pwPopoverOpen && (
                  <div
                    className="fixed z-50 w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
                    style={{
                      left: `${popoverPosition.x}px`,
                      top: `${popoverPosition.y - 10}px`,
                      transform: 'translateY(-100%)',
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Password strength</span>
                        <span className={passwordStrength.color + ' font-medium'}>{passwordStrength.label}</span>
                      </div>
                      {/* 4-part bar indicator */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              bar <= passwordStrength.barCount
                                ? passwordStrength.barColor
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <ul className="space-y-1 text-xs">
                        <li className="flex items-center gap-1.5">
                          {passwordStrength.lengthOk ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                          )}
                          <span className={passwordStrength.lengthOk ? 'text-green-700' : 'text-muted-foreground'}>
                            8-60 characters
                          </span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          {passwordStrength.upperOk ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                          )}
                          <span className={passwordStrength.upperOk ? 'text-green-700' : 'text-muted-foreground'}>
                            One capital letter
                          </span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          {passwordStrength.lowerOk ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                          )}
                          <span className={passwordStrength.lowerOk ? 'text-green-700' : 'text-muted-foreground'}>
                            One small letter
                          </span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          {passwordStrength.numberOk ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                          )}
                          <span className={passwordStrength.numberOk ? 'text-green-700' : 'text-muted-foreground'}>
                            One number
                          </span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          {passwordStrength.specialOk ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                          )}
                          <span className={passwordStrength.specialOk ? 'text-green-700' : 'text-muted-foreground'}>
                            One special character
                          </span>
                        </li>
                      </ul>
                    </div>
                    {/* Arrow pointing to cursor */}
                    <div
                      className="absolute bottom-0 left-1/2 translate-y-full"
                      style={{ 
                        width: 0, 
                        height: 0,
                        transform: `translateX(calc(-50% + ${popoverPosition.arrowOffset}px))`
                      }}
                    >
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-popover" />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-muted-foreground hover:text-foreground z-10"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {/* Helper status for password */}
              {password && (
                <div className="text-xs space-y-1" aria-live="polite">
                  {passwordTooShort && (
                    <div className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-3 w-3 flex-shrink-0" />
                      <span>Password must be at least 8 characters</span>
                    </div>
                  )}
                  {passwordTooLong && (
                    <div className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-3 w-3 flex-shrink-0" />
                      <span>Password must be 60 characters or less</span>
                    </div>
                  )}
                  {!passwordTooShort && !passwordTooLong && (
                    <>
                      {!passwordStrength.upperOk && (
                        <div className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3 flex-shrink-0" />
                          <span>Missing: One capital letter (A-Z)</span>
                        </div>
                      )}
                      {!passwordStrength.lowerOk && (
                        <div className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3 flex-shrink-0" />
                          <span>Missing: One small letter (a-z)</span>
                        </div>
                      )}
                      {!passwordStrength.numberOk && (
                        <div className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3 flex-shrink-0" />
                          <span>Missing: One number (0-9)</span>
                        </div>
                      )}
                      {!passwordStrength.specialOk && (
                        <div className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3 flex-shrink-0" />
                          <span>Missing: One special character (!@#$%...)</span>
                        </div>
                      )}
                      {passwordStrength.barCount === 4 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                          <span>Strong password - all requirements met!</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* strength meter moved to popover */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="pr-10"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  maxLength={60}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {/* Helper status for confirm password */}
              {confirmPassword && (
                <div className="h-5 text-xs flex items-center gap-1" aria-live="polite">
                  {passwordsMismatch ? (
                    <>
                      <XCircle className="h-3 w-3 text-destructive" />
                      <span className="text-destructive">Passwords do not match</span>
                    </>
                  ) : password.length >= 8 ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>
              </>
            ) : (
              <>
                {/* Step 2: Username and Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                  {username && (
                    <div className="h-5 text-xs flex items-center gap-1">
                      {checkingUsername ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-muted-foreground">Checking availability…</span>
                        </>
                      ) : username.trim().length < 3 ? (
                        <span className="text-muted-foreground">At least 3 characters</span>
                      ) : usernameAvailable === true ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">Username available</span>
                        </>
                      ) : usernameAvailable === false ? (
                        <>
                          <XCircle className="h-3 w-3 text-destructive" />
                          <span className="text-destructive">Username already taken</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">
                    Display Name <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="How should we call you?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be shown on your profile. Leave blank to use your username.
                  </p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {step === 1 ? (
              <>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!isStep1Valid}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
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
                    onClick={() => window.location.href = `${API_BASE_URL}/oauth2/authorization/google`}
                    className="w-full"
                  >
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
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = `${API_BASE_URL}/oauth2/authorization/github`}
                    className="w-full"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-3 w-full">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={loading}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={loading || !isStep2Valid}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
