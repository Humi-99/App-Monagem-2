#!/usr/bin/env python3
"""
MoanGem Backend API Test Suite
Tests all backend endpoints with proper authentication flow
"""

import requests
import json
import time
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://minigames-crypto.preview.emergentagent.com/api"

class MoanGemAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "version" in data:
                    self.log_test("Health Check", True, f"API is running - {data['message']}", data)
                    return True
                else:
                    self.log_test("Health Check", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_wallet_authentication(self):
        """Test wallet authentication"""
        try:
            # Test with mock wallet address
            wallet_data = {
                "address": "0x742d35Cc6634C0532925a3b8D4C9db96590c4567",
                "signature": "mock_signature_for_testing"
            }
            
            response = requests.post(f"{self.base_url}/auth/connect-wallet", json=wallet_data)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.user_id = data["user"]["id"]
                    self.log_test("Wallet Authentication", True, f"User authenticated: {data['user']['wallet_address']}", data)
                    return True
                else:
                    self.log_test("Wallet Authentication", False, "Missing token or user in response", data)
                    return False
            else:
                self.log_test("Wallet Authentication", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Wallet Authentication", False, f"Error: {str(e)}")
            return False
    
    def test_get_profile(self):
        """Test getting user profile"""
        if not self.auth_token:
            self.log_test("Get Profile", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(f"{self.base_url}/auth/profile", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "wallet_address" in data and "id" in data:
                    self.log_test("Get Profile", True, f"Profile retrieved for user: {data['wallet_address']}", data)
                    return True
                else:
                    self.log_test("Get Profile", False, "Invalid profile data", data)
                    return False
            else:
                self.log_test("Get Profile", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Profile", False, f"Error: {str(e)}")
            return False
    
    def test_games_list(self):
        """Test getting games list"""
        try:
            response = requests.get(f"{self.base_url}/games/list")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    snake_game = next((game for game in data if game["id"] == "snake"), None)
                    if snake_game:
                        self.log_test("Games List", True, f"Found {len(data)} games including Snake game", {"games_count": len(data), "snake_game": snake_game})
                        return True
                    else:
                        self.log_test("Games List", False, "Snake game not found in games list", data)
                        return False
                else:
                    self.log_test("Games List", False, "Empty or invalid games list", data)
                    return False
            else:
                self.log_test("Games List", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Games List", False, f"Error: {str(e)}")
            return False
    
    def test_score_submission(self):
        """Test score submission"""
        if not self.auth_token:
            self.log_test("Score Submission", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            # Submit multiple scores for testing
            scores_to_submit = [
                {"game_id": "snake", "score": 1500, "tokens_earned": 150.0, "session_data": {"level": 5, "duration": 120}},
                {"game_id": "snake", "score": 2800, "tokens_earned": 280.0, "session_data": {"level": 8, "duration": 180}},
                {"game_id": "snake", "score": 4200, "tokens_earned": 420.0, "session_data": {"level": 12, "duration": 240}}
            ]
            
            successful_submissions = 0
            for i, score_data in enumerate(scores_to_submit):
                response = requests.post(f"{self.base_url}/games/score", json=score_data, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        successful_submissions += 1
                        print(f"  Score {i+1}: {score_data['score']} points - {data.get('message', 'Success')}")
                    else:
                        print(f"  Score {i+1}: Failed - {data.get('message', 'Unknown error')}")
                else:
                    print(f"  Score {i+1}: HTTP {response.status_code} - {response.text}")
                
                time.sleep(0.5)  # Small delay between submissions
            
            if successful_submissions > 0:
                self.log_test("Score Submission", True, f"Successfully submitted {successful_submissions}/{len(scores_to_submit)} scores")
                return True
            else:
                self.log_test("Score Submission", False, "No scores were successfully submitted")
                return False
                
        except Exception as e:
            self.log_test("Score Submission", False, f"Error: {str(e)}")
            return False
    
    def test_snake_leaderboard(self):
        """Test snake game leaderboard"""
        try:
            response = requests.get(f"{self.base_url}/games/snake/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Snake Leaderboard", True, f"Retrieved leaderboard with {len(data)} entries", {"entries": len(data), "top_entry": data[0] if data else None})
                    return True
                else:
                    self.log_test("Snake Leaderboard", False, "Invalid leaderboard format", data)
                    return False
            else:
                self.log_test("Snake Leaderboard", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Snake Leaderboard", False, f"Error: {str(e)}")
            return False
    
    def test_global_leaderboard(self):
        """Test global leaderboard"""
        try:
            response = requests.get(f"{self.base_url}/leaderboard/global")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Global Leaderboard", True, f"Retrieved global leaderboard with {len(data)} entries", {"entries": len(data), "top_entry": data[0] if data else None})
                    return True
                else:
                    self.log_test("Global Leaderboard", False, "Invalid leaderboard format", data)
                    return False
            else:
                self.log_test("Global Leaderboard", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Global Leaderboard", False, f"Error: {str(e)}")
            return False
    
    def test_daily_challenges(self):
        """Test daily challenges endpoint"""
        if not self.auth_token:
            self.log_test("Daily Challenges", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = requests.get(f"{self.base_url}/challenges/daily", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Daily Challenges", True, f"Retrieved {len(data)} daily challenges", {"challenges_count": len(data), "challenges": [c.get("title", "Unknown") for c in data]})
                    return True
                else:
                    self.log_test("Daily Challenges", False, "Invalid challenges format", data)
                    return False
            else:
                self.log_test("Daily Challenges", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Daily Challenges", False, f"Error: {str(e)}")
            return False
    
    def test_platform_stats(self):
        """Test platform statistics"""
        try:
            response = requests.get(f"{self.base_url}/platform/stats")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_players", "total_games_played", "total_rewards_distributed", "active_players_today"]
                if all(field in data for field in required_fields):
                    self.log_test("Platform Stats", True, f"Platform stats retrieved successfully", data)
                    return True
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Platform Stats", False, f"Missing fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("Platform Stats", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Platform Stats", False, f"Error: {str(e)}")
            return False
    
    def test_user_stats(self):
        """Test user statistics endpoint"""
        if not self.user_id:
            self.log_test("User Stats", False, "No user ID available")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/users/stats/{self.user_id}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_score", "games_played", "rank", "level", "tokens_earned", "nfts_owned"]
                if all(field in data for field in required_fields):
                    self.log_test("User Stats", True, f"User stats retrieved - Score: {data['total_score']}, Games: {data['games_played']}, Level: {data['level']}", data)
                    return True
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("User Stats", False, f"Missing fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("User Stats", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("User Stats", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"\n🚀 Starting MoanGem Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Wallet Authentication", self.test_wallet_authentication),
            ("Get Profile", self.test_get_profile),
            ("Games List", self.test_games_list),
            ("Score Submission", self.test_score_submission),
            ("Snake Leaderboard", self.test_snake_leaderboard),
            ("Global Leaderboard", self.test_global_leaderboard),
            ("Daily Challenges", self.test_daily_challenges),
            ("Platform Stats", self.test_platform_stats),
            ("User Stats", self.test_user_stats)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
                failed += 1
            
            time.sleep(0.5)  # Small delay between tests
        
        print("\n" + "=" * 60)
        print(f"📊 Test Results Summary:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed, failed

def main():
    """Main test execution"""
    tester = MoanGemAPITester()
    passed, failed = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "passed": passed,
                "failed": failed,
                "total": passed + failed,
                "success_rate": (passed/(passed+failed)*100) if (passed+failed) > 0 else 0
            },
            "detailed_results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    # Return exit code based on results
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    exit(main())