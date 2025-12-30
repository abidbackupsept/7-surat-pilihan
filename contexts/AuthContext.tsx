import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  password: string | null;
  userIP: string | null;
  authenticate: (password: string) => boolean;
  setPassword: (password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPasswordState] = useState<string | null>(null);
  const [userIP, setUserIP] = useState<string | null>(null);
  const DEFAULT_PASSWORD = '081234';

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    let savedPassword = localStorage.getItem('appPassword');
    
    // Set default password if no password exists
    if (!savedPassword) {
      savedPassword = DEFAULT_PASSWORD;
      localStorage.setItem('appPassword', DEFAULT_PASSWORD);
    }
    
    setPasswordState(savedPassword);
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    
    // Get user IP
    fetchUserIP();
  }, []);

  const fetchUserIP = async () => {
    try {
      // Using a free IP API service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIP(data.ip);
    } catch (error) {
      console.error('Error fetching IP:', error);
      setUserIP('Unknown');
    }
  };

  const authenticate = (inputPassword: string): boolean => {
    const savedPassword = localStorage.getItem('appPassword');
    
    if (savedPassword && inputPassword === savedPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    
    return false;
  };

  const setPassword = (newPassword: string) => {
    setPasswordState(newPassword);
    localStorage.setItem('appPassword', newPassword);
    
    // If password is set for the first time, authenticate automatically
    if (!localStorage.getItem('isAuthenticated')) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      password,
      userIP,
      authenticate,
      setPassword,
      logout
    }}>
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