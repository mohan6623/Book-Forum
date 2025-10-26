import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, JwtResponse, getToken, clearToken } from '@/services/authService';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: JwtResponse['user'] | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface JwtPayload {
  sub: string;
  role?: string;
  exp: number;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<JwtResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = getToken();
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        // Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          // Try to extract an id from common JWT fields: `id`, `userId`, or numeric `sub`
          let extractedId: number | undefined;
          if ((decoded as any).id) extractedId = Number((decoded as any).id);
          else if ((decoded as any).userId) extractedId = Number((decoded as any).userId);
          else if (!isNaN(Number(decoded.sub))) extractedId = Number(decoded.sub);

          setUser({
              id: extractedId,
              username: decoded.sub,
              role: decoded.role,
            });
        } else {
          clearToken();
        }
      } catch (error) {
        console.error('Invalid token:', error);
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authService.login({ username, password });
    // Prefer to use the JWT claims as the source-of-truth for role and id
    const token = getToken();
    if (token) {
      try {
        const decoded = jwtDecode<any>(token);
        let extractedId: number | undefined;
        if (decoded.id) extractedId = Number(decoded.id);
        else if (decoded.userId) extractedId = Number(decoded.userId);
        else if (!isNaN(Number(decoded.sub))) extractedId = Number(decoded.sub);

        const respUser: any = response.user as any;
        const normalizedUser = {
          id: extractedId ?? respUser?.id,
          username: respUser?.username ?? respUser?.name ?? decoded.sub ?? respUser?.email,
          role: decoded.role ?? respUser?.role,
          email: respUser?.email,
          imageData: respUser?.imageData,
        };
        setUser(normalizedUser as any);
      } catch (e) {
        // fallback to response user if token can't be decoded
        const respUser: any = response.user as any;
        setUser({
          id: respUser.id,
          username: respUser.username ?? respUser.name ?? respUser.email,
          role: respUser.role,
          email: respUser.email,
          imageData: respUser.imageData,
        } as any);
      }
    } else {
      // no token — fallback
      const respUser: any = response.user as any;
      setUser({
        id: respUser.id,
        username: respUser.username ?? respUser.name ?? respUser.email,
        role: respUser.role,
        email: respUser.email,
        imageData: respUser.imageData,
      } as any);
    }
  };

  const register = async (username: string, email: string, password: string, role: string = 'USER') => {
    await authService.register({ username, password, role });
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAuthenticated = !!user;
  // Normalize role so it matches whether backend returns 'ADMIN' or 'ROLE_ADMIN'
  const normalizedRole = user?.role ? (user.role.startsWith('ROLE_') ? user.role.substring(5) : user.role) : undefined;
  const isAdmin = normalizedRole === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
