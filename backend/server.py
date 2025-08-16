from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional

# Import our models and database
from models import *
from database import Database
from auth import get_current_user, authenticate_wallet

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db_instance = Database(client)

# Create the main app without a prefix
app = FastAPI(title="MoanGem API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Dependency to get database instance
async def get_database() -> Database:
    return db_instance

# Initialize default data on startup
@app.on_event("startup")
async def startup_event():
    await db_instance.initialize_default_data()
    logger.info("MoanGem API started successfully")

# Health check
@api_router.get("/")
async def root():
    return {"message": "MoanGem API is running", "version": "1.0.0"}

# Authentication Routes
@api_router.post("/auth/connect-wallet", response_model=AuthResponse)
async def connect_wallet(
    wallet_data: WalletConnect,
    db: Database = Depends(get_database)
):
    """Connect wallet and authenticate user"""
    try:
        user, token = await authenticate_wallet(
            wallet_data.address, 
            wallet_data.signature, 
            db
        )
        
        return AuthResponse(
            user=user,
            token=token,
            message="Wallet connected successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect wallet: {str(e)}"
        )

@api_router.get("/auth/profile", response_model=User)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

# User Routes
@api_router.post("/users/create", response_model=User)
async def create_user(
    user_data: UserCreate,
    db: Database = Depends(get_database)
):
    """Create new user"""
    existing_user = await db.get_user_by_wallet(user_data.wallet_address)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this wallet address already exists"
        )
    
    return await db.create_user(user_data)

@api_router.get("/users/stats/{user_id}", response_model=UserStats)
async def get_user_stats(
    user_id: str,
    db: Database = Depends(get_database)
):
    """Get user statistics"""
    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Calculate rank (simplified)
    all_users = await db.db.users.find({}, {"total_score": 1}).to_list(1000)
    sorted_users = sorted(all_users, key=lambda x: x.get("total_score", 0), reverse=True)
    rank = next((i + 1 for i, u in enumerate(sorted_users) if u["_id"] == user_id), 999)
    
    return UserStats(
        total_score=user.total_score,
        games_played=user.games_played,
        rank=rank,
        level=user.level,
        tokens_earned=user.tokens_earned,
        nfts_owned=user.nfts_owned
    )

# Game Routes
@api_router.get("/games/list", response_model=List[Game])
async def get_games(db: Database = Depends(get_database)):
    """Get list of all games"""
    games = await db.db.games.find({}).to_list(100)
    
    # Update play counts from game sessions
    for game in games:
        play_count = await db.db.game_sessions.count_documents({"game_id": game["id"]})
        game["play_count"] = play_count
        
        # Calculate average score
        pipeline = [
            {"$match": {"game_id": game["id"]}},
            {"$group": {"_id": None, "avg_score": {"$avg": "$score"}}}
        ]
        avg_result = await db.db.game_sessions.aggregate(pipeline).to_list(1)
        game["avg_score"] = int(avg_result[0]["avg_score"]) if avg_result else 0
    
    return [Game(**game) for game in games]

@api_router.post("/games/score", response_model=ScoreResponse)
async def submit_score(
    score_data: ScoreSubmission,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Submit game score"""
    try:
        # Get user's previous high score
        prev_high_score = await db.get_user_high_score(current_user.id, score_data.game_id)
        is_new_high_score = score_data.score > prev_high_score
        
        # Create game session
        session_data = GameSessionCreate(
            game_id=score_data.game_id,
            score=score_data.score,
            duration=score_data.session_data.get("duration", 0),
            session_data=score_data.session_data
        )
        
        session = await db.create_game_session(current_user.id, session_data)
        
        # Get updated user data
        updated_user = await db.get_user_by_id(current_user.id)
        level_up = updated_user.level > current_user.level if updated_user else False
        
        return ScoreResponse(
            success=True,
            new_high_score=is_new_high_score,
            tokens_awarded=session.tokens_earned,
            total_tokens=updated_user.tokens_earned if updated_user else 0,
            level_up=level_up,
            message=f"Score submitted successfully! {'New high score!' if is_new_high_score else ''}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to submit score: {str(e)}"
        )

@api_router.get("/games/{game_id}/leaderboard", response_model=List[LeaderboardEntry])
async def get_game_leaderboard(
    game_id: str,
    limit: int = 10,
    db: Database = Depends(get_database)
):
    """Get leaderboard for specific game"""
    return await db.get_game_leaderboard(game_id, limit)

# Leaderboard Routes
@api_router.get("/leaderboard/global", response_model=List[GlobalLeaderboardEntry])
async def get_global_leaderboard(
    limit: int = 10,
    db: Database = Depends(get_database)
):
    """Get global leaderboard"""
    return await db.get_global_leaderboard(limit)

# Challenge Routes
@api_router.get("/challenges/daily", response_model=List[Challenge])
async def get_daily_challenges(
    db: Database = Depends(get_database)
):
    """Get daily challenges (public endpoint)"""
    challenges = await db.get_daily_challenges()
    
    # For public access, just return challenges without user progress
    for challenge in challenges:
        challenge.progress = 0
        challenge.completed = False
    
    return challenges

@api_router.get("/challenges/my-progress", response_model=List[Challenge])
async def get_my_challenge_progress(
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Get daily challenges with user progress (authenticated)"""
    challenges = await db.get_daily_challenges()
    
    # Add user progress to each challenge
    for challenge in challenges:
        user_challenge = await db.get_user_challenge_progress(current_user.id, challenge.id)
        if user_challenge:
            challenge.progress = user_challenge.progress
            challenge.completed = user_challenge.completed
        else:
            challenge.progress = 0
            challenge.completed = False
    
    return challenges

@api_router.post("/challenges/complete", response_model=SuccessResponse)
async def update_challenge_progress(
    progress_data: ChallengeProgress,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Update challenge progress"""
    try:
        user_challenge = await db.update_challenge_progress(
            current_user.id,
            progress_data.challenge_id,
            progress_data.progress
        )
        
        message = "Challenge completed!" if user_challenge.completed else "Progress updated"
        
        return SuccessResponse(
            success=True,
            message=message,
            data={
                "progress": user_challenge.progress,
                "completed": user_challenge.completed
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update challenge progress: {str(e)}"
        )

# Platform Routes
@api_router.get("/platform/stats", response_model=PlatformStats)
async def get_platform_stats(db: Database = Depends(get_database)):
    """Get platform statistics"""
    return await db.get_platform_stats()

@api_router.post("/admin/activate-game/{game_id}")
async def activate_game(game_id: str, db: Database = Depends(get_database)):
    """Activate a game (admin endpoint)"""
    result = await db.db.games.update_one(
        {"id": game_id}, 
        {"$set": {"is_active": True}}
    )
    if result.modified_count > 0:
        return {"success": True, "message": f"Game {game_id} activated"}
    else:
        return {"success": False, "message": "Game not found or already active"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()