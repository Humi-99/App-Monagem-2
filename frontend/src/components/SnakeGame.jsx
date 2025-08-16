import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Play, Pause, RotateCcw, Trophy, Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import gamesService from '../services/games';
import { useToast } from '../hooks/use-toast';

const GRID_SIZE = 25;
const INITIAL_SNAKE = [{ x: 12, y: 12 }];
const INITIAL_FOOD = { x: 18, y: 18 };
const INITIAL_DIRECTION = { x: 0, y: 1 };

const SnakeGame = ({ onBack, game }) => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [specialFood, setSpecialFood] = useState(null);
  const [powerUps, setPowerUps] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [particles, setParticles] = useState([]);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(200);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [invulnerable, setInvulnerable] = useState(false);
  const [doublePoints, setDoublePoints] = useState(false);
  const [level, setLevel] = useState(1);
  const gameLoopRef = useRef();
  
  const { user, isAuthenticated, updateUserStats } = useAuth();
  const { toast } = useToast();

  const submitScore = async (finalScore, gameDuration) => {
    if (!isAuthenticated || !user || isSubmittingScore) return;
    
    try {
      setIsSubmittingScore(true);
      
      const response = await gamesService.submitScore('snake', finalScore, {
        duration: gameDuration,
        snake_length: snake.length,
        food_collected: Math.floor(finalScore / 10),
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        const earnedTokens = response.tokens_awarded || Math.floor(finalScore / 10);
        setTokens(prev => prev + earnedTokens);
        
        // Update user stats in context
        updateUserStats({
          total_score: (user.total_score || 0) + finalScore,
          games_played: (user.games_played || 0) + 1,
          tokens_earned: (user.tokens_earned || 0) + earnedTokens
        });
        
        toast({
          title: response.new_high_score ? "New High Score! 🏆" : "Score Submitted!",
          description: `Earned ${earnedTokens} MONAD tokens! ${response.level_up ? "Level up!" : ""}`,
        });
        
        if (response.new_high_score) {
          setHighScore(finalScore);
        }
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      toast({
        title: "Score Submission Failed",
        description: "Don't worry, your score was saved locally!",
        variant: "destructive",
      });
      
      // Fallback: save locally
      const earnedTokens = Math.floor(finalScore / 10);
      setTokens(prev => prev + earnedTokens);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const createParticle = useCallback((x, y, color = '#836EF9', count = 5) => {
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random(),
        x: x * (500 / GRID_SIZE) + (500 / GRID_SIZE) / 2,
        y: y * (500 / GRID_SIZE) + (500 / GRID_SIZE) / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color,
        life: 20,
        maxLife: 20
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        type: Math.random() > 0.7 ? 'special' : 'normal'
      };
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      obstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y)
    );
    return newFood;
  }, [snake, obstacles]);

  const generateSpecialFood = useCallback(() => {
    if (Math.random() < 0.3 && !specialFood) {
      let newSpecialFood;
      do {
        newSpecialFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
          type: ['golden', 'crystal', 'monad'][Math.floor(Math.random() * 3)],
          timeLeft: 100
        };
      } while (
        snake.some(segment => segment.x === newSpecialFood.x && segment.y === newSpecialFood.y) ||
        obstacles.some(obs => obs.x === newSpecialFood.x && obs.y === newSpecialFood.y)
      );
      setSpecialFood(newSpecialFood);
    }
  }, [snake, obstacles, specialFood]);

  const generatePowerUp = useCallback(() => {
    if (Math.random() < 0.1 && powerUps.length < 2) {
      let newPowerUp;
      do {
        newPowerUp = {
          id: Math.random(),
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
          type: ['shield', 'double', 'slow'][Math.floor(Math.random() * 3)],
          timeLeft: 80
        };
      } while (
        snake.some(segment => segment.x === newPowerUp.x && segment.y === newPowerUp.y) ||
        obstacles.some(obs => obs.x === newPowerUp.x && obs.y === newPowerUp.y)
      );
      setPowerUps(prev => [...prev, newPowerUp]);
    }
  }, [snake, obstacles, powerUps]);

  const generateObstacles = useCallback(() => {
    if (level > 3 && obstacles.length < level - 2) {
      let newObstacle;
      do {
        newObstacle = {
          id: Math.random(),
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        };
      } while (
        snake.some(segment => segment.x === newObstacle.x && segment.y === newObstacle.y) ||
        (newObstacle.x === food.x && newObstacle.y === food.y) ||
        Math.abs(newObstacle.x - snake[0].x) + Math.abs(newObstacle.y - snake[0].y) < 3
      );
      setObstacles(prev => [...prev, newObstacle]);
    }
  }, [snake, food, level, obstacles]);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setSpecialFood(null);
    setPowerUps([]);
    setObstacles([]);
    setParticles([]);
    setDirection(INITIAL_DIRECTION);
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setGameSpeed(200);
    setCombo(0);
    setMaxCombo(0);
    setInvulnerable(false);
    setDoublePoints(false);
    setLevel(1);
  }, []);

  const checkCollision = useCallback((head, snakeArray) => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    // Self collision (but not if invulnerable)
    if (!invulnerable) {
      for (let segment of snakeArray) {
        if (head.x === segment.x && head.y === segment.y) {
          return true;
        }
      }
    }
    
    // Obstacle collision (but not if invulnerable)
    if (!invulnerable) {
      for (let obstacle of obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
          return true;
        }
      }
    }
    
    return false;
  }, [invulnerable, obstacles]);

  const moveSnake = useCallback(() => {
    if (!gameStarted || gameOver || isPaused) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { x: newSnake[0].x + direction.x, y: newSnake[0].y + direction.y };

      if (checkCollision(head, newSnake)) {
        setGameOver(true);
        const finalScore = score;
        if (finalScore > highScore) {
          setHighScore(finalScore);
        }
        
        // Calculate game duration
        const duration = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
        
        // Submit score if user is authenticated
        if (isAuthenticated && finalScore > 0) {
          submitScore(finalScore, duration);
        } else {
          // Award tokens locally for non-authenticated users
          const earnedTokens = Math.floor(finalScore / 10);
          setTokens(prev => prev + earnedTokens);
        }
        
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setFood(generateFood());
        setScore(prev => prev + 10);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameStarted, gameOver, isPaused, direction, food, score, highScore, checkCollision, generateFood]);

  // Game loop
  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, 150);
    return () => clearInterval(gameLoopRef.current);
  }, [moveSnake]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setDirection(prev => prev.y !== 1 ? { x: 0, y: -1 } : prev);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setDirection(prev => prev.y !== -1 ? { x: 0, y: 1 } : prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setDirection(prev => prev.x !== 1 ? { x: -1, y: 0 } : prev);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setDirection(prev => prev.x !== -1 ? { x: 1, y: 0 } : prev);
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setGameStartTime(Date.now());
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-[#200052] p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[#FBFAF9] hover:text-white hover:bg-[#836EF9]/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
          
          <div className="flex items-center space-x-4">
            <Badge className="bg-[#836EF9] text-white px-4 py-2">
              <Trophy className="w-4 h-4 mr-1" />
              High Score: {highScore}
            </Badge>
            <Badge className="bg-[#A0055D] text-white px-4 py-2">
              <Coins className="w-4 h-4 mr-1" />
              Tokens: {tokens}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="md:col-span-2">
            <Card className="bg-[#200052]/50 border-[#836EF9]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-2xl">Snake Game</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#FBFAF9] font-semibold">Score: {score}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Game Canvas */}
                <div className="relative">
                  <div 
                    className="grid bg-[#0a0a0a] border-2 border-[#836EF9]/50 rounded-lg overflow-hidden mx-auto"
                    style={{ 
                      gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                      width: '500px',
                      height: '500px'
                    }}
                  >
                    {/* Grid cells */}
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                      const x = index % GRID_SIZE;
                      const y = Math.floor(index / GRID_SIZE);
                      const isSnake = snake.some(segment => segment.x === x && segment.y === y);
                      const isFood = food.x === x && food.y === y;
                      const isHead = snake[0] && snake[0].x === x && snake[0].y === y;

                      return (
                        <div
                          key={index}
                          className={`
                            border border-[#836EF9]/10
                            ${isSnake 
                              ? isHead 
                                ? 'bg-[#A0055D] shadow-lg' 
                                : 'bg-[#836EF9]'
                              : isFood 
                                ? 'bg-yellow-400 shadow-lg animate-pulse' 
                                : 'bg-transparent'
                            }
                          `}
                        />
                      );
                    })}
                  </div>

                  {/* Game Over Overlay */}
                  {gameOver && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                      <div className="text-center space-y-4">
                        <h3 className="text-white text-2xl font-bold">Game Over!</h3>
                        <p className="text-[#FBFAF9]">Final Score: {score}</p>
                        <p className="text-[#A0055D]">Tokens Earned: {Math.floor(score / 10)}</p>
                        {isSubmittingScore && (
                          <p className="text-[#836EF9]">Submitting score...</p>
                        )}
                        <Button
                          onClick={resetGame}
                          disabled={isSubmittingScore}
                          className="bg-[#836EF9] hover:bg-[#836EF9]/80 text-white"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Play Again
                        </Button>
                        {!isAuthenticated && (
                          <div className="mt-4 p-3 bg-[#836EF9]/20 rounded-lg">
                            <p className="text-[#FBFAF9] text-sm">
                              Connect your wallet to save scores and earn crypto rewards!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pause Overlay */}
                  {isPaused && gameStarted && !gameOver && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <h3 className="text-white text-2xl font-bold">Paused</h3>
                        <p className="text-[#FBFAF9] mt-2">Press Space or click to resume</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Game Controls */}
                <div className="flex justify-center space-x-4 mt-6">
                  {!gameStarted || gameOver ? (
                    <Button
                      onClick={startGame}
                      className="bg-gradient-to-r from-[#836EF9] to-[#A0055D] hover:from-[#836EF9]/80 hover:to-[#A0055D]/80 text-white px-8"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {gameOver ? 'Play Again' : 'Start Game'}
                    </Button>
                  ) : (
                    <Button
                      onClick={togglePause}
                      className="bg-[#836EF9] hover:bg-[#836EF9]/80 text-white px-8"
                    >
                      {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                  )}
                  
                  <Button
                    onClick={resetGame}
                    variant="outline"
                    className="border-[#836EF9] text-[#836EF9] hover:bg-[#836EF9]/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Info */}
          <div className="space-y-6">
            {/* Controls */}
            <Card className="bg-[#200052]/50 border-[#836EF9]/30">
              <CardHeader>
                <CardTitle className="text-white">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-[#FBFAF9]">
                <div className="flex justify-between">
                  <span>Move:</span>
                  <span>Arrow Keys</span>
                </div>
                <div className="flex justify-between">
                  <span>Pause:</span>
                  <span>Spacebar</span>
                </div>
                <div className="flex justify-between">
                  <span>Objective:</span>
                  <span>Eat yellow food</span>
                </div>
              </CardContent>
            </Card>

            {/* Rewards */}
            <Card className="bg-[#200052]/50 border-[#836EF9]/30">
              <CardHeader>
                <CardTitle className="text-white">Crypto Rewards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-[#FBFAF9]">
                <div className="flex justify-between">
                  <span>10 points =</span>
                  <span className="text-[#A0055D]">1 MONAD token</span>
                </div>
                <div className="flex justify-between">
                  <span>High Score:</span>
                  <span className="text-[#836EF9]">NFT reward</span>
                </div>
                <div className="flex justify-between">
                  <span>Perfect game:</span>
                  <span className="text-yellow-400">Bonus multiplier</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;