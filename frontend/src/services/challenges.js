import api from './api';

class ChallengesService {
  // Get daily challenges
  async getDailyChallenges() {
    try {
      const response = await api.get('/challenges/daily');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch daily challenges:', error);
      // Fallback to mock data
      const { mockDailyChallenges } = await import('../components/mockData');
      return mockDailyChallenges;
    }
  }

  // Update challenge progress
  async updateChallengeProgress(challengeId, progress) {
    try {
      const response = await api.post('/challenges/complete', {
        challenge_id: challengeId,
        progress: progress
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update challenge progress:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update progress');
    }
  }

  // Get platform stats
  async getPlatformStats() {
    try {
      const response = await api.get('/platform/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
      // Fallback to mock data
      return {
        total_players: 12847,
        total_games_played: 3200000,
        total_rewards_distributed: '$127K',
        active_players_today: 1250
      };
    }
  }
}

export default new ChallengesService();