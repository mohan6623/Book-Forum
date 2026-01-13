import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, User, Camera, Lock, Mail, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { userService } from '@/services/userService';
import ProfileImageCropDialog from '@/components/ProfileImageCropDialog';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { getAuthHeader } from '@/services/authService';

// OAuth Provider Icons (using brand colors)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

interface OAuthProvider {
  provider: string;
  providerId: string;
  createdAt: string;
}

const UserProfile = () => {
  const { user, updateUserData, refreshUser } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [tempSecondaryEmail, setTempSecondaryEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [originalImageSrc, setOriginalImageSrc] = useState<string>('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDisplayNameDialog, setShowDisplayNameDialog] = useState(false);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [showPrimaryEmailDialog, setShowPrimaryEmailDialog] = useState(false);
  const [showSecondaryEmailDialog, setShowSecondaryEmailDialog] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [hasPassword, setHasPassword] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Validation states
  const [usernameValidation, setUsernameValidation] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'>('idle');
  const [emailValidation, setEmailValidation] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'>('idle');
  const [secondaryEmailValidation, setSecondaryEmailValidation] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'>('idle');
  const usernameDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const emailDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const secondaryEmailDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch fresh user data on mount (to get OAuth providers, etc.)
  useEffect(() => {
    refreshUser();
  }, []);

  // Handle OAuth callback query parameters (GitHub-style flow)
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      toast({
        title: 'Success!',
        description: `${connected} account connected successfully.`,
      });
      // Clean up URL
      searchParams.delete('connected');
      setSearchParams(searchParams, { replace: true });
      // Refresh user data to get updated OAuth providers
      refreshUser();
    }

    if (error) {
      toast({
        title: 'Connection failed',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
      // Clean up URL
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, refreshUser]);

  useEffect(() => {
    // Initialize form with user data
    if (user) {
      setEmail(user.email || '');
      setTempEmail(user.email || '');
      setSecondaryEmail((user as any).secondaryEmail || '');
      setTempSecondaryEmail((user as any).secondaryEmail || '');
      setUsername(user.username || '');
      setDisplayName((user as any).name || '');
      
      // Set OAuth providers from user data
      if ((user as any).oauthProviders) {
        const providers = ((user as any).oauthProviders as string[]).map(provider => ({
          provider: provider,
          providerId: 'connected',
          createdAt: new Date().toISOString()
        }));
        setOauthProviders(providers);
      } else {
        // Clear providers if none exist
        setOauthProviders([]);
      }
      
      // Set hasPassword from user data
      if (typeof (user as any).hasPassword === 'boolean') {
        setHasPassword((user as any).hasPassword);
      }
    }
  }, [user]);

  // Validate username availability
  const validateUsername = async (value: string) => {
    if (!value || value.trim().length < 3) {
      setUsernameValidation('invalid');
      return;
    }
    
    if (value === user?.username) {
      setUsernameValidation('idle');
      return;
    }
    
    setUsernameValidation('checking');
    try {
      const isAvailable = await userService.checkUsernameAvailable(value.trim());
      setUsernameValidation(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      setUsernameValidation('invalid');
    }
  };

  // Validate email availability and format
  const validateEmail = async (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!value || !emailRegex.test(value)) {
      setEmailValidation('invalid');
      return;
    }
    
    if (value === user?.email) {
      setEmailValidation('idle');
      return;
    }
    
    setEmailValidation('checking');
    try {
      const isAvailable = await userService.checkEmailAvailable(value.trim());
      setEmailValidation(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      setEmailValidation('invalid');
    }
  };

  // Handle username change with debouncing
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    
    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current);
    }
    
    usernameDebounceRef.current = setTimeout(() => {
      validateUsername(value);
    }, 500);
  };

  // Handle email change with debouncing
  const handleEmailChange = (value: string) => {
    setTempEmail(value);
    
    if (emailDebounceRef.current) {
      clearTimeout(emailDebounceRef.current);
    }
    
    emailDebounceRef.current = setTimeout(() => {
      validateEmail(value);
    }, 500);
  };

  // Handle secondary email change with debouncing
  const handleSecondaryEmailChange = (value: string) => {
    setTempSecondaryEmail(value);
    
    if (secondaryEmailDebounceRef.current) {
      clearTimeout(secondaryEmailDebounceRef.current);
    }
    
    secondaryEmailDebounceRef.current = setTimeout(() => {
      validateSecondaryEmail(value);
    }, 500);
  };

  // Validate secondary email availability and format
  const validateSecondaryEmail = async (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!value) {
      setSecondaryEmailValidation('idle');
      return;
    }
    
    if (!emailRegex.test(value)) {
      setSecondaryEmailValidation('invalid');
      return;
    }
    
    if (value === (user as any)?.secondaryEmail) {
      setSecondaryEmailValidation('idle');
      return;
    }
    
    if (value === user?.email) {
      setSecondaryEmailValidation('invalid');
      return;
    }
    
    setSecondaryEmailValidation('checking');
    try {
      const isAvailable = await userService.checkEmailAvailable(value.trim());
      setSecondaryEmailValidation(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      setSecondaryEmailValidation('invalid');
    }
  };

  // Get validation icon component
  const getValidationIcon = (state: string) => {
    switch (state) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      case 'available':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  // Get validation message
  const getValidationMessage = (field: 'username' | 'email' | 'secondaryEmail', state: string) => {
    if (field === 'username') {
      switch (state) {
        case 'checking': return 'Checking availability...';
        case 'available': return 'Username is available';
        case 'unavailable': return 'Username is already taken';
        case 'invalid': return 'Username must be at least 3 characters';
        default: return '';
      }
    } else if (field === 'secondaryEmail') {
      switch (state) {
        case 'checking': return 'Checking availability...';
        case 'available': return 'Email is available';
        case 'unavailable': return 'Email is already registered';
        case 'invalid': return 'Please enter a valid email address';
        default: return '';
      }
    } else {
      switch (state) {
        case 'checking': return 'Checking availability...';
        case 'available': return 'Email is available';
        case 'unavailable': return 'Email is already registered';
        case 'invalid': return 'Please enter a valid email address';
        default: return '';
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImageSrc(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
    setImageFile(file);
    const url = URL.createObjectURL(croppedBlob);
    setPreviewUrl(url);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleEmailUpdate = async () => {
    // Check validation state
    if (emailValidation !== 'available' && emailValidation !== 'idle') {
      toast({
        title: 'Invalid email',
        description: getValidationMessage('email', emailValidation),
        variant: 'destructive',
      });
      return;
    }
    
    if (!tempEmail || tempEmail === user?.email) {
      toast({
        title: 'No changes',
        description: 'Email address is unchanged.',
        variant: 'destructive',
      });
      return;
    }

    if (!tempEmail.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const userId = user?.id;
      if (!userId || userId === 0) {
        throw new Error('Missing user id');
      }

      await userService.updateUser(userId, { email: tempEmail } as any);
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your email to verify your new address.',
      });
      
      setEmail(tempEmail);
      setShowPrimaryEmailDialog(false);
    } catch (error) {
      toast({
        title: 'Failed to update email',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSecondaryEmailUpdate = async () => {
    // Check validation state
    if (tempSecondaryEmail && secondaryEmailValidation !== 'available' && secondaryEmailValidation !== 'idle') {
      toast({
        title: 'Invalid email',
        description: getValidationMessage('secondaryEmail', secondaryEmailValidation),
        variant: 'destructive',
      });
      return;
    }
    
    if (tempSecondaryEmail === (user as any)?.secondaryEmail) {
      toast({
        title: 'No changes',
        description: 'Secondary email is unchanged.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const userId = user?.id;
      if (!userId || userId === 0) {
        throw new Error('Missing user id');
      }

      await userService.updateUser(userId, { secondaryEmail: tempSecondaryEmail || null } as any);
      
      toast({
        title: 'Success!',
        description: tempSecondaryEmail ? 'Secondary email updated successfully.' : 'Secondary email removed.',
      });
      
      setSecondaryEmail(tempSecondaryEmail);
      setShowSecondaryEmailDialog(false);
    } catch (error) {
      toast({
        title: 'Failed to update secondary email',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordDialogOpen = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordDialog(true);
  };

  const handleDisplayNameDialogOpen = () => {
    setDisplayName((user as any)?.name || '');
    setShowDisplayNameDialog(true);
  };

  const handleUsernameDialogOpen = () => {
    setUsername(user?.username || '');
    setUsernameValidation('idle');
    setShowUsernameDialog(true);
  };

  const handlePrimaryEmailDialogOpen = () => {
    setTempEmail(user?.email || '');
    setEmailValidation('idle');
    setShowPrimaryEmailDialog(true);
  };

  const handleSecondaryEmailDialogOpen = () => {
    setTempSecondaryEmail((user as any)?.secondaryEmail || '');
    setSecondaryEmailValidation('idle');
    setShowSecondaryEmailDialog(true);
  };

  // OAuth Connect Handler
  const handleOAuthConnect = async (provider: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OAUTH_CONNECT(provider)}`, {
        method: 'GET',
        headers: {
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Authentication required',
            description: 'Please log in to connect OAuth providers.',
            variant: 'destructive',
          });
          return;
        }
        throw new Error('Failed to initiate OAuth connection');
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('OAuth connect error:', error);
      toast({
        title: 'Connection failed',
        description: 'Unable to connect to OAuth provider. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // OAuth Disconnect Handler
  const handleOAuthDisconnect = async (providerName: string) => {
    const provider = providerName.toUpperCase();
    
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OAUTH_DISCONNECT(provider)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.code === 'LAST_AUTH_METHOD') {
          toast({
            title: 'Cannot remove last login method',
            description: 'Please set a password before disconnecting your last OAuth provider.',
            variant: 'destructive',
          });
        } else {
          throw new Error(errorData.error || 'Failed to disconnect OAuth provider');
        }
        return;
      }

      // Remove the provider from local state
      setOauthProviders(prev => prev.filter(p => p.provider !== provider));
      
      toast({
        title: 'Success',
        description: `${providerName} account disconnected successfully.`,
      });
    } catch (error) {
      console.error('OAuth disconnect error:', error);
      toast({
        title: 'Disconnection failed',
        description: 'Unable to disconnect OAuth provider. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordUpdate = async () => {
    // Validate passwords
    if (hasPassword && !oldPassword) {
      toast({
        title: 'Old password required',
        description: 'Please enter your current password.',
        variant: 'destructive',
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          oldPassword: hasPassword ? oldPassword : undefined,
          password: newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      toast({
        title: 'Success!',
        description: hasPassword ? 'Password updated successfully.' : 'Password set successfully.',
      });
      
      setShowPasswordDialog(false);
      setHasPassword(true); // User now has a password
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Failed to update password',
        description: hasPassword ? 'Please check your old password and try again.' : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check validation state
    if (username !== user?.username && usernameValidation !== 'available' && usernameValidation !== 'idle') {
      toast({
        title: 'Invalid username',
        description: getValidationMessage('username', usernameValidation),
        variant: 'destructive',
      });
      return;
    }
    
    if ((!username || username === user?.username) && (!displayName || displayName === (user as any)?.name)) {
      toast({
        title: 'No changes',
        description: 'Profile information is unchanged.',
        variant: 'destructive',
      });
      return;
    }

    const userId = user?.id;
    if (!userId || userId === 0) {
      toast({
        title: 'Unable to update profile',
        description: 'Missing user id. Please re-login or contact support.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {};
      if (username && username !== user?.username) {
        updateData.username = username.trim();
      }
      if (displayName && displayName !== (user as any)?.name) {
        updateData.name = displayName.trim();
      }

      const updatedUser = await userService.updateUser(
        userId,
        updateData,
        imageFile || undefined
      );
      
      // Update the user context with the returned data
      updateUserData({
        username: updatedUser.username,
        imageData: updatedUser.imageData,
      });
      
      toast({
        title: 'Success!',
        description: 'Profile updated successfully.',
      });
      
      setImageFile(null);
      setPreviewUrl('');
      setShowDisplayNameDialog(false);
      setShowUsernameDialog(false);
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Profile Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewUrl || user?.imageData} />
                  <AvatarFallback className="text-2xl">
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user?.username || 'User'}</h2>
                <p className="text-muted-foreground">{user?.email || 'No email'}</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Profile Information Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
            <CardDescription>Your username and display name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Display Name */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-muted-foreground text-xs">Display Name</Label>
                <p className="text-sm font-medium mt-1">{(user as any)?.name || 'Not set'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisplayNameDialogOpen}>
                Edit
              </Button>
            </div>

            {/* Username */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-muted-foreground text-xs">Username</Label>
                <p className="text-sm font-medium mt-1">@{user?.username || 'Not set'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleUsernameDialogOpen}>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Email</CardTitle>
            <CardDescription>Email addresses for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Primary Email */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-muted-foreground text-xs">Primary Email</Label>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  {user?.email || 'Not set'}
                  {!hasPassword && oauthProviders.length > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Managed by {oauthProviders.map(p => p.provider.charAt(0) + p.provider.slice(1).toLowerCase()).join(', ')}
                    </span>
                  )}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handlePrimaryEmailDialogOpen}>
                Edit
              </Button>
            </div>

            {/* Secondary Email */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-muted-foreground text-xs">Secondary Email</Label>
                <p className="text-sm font-medium mt-1">{(user as any)?.secondaryEmail || 'Not set'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSecondaryEmailDialogOpen}>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Login Methods Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Login methods</CardTitle>
            <CardDescription>Link additional accounts for backup access and easier sign-in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Google OAuth */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <GoogleIcon />
                <span className="text-sm">Google {oauthProviders.some(p => p.provider === 'GOOGLE') ? 'Connected' : ''}</span>
              </div>
              {!oauthProviders.some(p => p.provider === 'GOOGLE') ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOAuthConnect('google')}
                >
                  Connect
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleOAuthDisconnect('Google')}
                >
                  Remove
                </Button>
              )}
            </div>

            {/* GitHub OAuth */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <GitHubIcon />
                <span className="text-sm">GitHub {oauthProviders.some(p => p.provider === 'GITHUB') ? 'Connected' : ''}</span>
              </div>
              {!oauthProviders.some(p => p.provider === 'GITHUB') ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOAuthConnect('github')}
                >
                  Connect
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleOAuthDisconnect('GitHub')}
                >
                  Remove
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card id="password-section" className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Password</CardTitle>
            <CardDescription>
              {hasPassword ? 'Change your account password' : 'Set a password for your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Password</span>
              </div>
              <Button 
                onClick={handlePasswordDialogOpen}
                variant="outline"
                size="sm"
              >
                {hasPassword ? 'Change password' : 'Set password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hasPassword ? 'Change Password' : 'Set Password'}</DialogTitle>
            <DialogDescription>
              {hasPassword ? 'Enter your current and new password' : 'Create a password for your account'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="old-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="old-password"
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dialog-new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="dialog-new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="dialog-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePasswordUpdate}
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {hasPassword ? 'Updating...' : 'Setting...'}
                </>
              ) : (
                hasPassword ? 'Update Password' : 'Set Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Display Name Edit Dialog */}
      <Dialog open={showDisplayNameDialog} onOpenChange={setShowDisplayNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Display Name</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-displayName">Display Name</Label>
              <Input
                id="dialog-displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDisplayNameDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUsernameUpdate}
              disabled={loading || displayName === (user as any)?.name}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Username Edit Dialog */}
      <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Username</DialogTitle>
            <DialogDescription>
              Must be at least 3 characters and unique
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-username">Username</Label>
              <div className="relative">
                <Input
                  id="dialog-username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Enter your username"
                  disabled={loading}
                  className="pr-8"
                />
                {username !== user?.username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getValidationIcon(usernameValidation)}
                  </div>
                )}
              </div>
              {username !== user?.username && usernameValidation !== 'idle' && (
                <p className={`text-xs ${
                  usernameValidation === 'available' ? 'text-green-500' : 
                  usernameValidation === 'unavailable' ? 'text-red-500' : 
                  usernameValidation === 'invalid' ? 'text-orange-500' : 'text-muted-foreground'
                }`}>
                  {getValidationMessage('username', usernameValidation)}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUsernameDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUsernameUpdate}
              disabled={loading || username === user?.username || (username !== user?.username && usernameValidation !== 'available')}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Primary Email Edit Dialog */}
      <Dialog open={showPrimaryEmailDialog} onOpenChange={setShowPrimaryEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Primary Email</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-email">Primary Email</Label>
              <div className="relative">
                <Input
                  id="dialog-email"
                  value={tempEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading || (!hasPassword && oauthProviders.length > 0)}
                  className={`pr-8 ${!hasPassword && oauthProviders.length > 0 ? 'bg-muted/30' : ''}`}
                />
                {tempEmail !== user?.email && hasPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getValidationIcon(emailValidation)}
                  </div>
                )}
              </div>
              {!hasPassword && oauthProviders.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Managed by {oauthProviders.map(p => p.provider.charAt(0) + p.provider.slice(1).toLowerCase()).join(', ')}
                </p>
              )}
              {tempEmail !== user?.email && emailValidation !== 'idle' && hasPassword && (
                <p className={`text-xs ${
                  emailValidation === 'available' ? 'text-green-500' : 
                  emailValidation === 'unavailable' ? 'text-red-500' : 
                  emailValidation === 'invalid' ? 'text-orange-500' : 'text-muted-foreground'
                }`}>
                  {getValidationMessage('email', emailValidation)}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPrimaryEmailDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEmailUpdate}
              disabled={loading || 
                tempEmail === user?.email || 
                (!hasPassword && oauthProviders.length > 0) ||
                (tempEmail !== user?.email && hasPassword && emailValidation !== 'available')}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secondary Email Edit Dialog */}
      <Dialog open={showSecondaryEmailDialog} onOpenChange={setShowSecondaryEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Secondary Email</DialogTitle>
            <DialogDescription>Optional - for notifications</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-secondaryEmail">Secondary Email</Label>
              <div className="relative">
                <Input
                  id="dialog-secondaryEmail"
                  value={tempSecondaryEmail}
                  onChange={(e) => handleSecondaryEmailChange(e.target.value)}
                  placeholder="Add a secondary email"
                  disabled={loading}
                  className="pr-8"
                />
                {tempSecondaryEmail !== (user as any)?.secondaryEmail && tempSecondaryEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getValidationIcon(secondaryEmailValidation)}
                  </div>
                )}
              </div>
              {tempSecondaryEmail !== (user as any)?.secondaryEmail && secondaryEmailValidation !== 'idle' && (
                <p className={`text-xs ${
                  secondaryEmailValidation === 'available' ? 'text-green-500' : 
                  secondaryEmailValidation === 'unavailable' ? 'text-red-500' : 
                  secondaryEmailValidation === 'invalid' ? 'text-orange-500' : 'text-muted-foreground'
                }`}>
                  {getValidationMessage('secondaryEmail', secondaryEmailValidation)}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSecondaryEmailDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSecondaryEmailUpdate}
              disabled={loading || 
                tempSecondaryEmail === (user as any)?.secondaryEmail ||
                (tempSecondaryEmail && tempSecondaryEmail !== (user as any)?.secondaryEmail && secondaryEmailValidation !== 'available' && secondaryEmailValidation !== 'idle')}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProfileImageCropDialog
        open={showCropDialog}
        onClose={() => setShowCropDialog(false)}
        imageSrc={originalImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default UserProfile;
