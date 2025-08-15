# MoanGem Backend Integration Contracts

## API Contracts

### Authentication & User Management
```
POST /api/auth/connect-wallet
- Body: { address: string, signature: string }
- Response: { user: User, token: string }

GET /api/auth/profile
- Headers: Authorization: Bearer <token>
- Response: { user: User, stats: UserStats }
```

### User & Stats
```
POST /api/users/create
- Body: { walletAddress: string, username?: string }
- Response: { user: User }

GET /api/users/stats/:userId
- Response: { stats: UserStats, achievements: Achievement[] }

PUT /api/users/stats/:userId
- Body: { totalScore: number, gamesPlayed: number, level: number }
- Response: { stats: UserStats }
```

### Games & Scores
```
POST /api/games/score
- Body: { gameId: string, score: number, tokensEarned: number, sessionData: object }
- Headers: Authorization: Bearer <token>
- Response: { success: boolean, newHighScore: boolean, tokensAwarded: number }

GET /api/games/:gameId/leaderboard
- Query: ?limit=10&timeframe=all|daily|weekly
- Response: { leaderboard: LeaderboardEntry[] }

GET /api/games/list
- Response: { games: Game[] }
```

### Challenges & Rewards
```
GET /api/challenges/daily
- Headers: Authorization: Bearer <token>
- Response: { challenges: Challenge[] }

POST /api/challenges/complete
- Body: { challengeId: string, progress: number }
- Headers: Authorization: Bearer <token>
- Response: { challenge: Challenge, reward: Reward }
```

### Platform Data
```
GET /api/platform/stats
- Response: { totalPlayers: number, totalGamesPlayed: number, totalRewards: string }

GET /api/leaderboard/global
- Query: ?limit=10
- Response: { leaderboard: GlobalLeaderboardEntry[] }
```

## Data Models

### User
```javascript
{
  _id: ObjectId,
  walletAddress: string,
  username: string,
  level: number,
  totalScore: number,
  gamesPlayed: number,
  tokensEarned: number,
  nftsOwned: number,
  joinedAt: Date,
  lastActive: Date
}
```

### GameSession
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  gameId: string,
  score: number,
  tokensEarned: number,
  duration: number,
  sessionData: object, // game-specific data
  playedAt: Date
}
```

### Challenge
```javascript
{
  _id: ObjectId,
  title: string,
  description: string,
  gameId: string,
  targetValue: number,
  reward: {
    type: 'tokens'|'nft'|'multiplier',
    amount: number,
    description: string
  },
  duration: number, // in hours
  isDaily: boolean,
  createdAt: Date
}
```

### UserChallenge
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  challengeId: ObjectId,
  progress: number,
  completed: boolean,
  completedAt: Date
}
```

## Mock Data to Replace

### From mockData.js - Replace with Real API Calls:

1. **mockUserData.wallet** → `/api/auth/profile`
2. **mockUserData.stats** → `/api/users/stats/:userId`
3. **mockUserData.achievements** → `/api/users/stats/:userId` (achievements array)
4. **mockGames** → `/api/games/list`
5. **mockLeaderboard** → `/api/leaderboard/global`
6. **mockDailyChallenges** → `/api/challenges/daily`

## Frontend Integration Plan

### 1. Create API Service Layer
- `/src/services/api.js` - Axios configuration with auth interceptors
- `/src/services/auth.js` - Wallet connection & user management
- `/src/services/games.js` - Game-related API calls
- `/src/services/challenges.js` - Challenge management

### 2. Update Components
- **Header.jsx**: Real wallet connection, user stats from API
- **GameCard.jsx**: Real game data from `/api/games/list`
- **SnakeGame.jsx**: Score submission to `/api/games/score`
- **App.js**: Real leaderboard, challenges, platform stats

### 3. State Management
- Create React Context for user authentication
- Manage global state for user stats, challenges
- Handle loading states and error handling

### 4. Game Integration
- Snake Game: Submit scores after game over
- Track game sessions with detailed metrics
- Award tokens based on performance
- Update user stats in real-time

## Backend Implementation Priority

### Phase 1: Core Backend
1. User management (wallet-based auth)
2. Game session tracking
3. Score submission and leaderboards
4. Basic platform stats

### Phase 2: Advanced Features  
1. Daily challenges system
2. Achievement tracking
3. Token reward calculations
4. NFT integration preparation

### Phase 3: Blockchain Integration
1. Real wallet verification
2. Token minting/distribution
3. NFT rewards system
4. Cross-chain compatibility

## Security Considerations
- JWT token authentication
- Wallet signature verification
- Score validation and anti-cheat measures
- Rate limiting on API endpoints
- Input validation and sanitization

## Error Handling
- Standardized error responses
- Graceful fallbacks to mock data if API fails
- User-friendly error messages
- Retry mechanisms for network failures