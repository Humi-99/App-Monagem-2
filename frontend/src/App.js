import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import GameCard from "./components/GameCard";
import SnakeGame from "./components/SnakeGame";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import gamesService from "./services/games";
import challengesService from "./services/challenges";
import { Trophy, Target, Calendar, Zap, Users, Gamepad2 } from "lucide-react";

const Home = () => {
  const [currentView, setCurrentView] = useState('home');
  const [selectedGame, setSelectedGame] = useState(null);
  const [games, setGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [platformStats, setPlatformStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all data in parallel
        const [gamesData, leaderboardData, challengesData, statsData] = await Promise.all([
          gamesService.getGames(),
          gamesService.getGlobalLeaderboard(5),
          challengesService.getDailyChallenges(),
          challengesService.getPlatformStats()
        ]);
        
        setGames(gamesData);
        setLeaderboard(leaderboardData);
        setChallenges(challengesData);
        setPlatformStats(statsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePlayGame = (game) => {
    if (game.name === 'Snake Game') {
      setCurrentView('snake');
      setSelectedGame(game);
    } else {
      // For other games, show coming soon message
      alert(`${game.name} is coming soon! Stay tuned for updates.`);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedGame(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#200052] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#836EF9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading MoanGem...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'snake') {
    return <SnakeGame onBack={handleBackToHome} game={selectedGame} />;
  }

  return (
    <div className="min-h-screen bg-[#200052]">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#836EF9]/20 to-[#A0055D]/20 blur-3xl"></div>
            <div className="relative z-10">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
                Moan<span className="text-[#836EF9]">Gem</span>
              </h1>
              <p className="text-xl text-[#FBFAF9] mb-8 max-w-2xl mx-auto">
                The ultimate crypto gaming platform featuring engaging mini-games with blockchain rewards and NFT collectibles
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge className="bg-[#836EF9] text-white px-4 py-2 text-sm">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  7 Unique Games
                </Badge>
                <Badge className="bg-[#A0055D] text-white px-4 py-2 text-sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  Global Leaderboards
                </Badge>
                <Badge className="bg-purple-600 text-white px-4 py-2 text-sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Crypto Rewards
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Games */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Featured Games</h2>
            <Button variant="outline" className="border-[#836EF9] text-[#836EF9] hover:bg-[#836EF9]/10">
              View All Games
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                onPlayClick={handlePlayGame}
              />
            ))}
          </div>
        </section>

        {/* Stats and Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Daily Challenges */}
          <Card className="bg-[#200052]/50 border-[#836EF9]/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="w-5 h-5 mr-2 text-[#A0055D]" />
                Daily Challenges
              </CardTitle>
              <CardDescription className="text-[#FBFAF9]">
                Complete challenges for bonus rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {challenges.slice(0, 3).map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-3 bg-[#836EF9]/10 rounded-lg">
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{challenge.title}</p>
                    <p className="text-[#FBFAF9] text-xs">{challenge.reward?.description || challenge.reward}</p>
                  </div>
                  <Badge className={challenge.completed ? 'bg-green-600' : 'bg-[#A0055D]'}>
                    {challenge.progress || 0}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="bg-[#200052]/50 border-[#836EF9]/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-[#836EF9]" />
                Top Players
              </CardTitle>
              <CardDescription className="text-[#FBFAF9]">
                Global leaderboard rankings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockLeaderboard.slice(0, 5).map((player) => (
                <div key={player.rank} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-[#A0055D] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {player.rank}
                    </Badge>
                    <span className="text-white text-sm">{player.player}</span>
                  </div>
                  <span className="text-[#836EF9] font-semibold text-sm">{player.score.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Platform Stats */}
          <Card className="bg-[#200052]/50 border-[#836EF9]/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#A0055D]" />
                Platform Stats
              </CardTitle>
              <CardDescription className="text-[#FBFAF9]">
                Live gaming statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#836EF9]">12,847</div>
                <div className="text-sm text-[#FBFAF9]">Active Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#A0055D]">3.2M</div>
                <div className="text-sm text-[#FBFAF9]">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">$127K</div>
                <div className="text-sm text-[#FBFAF9]">Rewards Distributed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <section className="text-center py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Start Gaming?
            </h2>
            <p className="text-[#FBFAF9] text-lg mb-8">
              Connect your wallet and start earning crypto rewards while playing your favorite games
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-[#836EF9] to-[#A0055D] hover:from-[#836EF9]/80 hover:to-[#A0055D]/80 text-white px-8 py-4 text-lg font-semibold"
            >
              Connect Wallet & Play
            </Button>
          </div>
        </section>
      </main>

      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;