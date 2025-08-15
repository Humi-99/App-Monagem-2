from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Enums
class GameType(str, Enum):
    SNAKE = "snake"
    DODGER = "gas-free-dodger"
    SOLITAIRE = "solitaire-blitz"
    CRYPTOBLADES = "cryptoblades"
    SPLINTERLANDS = "splinterlands"
    CRYPTODOZER = "cryptodozer"
    EOSJOY = "eosjoy-mini-games"

class RewardType(str, Enum):
    TOKENS = "tokens"
    NFT = "nft"
    MULTIPLIER = "multiplier"

class ChallengeStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_address: str
    username: str = ""
    level: int = 1
    total_score: int = 0
    games_played: int = 0
    tokens_earned: float = 0.0
    nfts_owned: int = 0
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    wallet_address: str
    username: Optional[str] = ""

class UserStats(BaseModel):
    total_score: int
    games_played: int
    rank: int
    level: int
    tokens_earned: float
    nfts_owned: int

# Game Models
class Game(BaseModel):
    id: str
    name: str
    description: str
    category: str
    thumbnail: str
    play_count: int = 0
    avg_score: int = 0
    rewards: List[str] = []
    is_active: bool = True

class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    game_id: str
    score: int
    tokens_earned: float
    duration: int  # in seconds
    session_data: Dict[str, Any] = {}
    played_at: datetime = Field(default_factory=datetime.utcnow)

class GameSessionCreate(BaseModel):
    game_id: str
    score: int
    duration: int
    session_data: Dict[str, Any] = {}

class ScoreSubmission(BaseModel):
    game_id: str
    score: int
    tokens_earned: float
    session_data: Dict[str, Any] = {}

# Leaderboard Models
class LeaderboardEntry(BaseModel):
    rank: int
    player: str
    user_id: str
    score: int
    games: int

class GlobalLeaderboardEntry(BaseModel):
    rank: int
    player: str
    user_id: str
    total_score: int
    games_played: int
    level: int

# Challenge Models
class Reward(BaseModel):
    type: RewardType
    amount: float
    description: str

class Challenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    game_id: Optional[str] = None
    target_value: int
    reward: Reward
    duration: int = 24  # in hours
    is_daily: bool = True
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime

class ChallengeCreate(BaseModel):
    title: str
    description: str
    game_id: Optional[str] = None
    target_value: int
    reward: Reward
    duration: int = 24
    is_daily: bool = True

class UserChallenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    challenge_id: str
    progress: int = 0
    completed: bool = False
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChallengeProgress(BaseModel):
    challenge_id: str
    progress: int

# Platform Models
class PlatformStats(BaseModel):
    total_players: int
    total_games_played: int
    total_rewards_distributed: str
    active_players_today: int

# Authentication Models
class WalletConnect(BaseModel):
    address: str
    signature: Optional[str] = None

class AuthResponse(BaseModel):
    user: User
    token: str
    message: str

# Response Models
class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class ScoreResponse(BaseModel):
    success: bool
    new_high_score: bool
    tokens_awarded: float
    total_tokens: float
    level_up: bool = False
    message: str