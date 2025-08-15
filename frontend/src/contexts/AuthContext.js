import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth';
import { useToast } from '../hooks/use-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
            
            // Refresh user data from API
            try {
              const updatedUser = await authService.getProfile();
              setUser(updatedUser);
              localStorage.setItem('moangem_user', JSON.stringify(updatedUser));
            } catch (error) {
              console.log('Could not refresh user data, using cached data');
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      // For demo purposes, use mock wallet connection
      // In production, integrate with MetaMask or other wallet providers
      const { user: newUser, token } = await authService.mockWalletConnect();
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      toast({
        title: "Wallet Connected!",
        description: `Welcome ${newUser.username || 'Player'}! Your wallet has been connected successfully.`,
      });
      
      return newUser;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Wallet Disconnected",
      description: "You have been logged out successfully.",
    });
  };

  const updateUserStats = (newStats) => {
    if (user) {
      const updatedUser = { ...user, ...newStats };
      setUser(updatedUser);
      localStorage.setItem('moangem_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    connectWallet,
    logout,
    updateUserStats
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};