
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DbUser } from '../types';
import { db } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUserCompany: (companyId: string, companyName: string) => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for persisted session
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem('erp_session_user');
        if (storedUser) {
          // Verify user still exists in "users" DB
          const parsed = JSON.parse(storedUser);
          const dbUser = db.findUserByEmail(parsed.email);
          if (dbUser) {
            // Strip password hash before setting state
            const { passwordHash, ...safeUser } = dbUser;
            setUser(safeUser);
            // Initialize Database Connection if companyId exists
            if (safeUser.companyId) {
               db.setDatabase(safeUser.companyId);
            }
          } else {
            localStorage.removeItem('erp_session_user');
          }
        }
      } catch (e) {
        console.error("Session restoration failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API

      const dbUser = db.findUserByEmail(email);
      
      if (!dbUser) {
        throw new Error('Invalid email or password');
      }

      // Mock Password Verification (In real app, use bcrypt)
      // Google users might not have password hash if they haven't set one, skip check if provider is google
      if (dbUser.provider === 'email' && dbUser.passwordHash && password && dbUser.passwordHash !== password) {
         throw new Error('Invalid email or password');
      }

      const { passwordHash, ...safeUser } = dbUser;
      
      // Initialize Context if Company Exists
      if (safeUser.companyId) {
          db.setDatabase(safeUser.companyId);
      } else {
          // Ensure DB context is null so settings page knows no data is loaded
          db.setDatabase(null);
      }

      setUser(safeUser);
      localStorage.setItem('erp_session_user', JSON.stringify(safeUser));
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate Google Popup
      
      // Simulate a Google User email
      const googleEmail = "google_user@gmail.com";
      let dbUser = db.findUserByEmail(googleEmail);
      
      // If user doesn't exist, create them in "users" DB (Sign Up flow via Google)
      if (!dbUser) {
        dbUser = db.createUser({
          name: 'Google User',
          email: googleEmail,
          role: 'admin',
          avatar: 'https://lh3.googleusercontent.com/a/default-user',
          provider: 'google',
          googleId: 'g_123456789',
          companyId: null,
          companyName: null
        });
      }

      const { passwordHash, ...safeUser } = dbUser;
      
      if (safeUser.companyId) {
          db.setDatabase(safeUser.companyId);
      } else {
          db.setDatabase(null);
      }

      setUser(safeUser);
      localStorage.setItem('erp_session_user', JSON.stringify(safeUser));
    } catch (err: any) {
      setError(err.message || 'Google Auth failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const existing = db.findUserByEmail(email);
      if (existing) {
        throw new Error('Email already in use');
      }

      // Create User in "users" DB only. DO NOT Log in.
      db.createUser({
        name,
        email,
        role: 'admin', 
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        provider: 'email',
        passwordHash: password,
        companyId: null, 
        companyName: null,
      });

      // No setUser here. User must login.
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    db.setDatabase(null); // Clear context
    localStorage.removeItem('erp_session_user');
  };

  const updateUserCompany = (companyId: string, companyName: string) => {
      if (user) {
          // Update local state
          const updatedUser = { ...user, companyId, companyName };
          setUser(updatedUser);
          localStorage.setItem('erp_session_user', JSON.stringify(updatedUser));
          
          // Set Context
          db.setDatabase(companyId);
      }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, updateUserCompany, isLoading, error }}>
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
