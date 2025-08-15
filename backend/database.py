from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import os
from models import *

class Database:
    def __init__(self, client: AsyncIOMotorClient):
        self.client = client
        self.db = client[os.environ.get('DB_NAME', 'moangem')]
        
    # User Operations
    async def create_user(self, user_data: UserCreate) -> User:
        user = User(**user_data.dict())
        result = await self.db.users.insert_one(user.dict())
        return user
    
    async def get_user_by_wallet(self, wallet_address: str) -> Optional[User]:
        user_data = await self.db.users.find_one({"wallet_address": wallet_address})
        if user_data:
            return User(**user_data)
        return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        user_data = await self.db.users.find_one({"id": user_id})
        if user_data:
            return User(**user_data)
        return None
    
    async def update_user_stats(self, user_id: str, score: int, tokens: float) -> bool:
        update_data = {
            "$inc": {
                "total_score": score,
                "games_played": 1,
                "tokens_earned": tokens
            },
            "$set": {
                "last_active": datetime.utcnow()
            }
        }
        
        result = await self.db.users.update_one({"id": user_id}, update_data)
        
        # Update level based on total score
        user = await self.get_user_by_id(user_id)
        if user:
            new_level = max(1, user.total_score // 1000)  # Level up every 1000 points
            if new_level != user.level:
                await self.db.users.update_one(
                    {"id": user_id}, 
                    {"$set": {"level": new_level}}
                )
        
        return result.modified_count > 0
    
    # Game Session Operations
    async def create_game_session(self, user_id: str, session_data: GameSessionCreate) -> GameSession:
        # Calculate tokens earned (10 points = 1 token)
        tokens_earned = session_data.score / 10.0
        
        session = GameSession(
            user_id=user_id,
            game_id=session_data.game_id,
            score=session_data.score,
            tokens_earned=tokens_earned,
            duration=session_data.duration,
            session_data=session_data.session_data
        )
        
        await self.db.game_sessions.insert_one(session.dict())
        
        # Update user stats
        await self.update_user_stats(user_id, session_data.score, tokens_earned)
        
        return session
    
    async def get_user_high_score(self, user_id: str, game_id: str) -> int:
        result = await self.db.game_sessions.find_one(
            {"user_id": user_id, "game_id": game_id},
            sort=[("score", -1)]
        )
        return result["score"] if result else 0
    
    # Leaderboard Operations
    async def get_game_leaderboard(self, game_id: str, limit: int = 10) -> List[LeaderboardEntry]:
        pipeline = [
            {"$match": {"game_id": game_id}},
            {"$group": {
                "_id": "$user_id",
                "best_score": {"$max": "$score"},
                "games_played": {"$sum": 1}
            }},
            {"$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "id",
                "as": "user"
            }},
            {"$unwind": "$user"},
            {"$project": {
                "user_id": "$_id",
                "player": {"$ifNull": ["$user.username", "$user.wallet_address"]},
                "score": "$best_score",
                "games": "$games_played"
            }},
            {"$sort": {"score": -1}},
            {"$limit": limit}
        ]
        
        results = await self.db.game_sessions.aggregate(pipeline).to_list(limit)
        
        leaderboard = []
        for i, result in enumerate(results):
            leaderboard.append(LeaderboardEntry(
                rank=i + 1,
                player=result["player"][:20] if len(result["player"]) > 20 else result["player"],
                user_id=result["user_id"],
                score=result["score"],
                games=result["games"]
            ))
        
        return leaderboard
    
    async def get_global_leaderboard(self, limit: int = 10) -> List[GlobalLeaderboardEntry]:
        pipeline = [
            {"$sort": {"total_score": -1}},
            {"$limit": limit},
            {"$project": {
                "user_id": "$id",
                "player": {"$ifNull": ["$username", "$wallet_address"]},
                "total_score": 1,
                "games_played": 1,
                "level": 1
            }}
        ]
        
        results = await self.db.users.aggregate(pipeline).to_list(limit)
        
        leaderboard = []
        for i, result in enumerate(results):
            leaderboard.append(GlobalLeaderboardEntry(
                rank=i + 1,
                player=result["player"][:20] if len(result["player"]) > 20 else result["player"],
                user_id=result["user_id"],
                total_score=result["total_score"],
                games_played=result["games_played"],
                level=result["level"]
            ))
        
        return leaderboard
    
    # Challenge Operations
    async def get_daily_challenges(self) -> List[Challenge]:
        now = datetime.utcnow()
        challenges = await self.db.challenges.find({
            "is_daily": True,
            "is_active": True,
            "expires_at": {"$gt": now}
        }).to_list(100)
        
        return [Challenge(**challenge) for challenge in challenges]
    
    async def create_daily_challenges(self):
        """Create default daily challenges if none exist"""
        existing = await self.db.challenges.count_documents({
            "is_daily": True,
            "is_active": True,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if existing == 0:
            tomorrow = datetime.utcnow() + timedelta(days=1)
            default_challenges = [
                Challenge(
                    title="Snake Streak",
                    description="Score 5000+ in Snake Game",
                    game_id="snake",
                    target_value=5000,
                    reward=Reward(type=RewardType.TOKENS, amount=50, description="50 MONAD tokens"),
                    expires_at=tomorrow
                ),
                Challenge(
                    title="Perfect Dodge",
                    description="Avoid all obstacles for 30 seconds",
                    game_id="gas-free-dodger",
                    target_value=30,
                    reward=Reward(type=RewardType.TOKENS, amount=25, description="25 ETH points"),
                    expires_at=tomorrow
                ),
                Challenge(
                    title="Card Combo",
                    description="Complete 3 Solitaire games",
                    game_id="solitaire-blitz",
                    target_value=3,
                    reward=Reward(type=RewardType.NFT, amount=1, description="Rare Card NFT"),
                    expires_at=tomorrow
                )
            ]
            
            for challenge in default_challenges:
                await self.db.challenges.insert_one(challenge.dict())
    
    async def get_user_challenge_progress(self, user_id: str, challenge_id: str) -> Optional[UserChallenge]:
        challenge_data = await self.db.user_challenges.find_one({
            "user_id": user_id,
            "challenge_id": challenge_id
        })
        if challenge_data:
            return UserChallenge(**challenge_data)
        return None
    
    async def update_challenge_progress(self, user_id: str, challenge_id: str, progress: int) -> UserChallenge:
        existing = await self.get_user_challenge_progress(user_id, challenge_id)
        
        if existing:
            await self.db.user_challenges.update_one(
                {"user_id": user_id, "challenge_id": challenge_id},
                {"$set": {"progress": progress, "completed": progress >= 100}}
            )
            existing.progress = progress
            existing.completed = progress >= 100
            return existing
        else:
            user_challenge = UserChallenge(
                user_id=user_id,
                challenge_id=challenge_id,
                progress=progress,
                completed=progress >= 100
            )
            await self.db.user_challenges.insert_one(user_challenge.dict())
            return user_challenge
    
    # Platform Stats
    async def get_platform_stats(self) -> PlatformStats:
        total_users = await self.db.users.count_documents({})
        total_sessions = await self.db.game_sessions.count_documents({})
        
        # Calculate total rewards
        pipeline = [
            {"$group": {"_id": None, "total_tokens": {"$sum": "$tokens_earned"}}}
        ]
        reward_result = await self.db.users.aggregate(pipeline).to_list(1)
        total_rewards = reward_result[0]["total_tokens"] if reward_result else 0
        
        # Active players today
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        active_today = await self.db.users.count_documents({
            "last_active": {"$gte": today}
        })
        
        return PlatformStats(
            total_players=total_users,
            total_games_played=total_sessions,
            total_rewards_distributed=f"${total_rewards * 0.1:.1f}K",  # Mock USD value
            active_players_today=active_today
        )
    
    # Initialize default data
    async def initialize_default_data(self):
        """Initialize games and challenges"""
        # Create default games if they don't exist
        games_count = await self.db.games.count_documents({})
        if games_count == 0:
            default_games = [
                Game(
                    id="snake",
                    name="Snake Game",
                    description="Classic snake gameplay with crypto power-ups and collectibles",
                    category="Retro",
                    thumbnail="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop",
                    rewards=["MONAD tokens", "Snake NFTs"],
                    is_active=True
                ),
                Game(
                    id="gas-free-dodger",
                    name="Gas-Free Dodger",
                    description="Avoid obstacles in this fast-paced dodging game with crypto themes",
                    category="Arcade",
                    thumbnail="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
                    rewards=["ETH rewards", "Dodge NFTs"],
                    is_active=False
                ),
                Game(
                    id="solitaire-blitz",
                    name="Solitaire Blitz",
                    description="Fast-paced solitaire with blockchain-themed cards and bonuses",
                    category="Card",
                    thumbnail="https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop",
                    rewards=["Card NFTs", "POLY tokens"],
                    is_active=False
                ),
                Game(
                    id="cryptoblades",
                    name="CryptoBlades",
                    description="RPG-style battling game with crypto rewards system",
                    category="Strategy",
                    thumbnail="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
                    rewards=["Weapon NFTs", "SKILL tokens"],
                    is_active=False
                )
            ]
            
            for game in default_games:
                await self.db.games.insert_one(game.dict())
        
        # Create daily challenges
        await self.create_daily_challenges()