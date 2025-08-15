from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from models import User
from database import Database

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'moangem-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

def create_access_token(user_id: str, wallet_address: str) -> str:
    """Create JWT access token for user"""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'wallet_address': wallet_address,
        'exp': expire,
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user from JWT token"""
    payload = verify_token(credentials.credentials)
    db = Database()
    user = await db.get_user_by_id(payload['user_id'])
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

def verify_wallet_signature(address: str, signature: str) -> bool:
    """
    Verify wallet signature (simplified for demo)
    In production, this would verify the actual cryptographic signature
    """
    # For demo purposes, we'll accept any signature
    # In production, implement proper signature verification
    return len(signature) > 0 if signature else True

async def authenticate_wallet(wallet_address: str, signature: Optional[str], db: Database) -> tuple[User, str]:
    """Authenticate user with wallet address and return user + token"""
    
    # Verify signature if provided
    if signature and not verify_wallet_signature(wallet_address, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid wallet signature"
        )
    
    # Get or create user
    user = await db.get_user_by_wallet(wallet_address)
    if not user:
        from models import UserCreate
        user_data = UserCreate(wallet_address=wallet_address)
        user = await db.create_user(user_data)
    
    # Create access token
    token = create_access_token(user.id, user.wallet_address)
    
    return user, token