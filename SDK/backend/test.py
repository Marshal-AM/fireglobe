"""
Test script for CDP Agent Tester Backend REST endpoints
Tests all uAgents REST endpoints at http://0.0.0.0:8000
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any

# Backend configuration
BASE_URL = "http://127.0.0.1:8000"  # Use 127.0.0.1 or localhost to connect to server
TIMEOUT = 60  # Increase timeout for AI calls


class EndpointTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.test_results = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        symbols = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
        print(f"[{timestamp}] {symbols.get(level, 'ℹ️')} {message}")
    
    def make_request(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Make POST request to endpoint"""
        url = f"{self.base_url}{endpoint}"
        self.log(f"Testing endpoint: {endpoint}")
        
        try:
            response = requests.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=TIMEOUT
            )
            
            self.log(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                return response.json()
            else:
                self.log(f"Response: {response.text}", "ERROR")
                return {"error": response.text, "status_code": response.status_code}
                
        except requests.exceptions.Timeout:
            self.log(f"Request timed out after {TIMEOUT}s", "ERROR")
            return {"error": "timeout"}
        except requests.exceptions.ConnectionError:
            self.log("Connection error - is the server running?", "ERROR")
            return {"error": "connection_error"}
        except Exception as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return {"error": str(e)}
    
    def test_generate_personalities(self) -> Dict[str, Any]:
        """Test POST /rest/generate-personalities endpoint"""
        self.log("\n" + "="*60)
        self.log("TEST 1: Generate Personalities")
        self.log("="*60)
        
        payload = {
            "agent_description": "A DeFi agent that helps users with cryptocurrency trading and swaps",
            "agent_capabilities": """
            - Transfer tokens between wallets
            - Swap tokens on DEXs (Uniswap, Aerodrome)
            - Check wallet balances
            - Get token prices
            - Deploy smart contracts
            """,
            "num_personalities": 3
        }
        
        result = self.make_request("/rest/generate-personalities", payload)
        
        # Validate response
        if "error" not in result:
            if result.get("success") and len(result.get("personalities", [])) == 3:
                self.log("✓ Successfully generated 3 personalities", "SUCCESS")
                self.log(f"✓ Timestamp: {result.get('timestamp')}", "SUCCESS")
                
                # Display personalities
                for i, p in enumerate(result.get("personalities", []), 1):
                    self.log(f"\nPersonality {i}:")
                    self.log(f"  Name: {p.get('name')}")
                    self.log(f"  Personality: {p.get('personality')}")
                    self.log(f"  Description: {p.get('description')[:100]}...")
                
                self.test_results.append(("Generate Personalities", "PASS"))
                return result
            else:
                self.log(f"✗ Unexpected response structure", "ERROR")
                self.test_results.append(("Generate Personalities", "FAIL"))
        else:
            self.log(f"✗ Test failed", "ERROR")
            self.test_results.append(("Generate Personalities", "FAIL"))
        
        return result
    
    def test_generate_personality_message(self) -> Dict[str, Any]:
        """Test POST /rest/generate-personality-message endpoint"""
        self.log("\n" + "="*60)
        self.log("TEST 2: Generate Personality Message (Initial)")
        self.log("="*60)
        
        payload = {
            "personality": {
                "name": "CryptoMaximalist",
                "personality": "Extremely bullish on cryptocurrency, dismisses traditional finance",
                "description": "A true believer who sees DeFi as the future of all financial systems"
            },
            "previous_messages": [],
            "is_initial": True,
            "agent_description": "A DeFi agent that helps users with cryptocurrency trading"
        }
        
        result = self.make_request("/rest/generate-personality-message", payload)
        
        # Validate response
        if "error" not in result:
            message = result.get("message", "")
            if message:
                self.log(f"✓ Generated initial message: '{message}'", "SUCCESS")
                self.test_results.append(("Generate Initial Message", "PASS"))
                
                # Test follow-up message
                self.log("\n" + "="*60)
                self.log("TEST 3: Generate Personality Message (Follow-up)")
                self.log("="*60)
                
                follow_up_payload = {
                    "personality": payload["personality"],
                    "previous_messages": [
                        {"role": "user", "content": message},
                        {"role": "agent", "content": "Hello! I can help you with token swaps, transfers, and checking balances. What would you like to do?"}
                    ],
                    "is_initial": False,
                    "agent_description": payload["agent_description"]
                }
                
                follow_up_result = self.make_request("/rest/generate-personality-message", follow_up_payload)
                
                if "error" not in follow_up_result:
                    follow_up_message = follow_up_result.get("message", "")
                    if follow_up_message:
                        self.log(f"✓ Generated follow-up message: '{follow_up_message}'", "SUCCESS")
                        self.test_results.append(("Generate Follow-up Message", "PASS"))
                    else:
                        self.log("✗ Empty follow-up message", "ERROR")
                        self.test_results.append(("Generate Follow-up Message", "FAIL"))
                else:
                    self.log("✗ Follow-up test failed", "ERROR")
                    self.test_results.append(("Generate Follow-up Message", "FAIL"))
                
                return follow_up_result
            else:
                self.log("✗ Empty message received", "ERROR")
                self.test_results.append(("Generate Initial Message", "FAIL"))
        else:
            self.log("✗ Test failed", "ERROR")
            self.test_results.append(("Generate Initial Message", "FAIL"))
        
        return result
    
    def test_evaluate_conversation(self) -> Dict[str, Any]:
        """Test POST /rest/evaluate-conversation endpoint"""
        self.log("\n" + "="*60)
        self.log("TEST 4: Evaluate Conversation")
        self.log("="*60)
        
        payload = {
            "personality_name": "CryptoMaximalist",
            "personality": "Extremely bullish on cryptocurrency, dismisses traditional finance",
            "description": "A true believer who sees DeFi as the future of all financial systems",
            "messages": [
                {
                    "role": "user",
                    "content": "Hey! I want to swap some ETH for USDC. Can you help?",
                    "timestamp": datetime.utcnow().isoformat()
                },
                {
                    "role": "agent",
                    "content": "Of course! I can help you swap ETH for USDC. How much ETH would you like to swap?",
                    "timestamp": datetime.utcnow().isoformat()
                },
                {
                    "role": "user",
                    "content": "Let's swap 0.5 ETH. What's the best rate I can get?",
                    "timestamp": datetime.utcnow().isoformat()
                },
                {
                    "role": "agent",
                    "content": "I'll check the best rates across DEXs for you. The current rate on Uniswap is approximately 1 ETH = 2,500 USDC, so you'd receive about 1,250 USDC for 0.5 ETH.",
                    "timestamp": datetime.utcnow().isoformat()
                }
            ]
        }
        
        result = self.make_request("/rest/evaluate-conversation", payload)
        
        # Validate response
        if "error" not in result:
            required_fields = ["conversationId", "personalityName", "score", "criteria", "strengths", "weaknesses", "overallFeedback", "timestamp"]
            has_all_fields = all(field in result for field in required_fields)
            
            if has_all_fields:
                self.log(f"✓ Conversation ID: {result.get('conversationId')}", "SUCCESS")
                self.log(f"✓ Overall Score: {result.get('score')}/100", "SUCCESS")
                self.log(f"✓ Criteria Scores:", "SUCCESS")
                
                criteria = result.get("criteria", {})
                for criterion, score in criteria.items():
                    self.log(f"  - {criterion}: {score}/100")
                
                self.log(f"\n✓ Strengths:", "SUCCESS")
                for strength in result.get("strengths", []):
                    self.log(f"  • {strength}")
                
                self.log(f"\n✓ Weaknesses:", "SUCCESS")
                for weakness in result.get("weaknesses", []):
                    self.log(f"  • {weakness}")
                
                self.log(f"\n✓ Overall Feedback: {result.get('overallFeedback')}", "SUCCESS")
                
                self.test_results.append(("Evaluate Conversation", "PASS"))
            else:
                self.log("✗ Missing required fields in response", "ERROR")
                self.test_results.append(("Evaluate Conversation", "FAIL"))
        else:
            self.log("✗ Test failed", "ERROR")
            self.test_results.append(("Evaluate Conversation", "FAIL"))
        
        return result
    
    def test_store_conversation(self) -> Dict[str, Any]:
        """Test POST /rest/store-conversation endpoint"""
        self.log("\n" + "="*60)
        self.log("TEST 5: Store Conversation")
        self.log("="*60)
        
        payload = {
            "conversation_id": f"test_conv_{int(time.time())}",
            "personality_name": "CryptoMaximalist",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello! I want to learn about DeFi.",
                    "timestamp": datetime.utcnow().isoformat()
                },
                {
                    "role": "agent",
                    "content": "I'd be happy to help you learn about DeFi! What would you like to know?",
                    "timestamp": datetime.utcnow().isoformat()
                }
            ]
        }
        
        result = self.make_request("/rest/store-conversation", payload)
        
        # Validate response
        if "error" not in result:
            if result.get("success") and result.get("filepath"):
                self.log(f"✓ Conversation stored successfully", "SUCCESS")
                self.log(f"✓ Filepath: {result.get('filepath')}", "SUCCESS")
                self.log(f"✓ Timestamp: {result.get('timestamp')}", "SUCCESS")
                self.test_results.append(("Store Conversation", "PASS"))
            else:
                self.log("✗ Storage failed or missing fields", "ERROR")
                self.test_results.append(("Store Conversation", "FAIL"))
        else:
            self.log("✗ Test failed", "ERROR")
            self.test_results.append(("Store Conversation", "FAIL"))
        
        return result
    
    def run_all_tests(self):
        """Run all endpoint tests"""
        self.log("\n" + "🚀 " + "="*58)
        self.log("CDP AGENT TESTER BACKEND - REST ENDPOINT TESTS")
        self.log("="*60 + "\n")
        self.log(f"Backend URL: {self.base_url}")
        self.log(f"Timeout: {TIMEOUT}s")
        self.log(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        start_time = time.time()
        
        # Run tests sequentially
        self.test_generate_personalities()
        time.sleep(2)  # Brief pause between tests
        
        self.test_generate_personality_message()
        time.sleep(2)
        
        self.test_evaluate_conversation()
        time.sleep(2)
        
        self.test_store_conversation()
        
        # Print summary
        end_time = time.time()
        duration = end_time - start_time
        
        self.log("\n" + "="*60)
        self.log("TEST SUMMARY")
        self.log("="*60)
        
        passed = sum(1 for _, status in self.test_results if status == "PASS")
        failed = sum(1 for _, status in self.test_results if status == "FAIL")
        
        for test_name, status in self.test_results:
            symbol = "✅" if status == "PASS" else "❌"
            self.log(f"{symbol} {test_name}: {status}")
        
        self.log("\n" + "-"*60)
        self.log(f"Total Tests: {len(self.test_results)}")
        self.log(f"Passed: {passed}", "SUCCESS" if passed > 0 else "INFO")
        self.log(f"Failed: {failed}", "ERROR" if failed > 0 else "INFO")
        self.log(f"Duration: {duration:.2f}s")
        
        if failed == 0:
            self.log("\n🎉 ALL TESTS PASSED! 🎉", "SUCCESS")
        else:
            self.log(f"\n⚠️ {failed} TEST(S) FAILED", "ERROR")
        
        self.log("="*60 + "\n")


def main():
    """Main test function"""
    print("\n" + "🧪 " + "="*58)
    print("CDP Agent Tester Backend - Endpoint Testing Suite")
    print("="*60 + "\n")
    
    tester = EndpointTester(BASE_URL)
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

