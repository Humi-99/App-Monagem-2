import api from './api';

class GamesService {
  // Get list of all games
  async getGames() {
    try {
      const response = await api.get('/games/list');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch games:', error);
      // Fallback to mock data if API fails
      const { mockGames } = await import('../components/mockData');
      return mockGames;
    }
  }

  // Submit game score
  async submitScore(gameId, score, sessionData = {}) {
    try {
      const response = await api.post('/games/score', {
        game_id: gameId,
        score: score,
        tokens_earned: score / 10, // 10 points = 1 token
        session_data: sessionData
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit score:', error);
      throw new Error(error.response?.data?.detail || 'Failed to submit score');
    }
  }

  // Get game leaderboard
  async getGameLeaderboard(gameId, limit = 10) {
    try {
      const response = await api.get(`/games/${gameId}/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch game leaderboard:', error);
      // Fallback to mock data
      return [
        { rank: 1, player: "CryptoKing", user_id: "1", score: 15420, games: 45 },
        { rank: 2, player: "SnakeCharmer", user_id: "2", score: 12800, games: 32 },
        { rank: 3, player: "GameMaster", user_id: "3", score: 9500, games: 28 }
      ];
    }
  }

  // Get global leaderboard
  async getGlobalLeaderboard(limit = 10) {
    try {
      const response = await api.get(`/leaderboard/global?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch global leaderboard:', error);
      // Fallback to mock data
      const { mockLeaderboard } = await import('../components/mockData');
      return mockLeaderboard;
    }
  }
}

export default new GamesService();