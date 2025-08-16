// Mock data for MoanGem platform
export const mockUserData = {
  wallet: {
    connected: false,
    address: "0x742d35Cc6647C3A28c3e7",
    balance: {
      eth: "2.45",
      tokens: "1250.50",
      nfts: 12
    }
  },
  stats: {
    totalScore: 15420,
    gamesPlayed: 47,
    rank: 142,
    level: 8
  },
  achievements: [
    { id: 1, name: "Snake Master", description: "Score 10,000+ in Snake Game", unlocked: true },
    { id: 2, name: "Dodge Champion", description: "Survive 60 seconds in Gas-Free Dodger", unlocked: true },
    { id: 3, name: "Card Wizard", description: "Complete Solitaire in under 2 minutes", unlocked: false }
  ]
};

export const mockGames = [
  {
    id: 1,
    name: "Snake Game",
    description: "Ultimate Snake adventure with power-ups, combos, and MONAD rewards",
    category: "Retro",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop",
    playCount: 1205,
    avgScore: 8450,
    rewards: ["MONAD tokens", "Snake NFTs"],
    isActive: true
  },
  {
    id: 2,
    name: "Gas-Free Dodger",
    description: "Help Spiky dodge obstacles in this fast-paced adventure with crypto rewards",
    category: "Arcade",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
    playCount: 892,
    avgScore: 12300,
    rewards: ["ETH rewards", "Dodge NFTs"],
    isActive: true
  },
  {
    id: 3,
    name: "Solitaire Blitz",
    description: "Fast-paced solitaire with blockchain-themed cards and bonuses",
    category: "Card",
    thumbnail: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop",
    playCount: 654,
    avgScore: 9200,
    rewards: ["Card NFTs", "POLY tokens"],
    isActive: true
  },
  {
    id: 4,
    name: "CryptoBlades",
    description: "RPG-style battling game with crypto rewards system",
    category: "Strategy",
    thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    playCount: 445,
    avgScore: 15600,
    rewards: ["Weapon NFTs", "SKILL tokens"],
    isActive: false
  }
];

export const mockLeaderboard = [
  { rank: 1, player: "CryptoKing", score: 45230, games: 156 },
  { rank: 2, player: "BlockchainMaster", score: 42100, games: 142 },
  { rank: 3, player: "SnakeCharmer", score: 38950, games: 98 },
  { rank: 4, player: "DodgeGuru", score: 35670, games: 127 },
  { rank: 5, player: "CardShark", score: 32480, games: 89 }
];

export const mockDailyChallenges = [
  {
    id: 1,
    title: "Snake Streak",
    description: "Score 5000+ in Snake Game",
    reward: "50 MONAD tokens",
    progress: 75,
    completed: false
  },
  {
    id: 2,
    title: "Perfect Dodge",
    description: "Avoid all obstacles for 30 seconds",
    reward: "25 ETH points",
    progress: 100,
    completed: true
  },
  {
    id: 3,
    title: "Card Combo",
    description: "Complete 3 Solitaire games",
    reward: "Rare Card NFT",
    progress: 33,
    completed: false
  }
];