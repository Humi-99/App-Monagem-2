import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Wallet, Trophy, Settings, User, Coins, Menu, X, Network, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

const Header = ({ onWalletConnect, onProfileClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, connectWallet, logout, isLoading } = useAuth();
  const wallet = useWallet();

  const handleWalletConnect = async () => {
    if (isAuthenticated) {
      logout();
    } else {
      try {
        await connectWallet();
        if (onWalletConnect) {
          onWalletConnect(true);
        }
      } catch (error) {
        console.error('Wallet connection failed:', error);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#200052] border-b border-[#836EF9]/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#836EF9] to-[#A0055D] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MoanGem</h1>
              <p className="text-[#FBFAF9] text-xs">Crypto Gaming Platform</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" className="text-[#FBFAF9] hover:text-white hover:bg-[#836EF9]/20">
              Games
            </Button>
            <Button variant="ghost" className="text-[#FBFAF9] hover:text-white hover:bg-[#836EF9]/20">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
            <Button variant="ghost" className="text-[#FBFAF9] hover:text-white hover:bg-[#836EF9]/20">
              Challenges
            </Button>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user && (
              <Card className="hidden md:flex items-center space-x-3 bg-[#836EF9]/10 border-[#836EF9]/30 px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-[#A0055D]" />
                  <span className="text-white font-semibold">{user.total_score || 0}</span>
                </div>
                <div className="w-px h-4 bg-[#836EF9]/50"></div>
                <Badge variant="secondary" className="bg-[#A0055D] text-white">
                  Level {user.level || 1}
                </Badge>
                {wallet.isConnected && (
                  <>
                    <div className="w-px h-4 bg-[#836EF9]/50"></div>
                    <div className="flex items-center space-x-1">
                      <Network className={`w-3 h-3 ${wallet.isOnMonadTestnet ? 'text-green-400' : 'text-orange-400'}`} />
                      <span className="text-xs text-[#FBFAF9]">
                        {parseFloat(wallet.balance).toFixed(2)} MON
                      </span>
                    </div>
                  </>
                )}
              </Card>
            )}

            <Button
              onClick={handleWalletConnect}
              disabled={isLoading}
              className={`
                px-6 py-2 rounded-lg font-semibold transition-all duration-300
                ${isAuthenticated 
                  ? 'bg-[#A0055D] hover:bg-[#A0055D]/80 text-white' 
                  : 'bg-[#836EF9] hover:bg-[#836EF9]/80 text-white'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isLoading ? 'Connecting...' : isAuthenticated ? 'Connected' : 'Connect Wallet'}
            </Button>

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onProfileClick}
                className="text-[#FBFAF9] hover:text-white hover:bg-[#836EF9]/20"
              >
                <User className="w-5 h-5" />
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[#FBFAF9] hover:text-white hover:bg-[#836EF9]/20"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-[#836EF9]/20">
            <nav className="flex flex-col space-y-2 mt-4">
              <Button variant="ghost" className="text-[#FBFAF9] hover:text-white hover:bg-[#836EF9]/20 justify-start">
                Games
              </Button>
              <Button variant="ghost" className="text-[#FBFAF9] hover:text-white hover:bg-[#836EF9]/20 justify-start">
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
              <Button variant="ghost" className="text-[#FBFAF9] hover:text-white hover:bg-[#836EF9]/20 justify-start">
                Challenges
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;