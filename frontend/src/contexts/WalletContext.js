import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import * as wallet from '../utils/wallet';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);
  const { toast } = useToast();

  // Check MetaMask availability on mount
  useEffect(() => {
    const checkMetaMask = () => {
      const available = wallet.isMetaMaskAvailable();
      setIsMetaMaskAvailable(available);
      
      if (!available) {
        console.log('MetaMask not detected');
      }
    };

    checkMetaMask();
    
    // Check periodically in case MetaMask is installed after page load
    const interval = setInterval(checkMetaMask, 1000);
    
    // Cleanup after 10 seconds
    setTimeout(() => clearInterval(interval), 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isMetaMaskAvailable) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        // User disconnected
        handleDisconnect();
      } else if (accounts[0] !== address) {
        // Account changed
        setAddress(accounts[0]);
        await updateBalance(accounts[0]);
      }
    };

    const handleChainChanged = async (newChainId) => {
      setChainId(newChainId);
      
      if (newChainId === wallet.MONAD_TESTNET.chainId) {
        toast({
          title: "Network Switched",
          description: "Successfully connected to Monad Testnet!",
        });
        
        // Update balance for new network
        if (address) {
          await updateBalance(address);
        }
      } else if (isConnected) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Monad Testnet for full functionality.",
          variant: "destructive",
        });
      }
    };

    // Set up listeners
    const removeAccountsListener = wallet.onAccountsChanged(handleAccountsChanged);
    const removeChainListener = wallet.onChainChanged(handleChainChanged);

    // Cleanup function
    return () => {
      if (removeAccountsListener) removeAccountsListener();
      if (removeChainListener) removeChainListener();
    };
  }, [isMetaMaskAvailable, address, isConnected, toast]);

  // Update balance
  const updateBalance = async (walletAddress) => {
    try {
      const newBalance = await wallet.getBalance(walletAddress);
      setBalance(newBalance);
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  // Connect wallet
  const connect = async () => {
    if (!isMetaMaskAvailable) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      const walletData = await wallet.connectWallet();
      
      setIsConnected(true);
      setAddress(walletData.address);
      setBalance(walletData.balance);
      setChainId(walletData.chainId);

      toast({
        title: "Wallet Connected!",
        description: `Connected to ${wallet.formatAddress(walletData.address)} on Monad Testnet`,
      });

      return walletData;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      let errorMessage = 'Failed to connect wallet. Please try again.';
      
      if (error.message.includes('User rejected')) {
        errorMessage = 'Connection cancelled. Please approve the connection to continue.';
      } else if (error.message.includes('MetaMask is not installed')) {
        errorMessage = 'Please install MetaMask to connect your wallet.';
      } else if (error.code === 4902) {
        errorMessage = 'Please allow adding Monad Testnet to your wallet.';
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress('');
    setBalance('0');
    setChainId(null);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  // Switch to Monad testnet
  const switchToMonad = async () => {
    if (!isMetaMaskAvailable) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to switch networks.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      await wallet.switchToMonadTestnet();
      
      toast({
        title: "Network Switched",
        description: "Successfully switched to Monad Testnet!",
      });
      
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      
      let errorMessage = 'Failed to switch network. Please try again.';
      
      if (error.code === 4902) {
        errorMessage = 'Please allow adding Monad Testnet to your wallet.';
      } else if (error.message.includes('User rejected')) {
        errorMessage = 'Network switch cancelled.';
      }

      toast({
        title: "Switch Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if on correct network
  const isOnMonadTestnet = () => {
    return chainId === wallet.MONAD_TESTNET.chainId;
  };

  // Sign message
  const signMessage = async (message) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      return await wallet.signMessage(message, address);
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  };

  // Open faucet
  const openFaucet = () => {
    wallet.openFaucet();
  };

  const value = {
    // State
    isConnected,
    address,
    balance,
    chainId,
    isLoading,
    isMetaMaskAvailable,
    
    // Computed values
    formattedAddress: wallet.formatAddress(address),
    isOnMonadTestnet: isOnMonadTestnet(),
    
    // Actions
    connect,
    disconnect: handleDisconnect,
    switchToMonad,
    signMessage,
    updateBalance: () => updateBalance(address),
    openFaucet,
    
    // Utilities
    formatAddress: wallet.formatAddress,
    getTransactionDetails: wallet.getTransactionDetails,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};