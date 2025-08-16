import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  AlertTriangle, 
  CheckCircle,
  Droplet,
  Network
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const WalletConnection = () => {
  const wallet = useWallet();
  const auth = useAuth();
  const { toast } = useToast();

  const handleCopyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleConnect = async () => {
    try {
      await auth.connectWallet();
    } catch (error) {
      // Error handling is done in AuthContext
      console.error('Connection failed:', error);
    }
  };

  if (!wallet.isMetaMaskAvailable) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            MetaMask Required
          </CardTitle>
          <CardDescription>
            Install MetaMask to connect your wallet and start gaming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-800">MetaMask not detected</span>
          </div>
          <Button 
            onClick={() => window.open('https://metamask.io', '_blank')}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Install MetaMask
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!wallet.isConnected || !auth.isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your MetaMask wallet to Monad Testnet and start gaming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Network className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">Monad Testnet (dev0x)</span>
          </div>
          <Button 
            onClick={handleConnect}
            disabled={wallet.isLoading || auth.isLoading}
            className="w-full bg-gradient-to-r from-[#836EF9] to-[#A0055D] hover:from-[#836EF9]/80 hover:to-[#A0055D]/80"
          >
            {wallet.isLoading || auth.isLoading ? (
              'Connecting...'
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
          <div className="text-xs text-gray-600 text-center">
            Make sure you're connected to Monad Testnet. We'll help you add it if needed.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Wallet Connected
        </CardTitle>
        <CardDescription>
          Connected to Monad Testnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              {wallet.isOnMonadTestnet ? 'Monad Testnet' : 'Wrong Network'}
            </span>
          </div>
          {!wallet.isOnMonadTestnet && (
            <Button
              size="sm"
              variant="outline"
              onClick={wallet.switchToMonad}
              className="text-xs"
            >
              Switch Network
            </Button>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Wallet Address</label>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
            <span className="text-sm font-mono flex-1 truncate">{wallet.formattedAddress}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyAddress}
              className="h-6 w-6 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">MON Balance</label>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg font-mono">
              {parseFloat(wallet.balance).toFixed(4)} MON
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={wallet.updateBalance}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={wallet.openFaucet}
            className="flex-1"
          >
            <Droplet className="w-4 h-4 mr-2" />
            Get Testnet MON
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={auth.logout}
            className="flex-1"
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnection;