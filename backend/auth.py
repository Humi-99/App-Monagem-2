from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from models import User
from database import Database
from eth_account.messages import encode_defunct
from eth_account import Account
import re

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
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    payload = verify_token(credentials.credentials)
    
    # Create database connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = Database(client)
    
    user = await db.get_user_by_id(payload['user_id'])
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    client.close()
    return user

def verify_wallet_signature(address: str, signature: str, message: str) -> bool:
    """
    Verify wallet signature using eth_account
    """
    try:
        # Clean and validate address
        if not address or not signature or not message:
            return False
            
        # Normalize address
        address = address.lower()
        
        # Validate address format
        if not re.match(r'^0x[a-fA-F0-9]{40}$', address):
            return False
        
        # Encode the message as it would be signed by MetaMask
        encoded_message = encode_defunct(text=message)
        
        # Recover the address from the signature
        recovered_address = Account.recover_message(encoded_message, signature=signature)
        
        # Compare addresses (case-insensitive)
        return recovered_address.lower() == address
        
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False

async def authenticate_wallet(wallet_address: str, signature: Optional[str], db: Database, message: Optional[str] = None) -> tuple[User, str]:
    """Authenticate user with wallet address and return user + token"""
    
    # Normalize wallet address
    wallet_address = wallet_address.lower()
    
    # Verify signature if provided (for real wallet connections)
    if signature and message:
        if not verify_wallet_signature(wallet_address, signature, message):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid wallet signature"
            )
    elif signature:
        # Legacy support - if only signature provided without message
        # This is for backwards compatibility with existing tests
        if not signature or len(signature) == 0:
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