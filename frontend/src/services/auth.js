import api from './api';

class AuthService {
  // Connect wallet and authenticate
  async connectWallet(walletAddress, signature = null) {
    try {
      const response = await api.post('/auth/connect-wallet', {
        address: walletAddress,
        signature: signature
      });
      
      const { user, token } = response.data;
      
      // Store token and user data
      localStorage.setItem('moangem_token', token);
      localStorage.setItem('moangem_user', JSON.stringify(user));
      
      return { user, token };
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to connect wallet');
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get profile');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('moangem_token');
    const user = localStorage.getItem('moangem_user');
    return !!(token && user);
  }

  // Get stored user data
  getStoredUser() {
    const userData = localStorage.getItem('moangem_user');
    return userData ? JSON.parse(userData) : null;
  }

  // Get stored token
  getStoredToken() {
    return localStorage.getItem('moangem_token');
  }

  // Logout user
  logout() {
    localStorage.removeItem('moangem_token');
    localStorage.removeItem('moangem_user');
  }

  // Mock wallet connection for demo (generates random address)
  async mockWalletConnect() {
    const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
    return this.connectWallet(mockAddress);
  }
}

export default new AuthService();