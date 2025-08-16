import { ethers } from 'ethers';

// Monad Testnet Configuration
export const MONAD_TESTNET = {
  chainId: 10143,
  hexChainId: '0x279f',
  chainName: 'Monad Testnet (dev0x)',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18
  },
  rpcUrls: ['https://dev0x-rpc.monad.xyz'],
  blockExplorerUrls: ['https://dev0x.monad.xyz'],
  faucetUrl: 'https://dev0x-faucet.monad.xyz'
};

// Check if MetaMask is available
export const isMetaMaskAvailable = () => {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined' && 
         window.ethereum.isMetaMask;
};

// Get the current network
export const getCurrentNetwork = async () => {
  if (!isMetaMaskAvailable()) return null;
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting network:', error);
    return null;
  }
};

// Check if current network is Monad testnet
export const isMonadTestnet = async () => {
  const currentChainId = await getCurrentNetwork();
  return currentChainId === MONAD_TESTNET.chainId;
};

// Add Monad testnet to MetaMask
export const addMonadTestnet = async () => {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: MONAD_TESTNET.hexChainId,
        chainName: MONAD_TESTNET.chainName,
        nativeCurrency: MONAD_TESTNET.nativeCurrency,
        rpcUrls: MONAD_TESTNET.rpcUrls,
        blockExplorerUrls: MONAD_TESTNET.blockExplorerUrls
      }]
    });
    return true;
  } catch (error) {
    console.error('Error adding Monad testnet:', error);
    throw error;
  }
};

// Switch to Monad testnet
export const switchToMonadTestnet = async () => {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // First try to switch to existing network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_TESTNET.hexChainId }]
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await addMonadTestnet();
        return true;
      } catch (addError) {
        throw addError;
      }
    } else {
      throw switchError;
    }
  }
};

// Connect wallet and ensure it's on Monad testnet
export const connectWallet = async () => {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found. Please check MetaMask.');
    }

    const walletAddress = accounts[0];

    // Check if on correct network
    const isOnMonad = await isMonadTestnet();
    if (!isOnMonad) {
      // Attempt to switch to Monad testnet
      await switchToMonadTestnet();
    }

    // Get balance
    const balance = await getBalance(walletAddress);

    return {
      address: walletAddress,
      balance,
      chainId: MONAD_TESTNET.chainId
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

// Get wallet balance
export const getBalance = async (address) => {
  if (!isMetaMaskAvailable()) return '0';

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
};

// Sign message for authentication
export const signMessage = async (message, address) => {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address]
    });
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

// Listen for account changes
export const onAccountsChanged = (callback) => {
  if (!isMetaMaskAvailable()) return;

  window.ethereum.on('accountsChanged', callback);
  
  // Return cleanup function
  return () => {
    if (window.ethereum.removeListener) {
      window.ethereum.removeListener('accountsChanged', callback);
    }
  };
};

// Listen for network changes
export const onChainChanged = (callback) => {
  if (!isMetaMaskAvailable()) return;

  window.ethereum.on('chainChanged', (chainId) => {
    callback(parseInt(chainId, 16));
  });
  
  // Return cleanup function
  return () => {
    if (window.ethereum.removeListener) {
      window.ethereum.removeListener('chainChanged', callback);
    }
  };
};

// Get transaction details
export const getTransactionDetails = (txHash) => {
  return `${MONAD_TESTNET.blockExplorerUrls[0]}/tx/${txHash}`;
};

// Open faucet in new tab
export const openFaucet = () => {
  window.open(MONAD_TESTNET.faucetUrl, '_blank');
};

// Format address for display
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Validate if string is valid Ethereum address
export const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};