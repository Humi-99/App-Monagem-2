import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Play, Users, Trophy, Gift } from 'lucide-react';

const GameCard = ({ game, onPlayClick }) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Retro': return 'bg-[#836EF9] text-white';
      case 'Arcade': return 'bg-[#A0055D] text-white';
      case 'Card': return 'bg-purple-600 text-white';
      case 'Strategy': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-[#200052]/50 border-[#836EF9]/30 hover:border-[#A0055D] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#836EF9]/20">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-300"
        style={{ backgroundImage: `url(${game.thumbnail})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#200052]/80 via-[#200052]/60 to-transparent" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <Badge className={getCategoryColor(game.category)}>
            {game.category}
          </Badge>
          {!game.isActive && (
            <Badge variant="secondary" className="bg-gray-600/80 text-white">
              Coming Soon
            </Badge>
          )}
        </div>
        <CardTitle className="text-white text-xl font-bold group-hover:text-[#836EF9] transition-colors">
          {game.name}
        </CardTitle>
        <CardDescription className="text-[#FBFAF9] line-clamp-2">
          {game.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {/* Game Stats */}
        <div className="flex items-center justify-between text-sm text-[#FBFAF9]">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{game.play_count || game.playCount || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Trophy className="w-4 h-4" />
            <span>{(game.avg_score || game.avgScore || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Rewards */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1 text-sm text-[#A0055D]">
            <Gift className="w-4 h-4" />
            <span className="font-semibold">Rewards:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {game.rewards.map((reward, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="text-xs border-[#836EF9]/50 text-[#836EF9] hover:bg-[#836EF9]/10"
              >
                {reward}
              </Badge>
            ))}
          </div>
        </div>

        {/* Play Button */}
        <Button
          onClick={() => onPlayClick(game)}
          disabled={!game.is_active}
          className={`
            w-full font-semibold transition-all duration-300
            ${game.is_active 
              ? 'bg-gradient-to-r from-[#836EF9] to-[#A0055D] hover:from-[#836EF9]/80 hover:to-[#A0055D]/80 text-white hover:shadow-lg hover:shadow-[#836EF9]/30' 
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }
          `}
        >
          <Play className="w-4 h-4 mr-2" />
          {game.is_active ? 'Play Now' : 'Coming Soon'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GameCard;