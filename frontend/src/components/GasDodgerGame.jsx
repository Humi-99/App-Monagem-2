import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Play, Pause, RotateCcw, Trophy, Coins, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import gamesService from '../services/games';
import { useToast } from '../hooks/use-toast';

const GAME_WIDTH = 600;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 25;
const OBSTACLE_WIDTH = 45;
const OBSTACLE_HEIGHT = 45;

const GasDodgerGame = ({ onBack, game }) => {
  const [player, setPlayer] = useState({ x: GAME_WIDTH / 2 - PLAYER_SIZE / 2, y: GAME_HEIGHT - 60 });
  const [obstacles, setObstacles] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [particles, setParticles] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [invulnerable, setInvulnerable] = useState(false);
  const [boost, setBoost] = useState(false);
  const [lives, setLives] = useState(3);
  const gameLoopRef = useRef();
  const keysPressed = useRef({});
  
  const { user, isAuthenticated, updateUserStats } = useAuth();
  const { toast } = useToast();

  const submitScore = async (finalScore, gameDuration) => {
    if (!isAuthenticated || !user || isSubmittingScore) return;
    
    try {
      setIsSubmittingScore(true);
      
      const response = await gamesService.submitScore('gas-free-dodger', finalScore, {
        duration: gameDuration,
        obstacles_dodged: Math.floor(finalScore / 10),
        max_speed: speed,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        const earnedTokens = response.tokens_awarded || Math.floor(finalScore / 5); // 5 points = 1 token
        setTokens(prev => prev + earnedTokens);
        
        // Update user stats in context
        updateUserStats({
          total_score: (user.total_score || 0) + finalScore,
          games_played: (user.games_played || 0) + 1,
          tokens_earned: (user.tokens_earned || 0) + earnedTokens
        });
        
        toast({
          title: response.new_high_score ? "New High Score! 🏆" : "Score Submitted!",
          description: `Earned ${earnedTokens} ETH points! ${response.level_up ? "Level up!" : ""}`,
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
      const earnedTokens = Math.floor(finalScore / 5);
      setTokens(prev => prev + earnedTokens);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const resetGame = useCallback(() => {
    setPlayer({ x: GAME_WIDTH / 2 - PLAYER_SIZE / 2, y: GAME_HEIGHT - 60 });
    setObstacles([]);
    setPowerUps([]);
    setParticles([]);
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setSpeed(4);
    setCombo(0);
    setMaxCombo(0);
    setInvulnerable(false);
    setBoost(false);
    setLives(3);
    setGameStartTime(null);
  }, []);

  const createParticle = useCallback((x, y, color = '#836EF9', count = 5) => {
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random(),
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color,
        life: 30,
        maxLife: 30
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const generateObstacle = useCallback(() => {
    const obstacleTypes = [
      { type: 'gas-fee', weight: 0.25, color: '#ef4444', points: 50 },
      { type: 'eth-bomb', weight: 0.15, color: '#f59e0b', points: 100 },
      { type: 'regular', weight: 0.45, color: '#6b7280', points: 20 },
      { type: 'big-gas', weight: 0.15, color: '#dc2626', points: 200, size: 1.5 }
    ];
    
    const random = Math.random();
    let cumulativeWeight = 0;
    let selectedType = obstacleTypes[0];
    
    for (const type of obstacleTypes) {
      cumulativeWeight += type.weight;
      if (random <= cumulativeWeight) {
        selectedType = type;
        break;
      }
    }

    return {
      id: Math.random(),
      x: Math.random() * (GAME_WIDTH - OBSTACLE_WIDTH),
      y: -OBSTACLE_HEIGHT,
      type: selectedType.type,
      color: selectedType.color,
      points: selectedType.points,
      size: selectedType.size || 1,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 5
    };
  }, []);

  const generatePowerUp = useCallback(() => {
    const powerUpTypes = [
      { type: 'shield', color: '#10b981', duration: 5000 },
      { type: 'boost', color: '#f59e0b', duration: 3000 },
      { type: 'life', color: '#ef4444', duration: 0 },
      { type: 'points', color: '#8b5cf6', duration: 0 }
    ];
    
    const selectedType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    return {
      id: Math.random(),
      x: Math.random() * (GAME_WIDTH - 30),
      y: -30,
      type: selectedType.type,
      color: selectedType.color,
      duration: selectedType.duration,
      pulse: 0
    };
  }, []);

  const checkCollision = useCallback((playerPos, obstacle) => {
    return (
      playerPos.x < obstacle.x + OBSTACLE_WIDTH &&
      playerPos.x + PLAYER_SIZE > obstacle.x &&
      playerPos.y < obstacle.y + OBSTACLE_HEIGHT &&
      playerPos.y + PLAYER_SIZE > obstacle.y
    );
  }, []);

  const updateGame = useCallback(() => {
    if (!gameStarted || gameOver || isPaused) return;

    // Update particles
    setParticles(prev => prev
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life - 1
      }))
      .filter(particle => particle.life > 0)
    );

    // Update obstacles with improved physics
    setObstacles(prev => {
      const newObstacles = prev
        .map(obstacle => ({
          ...obstacle,
          y: obstacle.y + (speed * (boost ? 0.5 : 1)), // Slower when boosted for easier dodging
          rotation: obstacle.rotation + obstacle.rotationSpeed
        }))
        .filter(obstacle => obstacle.y < GAME_HEIGHT + 50);

      // More dynamic obstacle spawning
      const spawnChance = 0.04 + (speed / 500);
      if (Math.random() < spawnChance) {
        newObstacles.push(generateObstacle());
      }

      return newObstacles;
    });

    // Update power-ups
    setPowerUps(prev => {
      const newPowerUps = prev
        .map(powerUp => ({
          ...powerUp,
          y: powerUp.y + speed * 0.8,
          pulse: powerUp.pulse + 0.2
        }))
        .filter(powerUp => powerUp.y < GAME_HEIGHT + 30);

      // Spawn power-ups less frequently but more impactfully
      if (Math.random() < 0.008 + (score / 50000)) {
        newPowerUps.push(generatePowerUp());
      }

      return newPowerUps;
    });

    // Much better scoring system with combos
    setScore(prev => {
      const basePoints = 5 + Math.floor(speed);
      const comboMultiplier = 1 + (combo * 0.1);
      const speedBonus = Math.floor(speed / 2);
      const newScore = prev + Math.floor((basePoints + speedBonus) * comboMultiplier);
      
      // Increase speed more frequently for excitement
      if (newScore % 200 === 0 && newScore > 0) {
        setSpeed(prevSpeed => Math.min(prevSpeed + 0.8, 15));
        createParticle(GAME_WIDTH / 2, GAME_HEIGHT / 2, '#f59e0b', 10);
      }
      
      return newScore;
    });

    // Increase combo for surviving
    setCombo(prev => {
      const newCombo = prev + 1;
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
      return newCombo;
    });

    // Check obstacle collisions
    setObstacles(currentObstacles => {
      for (let obstacle of currentObstacles) {
        if (checkCollision(player, obstacle)) {
          if (invulnerable) {
            // Destroy obstacle and award bonus points
            setScore(prev => prev + obstacle.points * 2);
            createParticle(obstacle.x + OBSTACLE_WIDTH/2, obstacle.y + OBSTACLE_HEIGHT/2, obstacle.color, 8);
            return currentObstacles.filter(o => o.id !== obstacle.id);
          } else {
            // Take damage
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameOver(true);
                const finalScore = score;
                if (finalScore > highScore) {
                  setHighScore(finalScore);
                }
                
                const duration = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
                
                if (isAuthenticated && finalScore > 0) {
                  submitScore(finalScore, duration);
                } else {
                  const earnedTokens = Math.floor(finalScore / 20);
                  setTokens(prev => prev + earnedTokens);
                }
              } else {
                // Flash screen and reset combo
                setCombo(0);
                setInvulnerable(true);
                setTimeout(() => setInvulnerable(false), 2000);
                createParticle(player.x, player.y, '#ef4444', 15);
              }
              return newLives;
            });
            return currentObstacles.filter(o => o.id !== obstacle.id);
          }
        }
      }
      return currentObstacles;
    });

    // Check power-up collisions
    setPowerUps(currentPowerUps => {
      for (let powerUp of currentPowerUps) {
        if (checkCollision(player, powerUp)) {
          createParticle(powerUp.x + 15, powerUp.y + 15, powerUp.color, 10);
          
          switch (powerUp.type) {
            case 'shield':
              setInvulnerable(true);
              setTimeout(() => setInvulnerable(false), powerUp.duration);
              break;
            case 'boost':
              setBoost(true);
              setTimeout(() => setBoost(false), powerUp.duration);
              break;
            case 'life':
              setLives(prev => Math.min(prev + 1, 5));
              break;
            case 'points':
              setScore(prev => prev + 500 + (combo * 50));
              break;
          }
          
          return currentPowerUps.filter(p => p.id !== powerUp.id);
        }
      }
      return currentPowerUps;
    });
  }, [gameStarted, gameOver, isPaused, speed, boost, player, score, combo, maxCombo, highScore, gameStartTime, isAuthenticated, invulnerable, checkCollision, generateObstacle, generatePowerUp, submitScore, createParticle]);

  // Game loop
  useEffect(() => {
    gameLoopRef.current = setInterval(updateGame, 16); // ~60 FPS
    return () => clearInterval(gameLoopRef.current);
  }, [updateGame]);

  // Player movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update player position with improved movement
  useEffect(() => {
    const movePlayer = () => {
      if (!gameStarted || gameOver || isPaused) return;

      setPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const moveSpeed = boost ? 8 : 6; // Faster movement

        if (keysPressed.current['ArrowLeft'] && newX > 0) {
          newX -= moveSpeed;
        }
        if (keysPressed.current['ArrowRight'] && newX < GAME_WIDTH - PLAYER_SIZE) {
          newX += moveSpeed;
        }
        if (keysPressed.current['ArrowUp'] && newY > GAME_HEIGHT * 0.4) {
          newY -= moveSpeed * 0.5;
        }
        if (keysPressed.current['ArrowDown'] && newY < GAME_HEIGHT - PLAYER_SIZE) {
          newY += moveSpeed * 0.5;
        }

        return { x: newX, y: newY };
      });
    };

    const moveInterval = setInterval(movePlayer, 16);
    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver, isPaused, boost]);

  // Keyboard controls for pause and space
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (gameStarted && !gameOver) {
          setIsPaused(prev => !prev);
        }
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
              ETH Points: {tokens}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="md:col-span-2">
            <Card className="bg-[#200052]/50 border-[#836EF9]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-2xl">Gas-Free Dodger ⚡</CardTitle>
                  <div className="flex items-center space-x-3">
                    <span className="text-[#FBFAF9] font-semibold text-lg">Score: {score.toLocaleString()}</span>
                    <Badge className="bg-[#A0055D] text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      Speed: {speed.toFixed(1)}x
                    </Badge>
                    {combo > 10 && (
                      <Badge className="bg-yellow-500 text-black font-bold animate-pulse">
                        🔥 COMBO: {combo}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Status Bar */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    {/* Lives */}
                    <div className="flex items-center space-x-1">
                      <span className="text-[#FBFAF9] text-sm">Lives:</span>
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i < lives ? 'bg-red-500' : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Power-up status */}
                    <div className="flex space-x-2">
                      {invulnerable && (
                        <Badge className="bg-green-500 text-white text-xs animate-pulse">
                          🛡️ SHIELD
                        </Badge>
                      )}
                      {boost && (
                        <Badge className="bg-orange-500 text-white text-xs animate-pulse">
                          🚀 BOOST
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-[#FBFAF9]">
                    <div>Max Combo: {maxCombo}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Game Canvas */}
                <div className="relative mx-auto" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
                  <div 
                    className="relative bg-gradient-to-b from-blue-900 to-purple-900 border-2 border-[#836EF9]/50 rounded-lg overflow-hidden"
                    style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
                  >
                    {/* Player */}
                    <div
                      className="absolute bg-[#836EF9] rounded-full shadow-lg transition-all duration-75"
                      style={{
                        width: PLAYER_SIZE,
                        height: PLAYER_SIZE,
                        left: player.x,
                        top: player.y,
                        boxShadow: '0 0 10px #836EF9'
                      }}
                    />

                    {/* Obstacles */}
                    {obstacles.map(obstacle => (
                      <div
                        key={obstacle.id}
                        className={`absolute rounded transition-all duration-75 ${
                          obstacle.type === 'gas-fee' 
                            ? 'bg-red-500 shadow-red-500/50' 
                            : 'bg-gray-600 shadow-gray-600/50'
                        }`}
                        style={{
                          width: OBSTACLE_WIDTH,
                          height: OBSTACLE_HEIGHT,
                          left: obstacle.x,
                          top: obstacle.y,
                          boxShadow: `0 0 8px ${obstacle.type === 'gas-fee' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(75, 85, 99, 0.5)'}`
                        }}
                      >
                        {obstacle.type === 'gas-fee' && (
                          <div className="text-white text-xs text-center mt-2 font-bold">GAS</div>
                        )}
                      </div>
                    ))}

                    {/* Game Over Overlay */}
                    {gameOver && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                        <div className="text-center space-y-4">
                          <h3 className="text-white text-2xl font-bold">Game Over!</h3>
                          <p className="text-[#FBFAF9]">Final Score: {score}</p>
                          <p className="text-[#A0055D]">ETH Points Earned: {Math.floor(score / 5)}</p>
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
                  <span>← → Arrow Keys</span>
                </div>
                <div className="flex justify-between">
                  <span>Pause:</span>
                  <span>Spacebar</span>
                </div>
                <div className="flex justify-between">
                  <span>Objective:</span>
                  <span>Avoid obstacles</span>
                </div>
                <div className="flex justify-between">
                  <span>Red obstacles:</span>
                  <span>Gas fees!</span>
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
                  <span>5 points =</span>
                  <span className="text-[#A0055D]">1 ETH point</span>
                </div>
                <div className="flex justify-between">
                  <span>High Score:</span>
                  <span className="text-[#836EF9]">NFT reward</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed bonus:</span>
                  <span className="text-yellow-400">Extra multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas dodge:</span>
                  <span className="text-green-400">Bonus points</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GasDodgerGame;