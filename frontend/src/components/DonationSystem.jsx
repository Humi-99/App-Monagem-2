import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { 
  Heart, 
  Send, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Gift,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

const DonationSystem = () => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [donationStats, setDonationStats] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  
  const wallet = useWallet();
  const auth = useAuth();
  const { toast } = useToast();

  // Contract address (your smart contract)
  const CONTRACT_ADDRESS = "0xC443647582B1484f9Aba3A6C0B98df59918E17e2";

  useEffect(() => {
    fetchDonationStats();
  }, []);

  useEffect(() => {
    if (amount && wallet.address && parseFloat(amount) > 0) {
      estimateGas();
    }
  }, [amount, wallet.address]);

  const fetchDonationStats = async () => {
    try {
      const response = await api.get('/donations/stats');
      setDonationStats(response.data);
      setRecentDonations(response.data.recent_donations || []);
    } catch (error) {
      console.error('Error fetching donation stats:', error);
    }
  };

  const estimateGas = async () => {
    if (!wallet.address || !amount || parseFloat(amount) <= 0) return;
    
    try {
      const response = await api.get('/donations/estimate-gas', {
        params: {
          amount: parseFloat(amount),
          donor_address: wallet.address
        }
      });
      setGasEstimate(response.data);
    } catch (error) {
      console.error('Error estimating gas:', error);
      setGasEstimate(null);
    }
  };

  const handleDonate = async () => {
    if (!wallet.isConnected || !auth.isAuthenticated) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to make a donation.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    if (!wallet.isOnMonadTestnet) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Monad Testnet to make donations.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create donation request
      const donationRequest = {
        amount: parseFloat(amount),
        donor_address: wallet.address,
        message: message.trim()
      };

      // Process donation on backend
      const response = await api.post('/donations/create', donationRequest);
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      // Send transaction through wallet
      const amountWei = (parseFloat(amount) * Math.pow(10, 18)).toString();
      
      const txParams = {
        to: CONTRACT_ADDRESS,
        from: wallet.address,
        value: '0x' + BigInt(amountWei).toString(16),
        gas: '0x5208', // 21000 in hex
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      // Confirm donation with transaction hash
      await api.post(`/donations/confirm/${txHash}`);

      toast({
        title: "Donation Submitted!",
        description: `Thank you for your ${amount} MON donation! Transaction: ${txHash.slice(0, 10)}...`,
      });

      // Reset form
      setAmount('');
      setMessage('');
      
      // Refresh stats
      setTimeout(fetchDonationStats, 2000);
      
      // Monitor transaction
      monitorTransaction(txHash);

    } catch (error) {
      console.error('Donation failed:', error);
      toast({
        title: "Donation Failed",
        description: error.message || "An error occurred while processing your donation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const monitorTransaction = async (txHash) => {
    const checkStatus = async () => {
      try {
        const response = await api.get(`/donations/status/${txHash}`);
        const status = response.data.blockchain_status?.status;
        
        if (status === 'confirmed') {
          toast({
            title: "Donation Confirmed!",
            description: "Your donation has been confirmed on the blockchain.",
          });
          fetchDonationStats();
        } else if (status === 'failed') {
          toast({
            title: "Transaction Failed",
            description: "Your donation transaction failed. Please try again.",
            variant: "destructive",
          });
        } else if (status === 'pending') {
          // Check again in 5 seconds
          setTimeout(checkStatus, 5000);
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    };
    
    // Start monitoring
    setTimeout(checkStatus, 2000);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(4);
  };

  const openBlockExplorer = (txHash) => {
    if (txHash) {
      window.open(`https://dev0x.monad.xyz/tx/${txHash}`, '_blank');
    }
  };

  if (!wallet.isConnected || !auth.isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Support MoanGem Platform
          </CardTitle>
          <CardDescription>
            Connect your wallet to make a donation and support the development of MoanGem gaming platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Your donations help us maintain and improve the gaming experience for everyone.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Please connect your wallet to proceed with donations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Donation Stats */}
      {donationStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{formatAmount(donationStats.total_donations)} MON</p>
                  <p className="text-sm text-gray-600">Total Donations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{donationStats.donation_count}</p>
                  <p className="text-sm text-gray-600">Total Donors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm font-bold">
                    {donationStats.top_donor ? formatAddress(donationStats.top_donor) : 'No donors yet'}
                  </p>
                  <p className="text-sm text-gray-600">Top Donor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Donation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Make a Donation
          </CardTitle>
          <CardDescription>
            Support the MoanGem platform development. All donations go directly to: {formatAddress(CONTRACT_ADDRESS)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Network Warning */}
          {!wallet.isOnMonadTestnet && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                Please switch to Monad Testnet to make donations.
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={wallet.switchToMonad}
                className="ml-auto"
              >
                Switch Network
              </Button>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Donation Amount (MON)</label>
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.0001"
              className="text-lg"
            />
            <div className="flex gap-2 mt-2">
              {['1', '5', '10', '25'].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset)}
                  className="flex-1"
                >
                  {preset} MON
                </Button>
              ))}
            </div>
          </div>

          {/* Gas Estimate */}
          {gasEstimate && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center text-sm">
                <span>Estimated Gas Fee:</span>
                <span className="font-mono">{gasEstimate.total_fee_mon?.toFixed(6)} MON</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Your Balance:</span>
                <span className="font-mono">{gasEstimate.user_balance_mon?.toFixed(4)} MON</span>
              </div>
              {!gasEstimate.sufficient_balance && (
                <div className="mt-2 text-sm text-red-600">
                  ⚠️ Insufficient balance for transaction + gas fees
                </div>
              )}
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message (Optional)</label>
            <Textarea
              placeholder="Leave a message with your donation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <div className="text-xs text-gray-500">{message.length}/200 characters</div>
          </div>

          {/* Donate Button */}
          <Button
            onClick={handleDonate}
            disabled={
              isLoading || 
              !amount || 
              parseFloat(amount) <= 0 || 
              !wallet.isOnMonadTestnet ||
              (gasEstimate && !gasEstimate.sufficient_balance)
            }
            className="w-full bg-gradient-to-r from-[#836EF9] to-[#A0055D] hover:from-[#836EF9]/80 hover:to-[#A0055D]/80"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Donate {amount || '0'} MON
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Donations */}
      {recentDonations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Donations</CardTitle>
            <CardDescription>Latest contributions to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDonations.slice(0, 5).map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#836EF9] to-[#A0055D] rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{formatAddress(donation.donor_address)}</p>
                      <p className="text-sm text-gray-600">
                        {donation.message || 'Anonymous donation'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatAmount(donation.amount)} MON</p>
                    {donation.transaction_hash && (
                      <button
                        onClick={() => openBlockExplorer(donation.transaction_hash)}
                        className="text-xs text-blue-600 hover:underline flex items-center"
                      >
                        View <ExternalLink className="w-3 h-3 ml-1" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DonationSystem;